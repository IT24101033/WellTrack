'use strict';

/**
 * controllers/reportController.js
 *
 * All HTTP handlers for the Reporting & Analytics module.
 * Uses Mongoose models directly — no raw SQL.
 *
 * Response envelope:  { success, message, data?, meta? }
 */

const Report = require('../models/reportModel');
const Dashboard = require('../models/dashboardModel');
const {
    computeAggregates,
    classifyRisk,
    validateReportInput,
    validateDateFilter,
    isValidObjectId,
} = require('../utils/analyticsHelper');

// ─── Response Helpers ─────────────────────────────────────────────────────────
const ok = (res, data, message = 'Success', status = 200, meta = null) => {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(status).json(body);
};
const fail = (res, message, status = 400, errors = null) => {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(status).json(body);
};

// ─── Dashboard Upsert Helper ──────────────────────────────────────────────────
/**
 * Recompute & save the analytics dashboard for a user from their reports.
 * Uses MongoDB aggregation pipeline — efficient at 150k+ documents.
 */
const refreshDashboard = async (userId) => {
    const [stats] = await Report.aggregate([
        { $match: { user_id: new (require('mongoose').Types.ObjectId)(userId) } },
        {
            $group: {
                _id: '$user_id',
                total_reports: { $sum: 1 },
                average_risk_score: { $avg: '$predicted_risk_score' },
                high_risk_count: {
                    $sum: { $cond: [{ $eq: ['$predicted_risk_level', 'high'] }, 1, 0] },
                },
                moderate_risk_count: {
                    $sum: { $cond: [{ $eq: ['$predicted_risk_level', 'moderate'] }, 1, 0] },
                },
                low_risk_count: {
                    $sum: { $cond: [{ $eq: ['$predicted_risk_level', 'low'] }, 1, 0] },
                },
            },
        },
    ]);

    // Fetch the most recent report's risk level separately (sort by createdAt)
    const latest = await Report
        .findOne({ user_id: userId })
        .sort({ createdAt: -1 })
        .select('predicted_risk_level')
        .lean();

    const dashboardData = {
        total_reports: stats?.total_reports ?? 0,
        latest_risk_level: latest?.predicted_risk_level ?? null,
        average_risk_score: stats?.average_risk_score
            ? parseFloat(stats.average_risk_score.toFixed(4))
            : null,
        high_risk_count: stats?.high_risk_count ?? 0,
        moderate_risk_count: stats?.moderate_risk_count ?? 0,
        low_risk_count: stats?.low_risk_count ?? 0,
        last_updated: new Date(),
    };

    await Dashboard.findOneAndUpdate(
        { user_id: userId },
        { $set: dashboardData },
        { upsert: true, new: true }
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports
// Generate a new health report from raw health_data[] + AI prediction result.
// ─────────────────────────────────────────────────────────────────────────────
const createReport = async (req, res) => {
    try {
        const { valid, errors } = validateReportInput(req.body);
        if (!valid) return fail(res, 'Validation failed.', 422, errors);

        const {
            user_id, report_type, start_date, end_date, health_data,
            predicted_risk_score,
            smoking_status, alcohol_consumption, physical_activity,
            medical_history, family_history, gender,
        } = req.body;

        const aggregates = computeAggregates(health_data);
        const riskScore = predicted_risk_score !== undefined
            ? parseFloat(predicted_risk_score) : null;
        const riskLevel = riskScore !== null ? classifyRisk(riskScore) : null;

        const first = health_data[0] || {};

        const report = await Report.create({
            user_id,
            report_type,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            ...aggregates,
            smoking_status: smoking_status || first.smoking_status || null,
            alcohol_consumption: alcohol_consumption || first.alcohol_consumption || null,
            physical_activity: physical_activity || first.physical_activity || null,
            medical_history: medical_history || first.medical_history || null,
            family_history: family_history || first.family_history || null,
            gender: gender || first.gender || null,
            predicted_risk_score: riskScore,
            predicted_risk_level: riskLevel,
        });

        await refreshDashboard(user_id);
        return ok(res, report, 'Report generated successfully.', 201);
    } catch (err) {
        console.error('[createReport]', err);
        if (err.name === 'ValidationError') return fail(res, err.message, 422);
        return fail(res, 'Internal server error.', 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/user/:userId
// Paginated list of all reports for a user — newest first.
// ─────────────────────────────────────────────────────────────────────────────
const getUserReports = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) return fail(res, 'Invalid userId.', 400);

        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            Report.find({ user_id: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Report.countDocuments({ user_id: userId }),
        ]);

        return ok(res, reports, 'Reports retrieved successfully.', 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error('[getUserReports]', err);
        return fail(res, 'Internal server error.', 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/:id
// Single detailed report by MongoDB ObjectId.
// ─────────────────────────────────────────────────────────────────────────────
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return fail(res, 'Invalid report id.', 400);

        const report = await Report.findById(id).lean();
        if (!report) return fail(res, 'Report not found.', 404);

        return ok(res, report, 'Report retrieved successfully.');
    } catch (err) {
        console.error('[getReportById]', err);
        return fail(res, 'Internal server error.', 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reports/:id
// Regenerate / update an existing report with new health data & AI prediction.
// ─────────────────────────────────────────────────────────────────────────────
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return fail(res, 'Invalid report id.', 400);

        const existing = await Report.findById(id).lean();
        if (!existing) return fail(res, 'Report not found.', 404);

        const { valid, errors } = validateReportInput(req.body);
        if (!valid) return fail(res, 'Validation failed.', 422, errors);

        const {
            report_type, start_date, end_date, health_data,
            predicted_risk_score,
            smoking_status, alcohol_consumption, physical_activity,
            medical_history, family_history, gender,
        } = req.body;

        const aggregates = computeAggregates(health_data);
        const riskScore = predicted_risk_score !== undefined
            ? parseFloat(predicted_risk_score) : null;
        const riskLevel = riskScore !== null ? classifyRisk(riskScore) : null;
        const first = health_data[0] || {};

        const updated = await Report.findByIdAndUpdate(
            id,
            {
                $set: {
                    report_type,
                    start_date: new Date(start_date),
                    end_date: new Date(end_date),
                    ...aggregates,
                    smoking_status: smoking_status || first.smoking_status || null,
                    alcohol_consumption: alcohol_consumption || first.alcohol_consumption || null,
                    physical_activity: physical_activity || first.physical_activity || null,
                    medical_history: medical_history || first.medical_history || null,
                    family_history: family_history || first.family_history || null,
                    gender: gender || first.gender || null,
                    predicted_risk_score: riskScore,
                    predicted_risk_level: riskLevel,
                },
            },
            { new: true, runValidators: true }
        ).lean();

        await refreshDashboard(existing.user_id.toString());
        return ok(res, updated, 'Report regenerated successfully.');
    } catch (err) {
        console.error('[updateReport]', err);
        if (err.name === 'ValidationError') return fail(res, err.message, 422);
        return fail(res, 'Internal server error.', 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reports/:id
// Admin-only: hard-delete a report and refresh dashboard.
// ─────────────────────────────────────────────────────────────────────────────
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return fail(res, 'Invalid report id.', 400);

        const existing = await Report.findById(id).lean();
        if (!existing) return fail(res, 'Report not found.', 404);

        await Report.findByIdAndDelete(id);
        await refreshDashboard(existing.user_id.toString());

        return ok(res, { id }, 'Report deleted successfully.');
    } catch (err) {
        console.error('[deleteReport]', err);
        return fail(res, 'Internal server error.', 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/:userId
// Pre-computed analytics summary for a user.
// ─────────────────────────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) return fail(res, 'Invalid userId.', 400);

        let dashboard = await Dashboard.findOne({ user_id: userId }).lean();

        // On-demand build if not yet initialised
        if (!dashboard) {
            await refreshDashboard(userId);
            dashboard = await Dashboard.findOne({ user_id: userId }).lean();
        }

        if (!dashboard) {
            return ok(res, {
                user_id: userId, total_reports: 0, latest_risk_level: null,
                average_risk_score: null, high_risk_count: 0,
                moderate_risk_count: 0, low_risk_count: 0,
            }, 'No reports found for this user.');
        }

        return ok(res, dashboard, 'Dashboard retrieved successfully.');
    } catch (err) {
        console.error('[getDashboard]', err);
        return fail(res, 'Internal server error.', 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/filter?start=YYYY-MM-DD&end=YYYY-MM-DD&userId=<id>
// Filter reports within a date range for a specific user.
// ─────────────────────────────────────────────────────────────────────────────
const filterReports = async (req, res) => {
    try {
        const { start, end, userId } = req.query;

        const dateCheck = validateDateFilter(start, end);
        if (!dateCheck.valid) return fail(res, 'Invalid date filter.', 400, dateCheck.errors);

        const targetUserId = userId || req.user?.id;
        if (!targetUserId || !isValidObjectId(targetUserId)) {
            return fail(res, 'Valid userId is required as a query param or JWT claim.', 400);
        }

        const reports = await Report.find({
            user_id: targetUserId,
            start_date: { $gte: new Date(start) },
            end_date: { $lte: new Date(end) },
        })
            .sort({ start_date: -1 })
            .lean();

        return ok(res, reports, `Found ${reports.length} report(s) in range.`);
    } catch (err) {
        console.error('[filterReports]', err);
        return fail(res, 'Internal server error.', 500);
    }
};

module.exports = {
    createReport,
    getUserReports,
    getReportById,
    updateReport,
    deleteReport,
    getDashboard,
    filterReports,
};
