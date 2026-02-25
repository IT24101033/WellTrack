import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, FileText, X, CheckCircle, AlertCircle,
    Heart, Activity, TrendingUp, Zap, Calendar, RefreshCw, Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// ─── Risk Badge ───────────────────────────────────────────────────────────────
const riskMeta = {
    low: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Low Risk' },
    moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Moderate Risk' },
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'High Risk' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, value, color }) {
    return (
        <div
            className="flex flex-col gap-1 p-3 rounded-2xl"
            style={{ background: `${color}10`, border: `1px solid ${color}22` }}
        >
            <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</span>
        </div>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
    const isSuccess = type === 'success';
    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg animate-fade-in"
            style={{
                background: isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                backdropFilter: 'blur(12px)',
            }}
        >
            {isSuccess
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
            }
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{message}</span>
            <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * HealthPDFImportCard
 *
 * Drag-and-drop PDF uploader that sends the file to
 * POST /api/reports/import-health-pdf, shows a processing animation,
 * then renders a summary card with heart-rate analytics and AI risk score.
 *
 * Props:
 *   onSuccess(result) — called after successful import with the API response
 */
export default function HealthPDFImportCard({ onSuccess }) {
    const { token } = useAuth();

    // ── State ──────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState('idle');    // idle | uploading | success | error
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [inlineError, setInlineError] = useState('');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [toast, setToast] = useState(null);
    const inputRef = useRef(null);
    const progressRef = useRef(null);

    // ── File selection helpers ─────────────────────────────────────────────
    const validateAndSetFile = useCallback((f) => {
        setInlineError('');
        if (!f) return;
        if (f.type !== 'application/pdf') {
            setInlineError('Only PDF files are accepted.');
            return;
        }
        if (f.size > MAX_BYTES) {
            setInlineError(`File exceeds the ${MAX_MB} MB size limit.`);
            return;
        }
        setFile(f);
        setPhase('idle');
        setResult(null);
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        validateAndSetFile(e.dataTransfer.files[0]);
    }, [validateAndSetFile]);

    const onInputChange = (e) => validateAndSetFile(e.target.files[0]);

    const reset = () => {
        setFile(null);
        setPhase('idle');
        setResult(null);
        setInlineError('');
        setProgress(0);
        if (inputRef.current) inputRef.current.value = '';
    };

    // ── Fake progress animation while waiting for API ─────────────────────
    const startFakeProgress = () => {
        setProgress(0);
        let p = 0;
        progressRef.current = setInterval(() => {
            p += Math.random() * 8 + 2; // 2–10% per tick
            if (p >= 90) { clearInterval(progressRef.current); p = 90; }
            setProgress(Math.round(p));
        }, 200);
    };

    const finishProgress = () => {
        clearInterval(progressRef.current);
        setProgress(100);
    };

    // ── Upload handler ─────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!file) return;
        setPhase('uploading');
        setInlineError('');
        startFakeProgress();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE}/reports/import-health-pdf`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            finishProgress();

            if (!res.ok || !data.success) {
                setPhase('error');
                setInlineError(data.message || 'Failed to process PDF.');
                return;
            }

            setResult(data);
            setPhase('success');
            showToast('Health data imported & analytics updated successfully', 'success');
            onSuccess?.(data);

        } catch {
            finishProgress();
            setPhase('error');
            setInlineError('Network error — make sure the server is running.');
        }
    };

    // ── Toast helpers ──────────────────────────────────────────────────────
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="glass-card p-6 space-y-5">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(16,185,129,0.2))',
                        border: '1px solid rgba(59,130,246,0.2)'
                    }}
                >
                    <Upload className="w-5 h-5" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                    <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        Import Health PDF
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Upload a structured heart-rate PDF to auto-analyze &amp; update your dashboard
                    </p>
                </div>
            </div>

            {/* ── Drop Zone (shown when idle or error) ─────────────────── */}
            {(phase === 'idle' || phase === 'error') && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className="relative rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 py-10 px-6 text-center"
                    style={{
                        border: `2px dashed ${dragOver ? '#3b82f6' : 'var(--glass-border)'}`,
                        background: dragOver
                            ? 'rgba(59,130,246,0.07)'
                            : file
                                ? 'rgba(16,185,129,0.05)'
                                : 'var(--glass-bg)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={onInputChange}
                    />

                    {file ? (
                        <>
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(16,185,129,0.15)' }}
                            >
                                <FileText className="w-6 h-6" style={{ color: '#10b981' }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {file.name}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    {(file.size / 1024).toFixed(1)} KB · Click to change
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(59,130,246,0.12)' }}
                            >
                                <Upload className="w-6 h-6" style={{ color: '#3b82f6' }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Drag &amp; drop your PDF here
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    or <span style={{ color: '#3b82f6' }}>click to browse</span> · PDF only · max {MAX_MB} MB
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Inline Validation Error ───────────────────────────────── */}
            {inlineError && (
                <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <span style={{ color: '#ef4444' }}>{inlineError}</span>
                </div>
            )}

            {/* ── Action Buttons (idle / error) ─────────────────────────── */}
            {(phase === 'idle' || phase === 'error') && (
                <div className="flex gap-3">
                    <button
                        onClick={handleUpload}
                        disabled={!file}
                        className="glass-btn flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200"
                        style={{
                            opacity: file ? 1 : 0.4,
                            cursor: file ? 'pointer' : 'not-allowed',
                        }}
                    >
                        <Zap className="w-4 h-4" />
                        Upload &amp; Analyze
                    </button>
                    {file && (
                        <button
                            onClick={reset}
                            className="glass-btn-outline px-4 py-2.5 text-sm flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    )}
                </div>
            )}

            {/* ── Processing State ──────────────────────────────────────── */}
            {phase === 'uploading' && (
                <div className="space-y-4 py-2">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(59,130,246,0.15)' }}
                        >
                            <Activity
                                className="w-4 h-4 animate-pulse"
                                style={{ color: '#3b82f6' }}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Extracting health data…
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                Parsing records · Computing analytics · Calculating risk
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full rounded-full h-2" style={{ background: 'var(--glass-bg)' }}>
                        <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                                boxShadow: '0 0 8px rgba(59,130,246,0.4)',
                            }}
                        />
                    </div>
                    <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                        {progress}%
                    </p>
                </div>
            )}

            {/* ── Success Summary ───────────────────────────────────────── */}
            {phase === 'success' && result && (
                <div className="space-y-4 animate-fade-in">

                    {/* Risk Banner */}
                    {result.risk && (() => {
                        const meta = riskMeta[result.risk.level] || riskMeta.moderate;
                        return (
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}
                            >
                                <Heart className="w-5 h-5" style={{ color: meta.color }} />
                                <div>
                                    <p className="text-sm font-bold" style={{ color: meta.color }}>
                                        {meta.label}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Risk score: {(result.risk.score * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <span
                                    className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{ background: meta.color, color: '#fff' }}
                                >
                                    {result.risk.level.toUpperCase()}
                                </span>
                            </div>
                        );
                    })()}

                    {/* Stats grid */}
                    {result.summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <StatChip icon={FileText} label="Total Records" value={result.summary.total_records} color="#3b82f6" />
                            <StatChip icon={Heart} label="Avg Heart Rate" value={result.summary.avg_hr ? `${result.summary.avg_hr} bpm` : null} color="#ef4444" />
                            <StatChip icon={TrendingUp} label="Max Heart Rate" value={result.summary.max_hr ? `${result.summary.max_hr} bpm` : null} color="#f97316" />
                            <StatChip icon={Activity} label="Min Heart Rate" value={result.summary.min_hr ? `${result.summary.min_hr} bpm` : null} color="#10b981" />
                            <StatChip icon={Zap} label="Exercise Sessions" value={result.summary.exercise_sessions} color="#8b5cf6" />
                            <StatChip icon={Calendar} label="Date Range" value={result.summary.date_range} color="#06b6d4" />
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 pt-1">
                        <button
                            onClick={reset}
                            className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Import Another PDF
                        </button>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="glass-btn-outline flex items-center gap-2 px-4 py-2.5 text-sm"
                        >
                            <Eye className="w-4 h-4" />
                            View Updated Report
                        </button>
                    </div>
                </div>
            )}

            {/* ── Toast ─────────────────────────────────────────────────── */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
