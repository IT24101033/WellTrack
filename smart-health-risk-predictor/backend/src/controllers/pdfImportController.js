'use strict';

/**
 * controllers/pdfImportController.js
 *
 * POST /api/reports/import-health-pdf
 *
 * Flow:
 *  1. Validate file (PDF, ≤ 10 MB)
 *  2. Send PDF to OCR.space API → get plain text
 *  3. Parse heart-rate rows from the text
 *  4. Upsert into health_records (duplicate-safe)
 *  5. Recompute analytics summary for the user
 *  6. Run heuristic risk calculation
 *  7. Store prediction_record + uploaded_report metadata
 *  8. Return structured JSON response
 */

const mongoose = require('mongoose');

const HealthRecord = require('../models/healthRecordModel');
const AnalyticsSummary = require('../models/analyticsSummaryModel');
const PredictionRecord = require('../models/predictionRecordModel');
const UploadedReport = require('../models/uploadedReportModel');

// ─── Response Helpers ─────────────────────────────────────────────────────────
const ok = (res, data, message = 'Success', status = 200) =>
    res.status(status).json({ success: true, message, ...data });

const fail = (res, message, status = 400) =>
    res.status(status).json({ success: false, message });

// ─── OCR.space Extraction ─────────────────────────────────────────────────────
/**
 * Sends the PDF buffer to OCR.space and returns the extracted plain text.
 * Uses Engine 2 + isTable=true for best table accuracy.
 * Node v22 has native fetch + FormData — no extra packages needed.
 */
const extractTextWithOCR = async (pdfBuffer, filename) => {
    const { FormData, Blob } = globalThis; // available in Node 18+
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

    formData.append('file', blob, filename || 'upload.pdf');
    formData.append('apikey', process.env.OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isTable', 'true');   // better column preservation
    formData.append('OCREngine', '2');      // engine 2 is more accurate for documents
    formData.append('filetype', 'PDF');
    formData.append('scale', 'true');   // upscale low-res pages

    const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`OCR API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
        const msg = Array.isArray(data.ErrorMessage)
            ? data.ErrorMessage.join(' ')
            : (data.ErrorMessage || 'OCR processing failed');

        // Page-limit warning: OCR.space still processes what it can —
        // use the partial results instead of throwing
        const hasPartialResults = Array.isArray(data.ParsedResults) && data.ParsedResults.length > 0;
        if (hasPartialResults && msg.toLowerCase().includes('page limit')) {
            console.warn('[OCR] Page limit reached — using partial results:', msg);
        } else if (!hasPartialResults) {
            throw new Error(msg);
        }
    }

    // Concatenate text from every page
    const text = (data.ParsedResults || [])
        .map(r => r.ParsedText || '')
        .join('\n');

    return text;
};

// ─── Month map ─────────────────────────────────────────────────────────────────
const MONTH_MAP = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

// ─── Year extraction ───────────────────────────────────────────────────────────
const extractYearFromText = (text) => {
    const currentYear = new Date().getFullYear();
    const matches = text.match(/\b(20\d{2})\b/g);
    if (matches) {
        const years = matches.map(Number).filter(y => y >= currentYear - 5 && y <= currentYear + 1);
        if (years.length > 0) return Math.max(...years);
    }
    return currentYear;
};

// ─── Date parser ──────────────────────────────────────────────────────────────
/**
 * "Feb 25" or "Feb 25, 2026" → "2026-02-25"
 */
const parseDate = (str, defaultYear) => {
    if (!str) return null;
    const m = str.trim().match(/^([A-Za-z]{3})\.?\s+(\d{1,2})(?:[,\s]+(\d{4}))?$/);
    if (!m) return null;
    const month = MONTH_MAP[m[1].toLowerCase()];
    if (!month) return null;
    const day = String(parseInt(m[2], 10)).padStart(2, '0');
    const year = m[3] ? m[3] : String(defaultYear);
    return `${year}-${month}-${day}`;
};

// ─── Time parser ──────────────────────────────────────────────────────────────
/**
 * "12:50 PM" → "12:50"  |  "9:02 AM" → "09:02"
 * "11:48 AM - 12:04 PM" (range) → "11:48"  (use start)
 */
const parseTime12 = (str) => {
    if (!str) return null;
    const timeStr = str.split(/\s*-\s*/)[0].trim();
    const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = m[2];
    const period = m[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
};

// ─── PDF Row Parser ────────────────────────────────────────────────────────────
/**
 * Parses OCR-extracted text lines into heart-rate records.
 *
 * Handles OCR.space output which may have varied spacing. Uses two strategies:
 *   1. Tab-split (if OCR preserved tab stops)
 *   2. Regex — date + 12h-time + HR + optional tag
 *
 * Supports formats:
 *   Feb 25   12:50 PM   86
 *   Feb 25   11:48 AM - 12:04 PM   90-135   Exercising
 */
const parsePdfRows = (rawText, defaultYear) => {
    const records = [];

    const MONTH_START = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}/i;
    const HR_RANGE = /^(\d{2,3})-(\d{2,3})$/;
    const HR_SINGLE = /^(\d{2,3})$/;

    const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    for (const raw of lines) {
        const trimmed = raw.trim();
        if (!MONTH_START.test(trimmed)) continue;

        // ── Strategy 1: tab-separated ──────────────────────────────────────
        let parts = trimmed.split('\t').map(p => p.trim()).filter(Boolean);

        // ── Strategy 2: regex if tab-split doesn't yield usable HR ─────────
        const hrTok = parts[2];
        if (parts.length < 3 || !(HR_RANGE.test(hrTok) || HR_SINGLE.test(hrTok))) {
            const m = trimmed.match(
                /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:[,\s]+\d{4})?)\s+(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM))?)\s+(\d{2,3}(?:-\d{2,3})?)\s*(Exercising|Normal)?\s*(.*)?$/i
            );
            if (!m) continue;
            parts = [m[1], m[2], m[3], (m[4] || ''), (m[5] || '')].map(p => p.trim());
        }

        if (parts.length < 3) continue;

        const date = parseDate(parts[0], defaultYear);
        if (!date) continue;

        const time = parseTime12(parts[1]);

        let hr_min, hr_max;
        const rangeM = String(parts[2]).match(HR_RANGE);
        const singleM = String(parts[2]).match(HR_SINGLE);
        if (rangeM) {
            hr_min = parseInt(rangeM[1], 10);
            hr_max = parseInt(rangeM[2], 10);
        } else if (singleM) {
            hr_min = parseInt(singleM[1], 10);
            hr_max = hr_min;
        } else {
            continue;
        }
        if (hr_min < 20 || hr_max > 300 || hr_min > hr_max) continue;

        const rawTag = (parts[3] || '').trim();
        const tag = rawTag.toLowerCase() === 'exercising' ? 'Exercising' : 'Normal';
        const notes = (parts[4] || '').trim() || null;

        records.push({ date, time, hr_min, hr_max, tag, notes });
    }

    return records;
};

// ─── Analytics Computation ────────────────────────────────────────────────────
const recomputeAnalytics = async (userId) => {
    const [agg] = await HealthRecord.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$user_id',
                avg_hr: { $avg: { $divide: [{ $add: ['$hr_min', '$hr_max'] }, 2] } },
                min_hr: { $min: '$hr_min' },
                max_hr: { $max: '$hr_max' },
                exercise_sessions: { $sum: { $cond: [{ $eq: ['$tag', 'Exercising'] }, 1, 0] } },
                total_records: { $sum: 1 },
            },
        },
    ]);

    const summaryData = {
        avg_hr: agg ? parseFloat(agg.avg_hr.toFixed(2)) : null,
        min_hr: agg?.min_hr ?? null,
        max_hr: agg?.max_hr ?? null,
        exercise_sessions: agg?.exercise_sessions ?? 0,
        total_records: agg?.total_records ?? 0,
        last_updated: new Date(),
    };

    await AnalyticsSummary.findOneAndUpdate(
        { user_id: userId },
        { $set: summaryData },
        { upsert: true, new: true }
    );

    return summaryData;
};

// ─── Heuristic Risk Model ──────────────────────────────────────────────────────
const calculateRisk = (summary) => {
    const avg_hr = summary.avg_hr ?? 75;
    const max_hr = summary.max_hr ?? 100;
    const min_hr = summary.min_hr ?? 60;
    const exercise_sessions = summary.exercise_sessions ?? 0;

    const resting_hr_trend = Math.min(Math.abs(avg_hr - 70) / 50, 1);
    const hrScore = Math.min((avg_hr - 50) / 100, 1);
    const maxScore = Math.min((max_hr - 80) / 120, 1);
    const minScore = Math.min((min_hr - 40) / 80, 1);
    const exerciseBenefit = Math.min(exercise_sessions / 10, 1) * 0.2;

    const raw = hrScore * 0.40 + maxScore * 0.30 + minScore * 0.15 + resting_hr_trend * 0.15 - exerciseBenefit;
    const risk_score = parseFloat(Math.min(Math.max(raw, 0), 1).toFixed(4));
    const risk_level = risk_score < 0.35 ? 'low' : risk_score < 0.65 ? 'moderate' : 'high';

    return {
        risk_score,
        risk_level,
        features_snapshot: {
            avg_hr, max_hr, min_hr,
            exercise_sessions,
            resting_hr_trend: parseFloat(resting_hr_trend.toFixed(4)),
        },
    };
};

// ─── Date Range Helper ─────────────────────────────────────────────────────────
const getDateRange = (records) => {
    if (!records.length) return { start: null, end: null };
    const dates = records.map(r => r.date).sort();
    return { start: dates[0], end: dates[dates.length - 1] };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/import-health-pdf
// ─────────────────────────────────────────────────────────────────────────────
const importHealthPdf = async (req, res) => {
    try {
        // ── 1. File Validation ─────────────────────────────────────────────
        if (!req.file) {
            return fail(res, 'No file uploaded. Please attach a PDF file.', 400);
        }

        const { mimetype, size, originalname, buffer } = req.file;

        if (mimetype !== 'application/pdf') {
            return fail(res, 'Invalid file type. Only PDF files are accepted.', 422);
        }
        if (size > 10 * 1024 * 1024) {
            return fail(res, 'File exceeds the 10 MB size limit.', 422);
        }

        // ── 2. Extract text via OCR.space ──────────────────────────────────
        if (!process.env.OCR_API_KEY) {
            return fail(res, 'Server is not configured with an OCR API key.', 500);
        }

        let rawText;
        try {
            rawText = await extractTextWithOCR(buffer, originalname);
        } catch (err) {
            console.error('[importHealthPdf] OCR error:', err.message);
            return fail(res, `OCR extraction failed: ${err.message}`, 422);
        }

        if (!rawText || !rawText.trim()) {
            return fail(res, 'The PDF appears to be image-only or blank — no text could be extracted.', 422);
        }

        // ── 3. Parse rows ──────────────────────────────────────────────────
        const defaultYear = extractYearFromText(rawText);

        if (process.env.NODE_ENV !== 'production') {
            const preview = rawText.split('\n').slice(0, 30).join('\n');
            console.log('[importHealthPdf] OCR text preview:\n', preview);
            console.log('[importHealthPdf] Detected year:', defaultYear);
        }

        const rows = parsePdfRows(rawText, defaultYear);

        console.log(`[importHealthPdf] Parsed ${rows.length} valid rows from OCR output`);

        if (rows.length === 0) {
            return fail(
                res,
                'No heart rate records found in this PDF. ' +
                'Ensure the PDF contains a table with Date, Time, and Heart Rate (bpm) columns.',
                422
            );
        }

        // ── 4. Upsert records (duplicate-safe) ─────────────────────────────
        const userId = req.user.id;

        const bulkOps = rows.map(r => ({
            updateOne: {
                filter: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    date: r.date,
                    time: r.time,
                },
                update: {
                    $setOnInsert: {
                        user_id: new mongoose.Types.ObjectId(userId),
                        date: r.date,
                        time: r.time,
                        source: 'pdf_import',
                    },
                    $set: {
                        hr_min: r.hr_min,
                        hr_max: r.hr_max,
                        tag: r.tag,
                        notes: r.notes,
                    },
                },
                upsert: true,
            },
        }));

        await HealthRecord.bulkWrite(bulkOps, { ordered: false });

        // ── 5 & 6. Analytics + Risk ────────────────────────────────────────
        const summary = await recomputeAnalytics(userId);
        const { risk_score, risk_level, features_snapshot } = calculateRisk(summary);

        // ── 7. Persist prediction + upload metadata ────────────────────────
        const dateRange = getDateRange(rows);

        await Promise.all([
            PredictionRecord.create({
                user_id: new mongoose.Types.ObjectId(userId),
                risk_score,
                risk_level,
                triggered_by: 'pdf_import',
                features_snapshot,
            }),
            UploadedReport.create({
                user_id: new mongoose.Types.ObjectId(userId),
                file_name: originalname,
                date_range: dateRange,
                records_count: rows.length,
                uploaded_at: new Date(),
            }),
        ]);

        // ── 8. Response ────────────────────────────────────────────────────
        return ok(res, {
            message: 'PDF processed successfully',
            summary: {
                total_records: rows.length,
                date_range: `${dateRange.start} → ${dateRange.end}`,
                avg_hr: summary.avg_hr,
                min_hr: summary.min_hr,
                max_hr: summary.max_hr,
                exercise_sessions: summary.exercise_sessions,
            },
            risk: { score: risk_score, level: risk_level },
        });

    } catch (err) {
        console.error('[importHealthPdf]', err);
        return fail(res, 'Internal server error while processing PDF.', 500);
    }
};

module.exports = { importHealthPdf };
