import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, AlertCircle, CheckCircle, RefreshCw, Loader2,
    TrendingUp, Brain, Sparkles, Wifi, WifiOff, Info,
    HeartPulse, Moon, Footprints, Dumbbell, Droplets,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('healthPredict_token')}` });

const RISK_CONFIG = {
    low:    { color: '#10b981', glow: '#10b981', label: 'Low',    pct: 22, desc: 'Your health indicators are in a healthy range. Keep up the great work!' },
    medium: { color: '#f59e0b', glow: '#f59e0b', label: 'Medium', pct: 54, desc: 'Some indicators need attention. Review the contributing factors below.' },
    high:   { color: '#ef4444', glow: '#ef4444', label: 'High',   pct: 83, desc: 'Multiple risk factors detected. Consider consulting a healthcare professional.' },
};

// ── Animated Risk Ring ─────────────────────────────────────────────────────────
function BigRiskRing({ level, pct, predicted, confidence }) {
    const c = RISK_CONFIG[level] || RISK_CONFIG.low;
    const displayPct = predicted ? (pct ?? c.pct) : 0;
    const size = 260;
    const r = (size - 24) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - displayPct / 100);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <div className="absolute inset-0 rounded-full opacity-20 animate-pulse-glow"
                    style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 65%)` }} />
                <svg width={size} height={size} className="-rotate-90">
                    <defs>
                        <linearGradient id="brg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={c.color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={c.color} stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--glass-border)" strokeWidth={14} />
                    <circle cx={size/2} cy={size/2} r={r} fill="none"
                        stroke="url(#brg)" strokeWidth={14} strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={predicted ? offset : circumference}
                        style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 12px ${c.color})` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <span className="text-5xl font-extrabold" style={{ color: c.color }}>
                        {predicted ? `${displayPct}%` : '—'}
                    </span>
                    <span className="text-sm font-bold mt-1" style={{ color: c.color }}>
                        {predicted ? `${c.label} Risk` : 'Not Run'}
                    </span>
                    {predicted && confidence && (
                        <span className="text-xs mt-1 px-2 py-0.5 rounded-full"
                            style={{ background: `${c.color}18`, color: c.color }}>
                            {confidence}% confidence
                        </span>
                    )}
                </div>
            </div>
            {predicted && (
                <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>{c.desc}</p>
            )}
        </div>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = '#3b82f6' }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
        </div>
    );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-sm px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <b>{p.value}%</b></p>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Prediction() {
    const { user } = useAuth();
    const [loading, setLoading]       = useState(false);
    const [mlOnline, setMlOnline]     = useState(null);   // null=checking, true=online, false=offline
    const [result, setResult]         = useState(null);
    const [error, setError]           = useState('');
    const [history, setHistory]       = useState(() => {
        try { return JSON.parse(localStorage.getItem('welltrack_pred_history') || '[]'); }
        catch { return []; }
    });

    // ── Check ML service status on mount ──────────────────────────────────────
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const r = await fetch(`${API}/predict/status`, { headers: getAuthHeader() });
                const d = await r.json();
                setMlOnline(d.online && d.model_loaded);
            } catch {
                setMlOnline(false);
            }
        };
        checkStatus();
    }, []);

    // ── Run prediction ─────────────────────────────────────────────────────────
    const handlePredict = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const r = await fetch(`${API}/predict`, {
                method: 'POST',
                headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({}), // uses latest health entry
            });
            const data = await r.json();

            if (!r.ok || !data.success) {
                setError(data.message || 'Prediction failed. Please try again.');
                setLoading(false);
                return;
            }

            setResult(data);

            // Persist to history (max 10)
            const entry = {
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                level:       data.prediction.risk_level,
                pct:         data.prediction.risk_pct,
                confidence:  data.prediction.confidence,
                factors:     data.prediction.contributing_factors,
            };
            setHistory(prev => {
                const updated = [entry, ...prev].slice(0, 10);
                localStorage.setItem('welltrack_pred_history', JSON.stringify(updated));
                return updated;
            });

            setMlOnline(true);
        } catch (e) {
            setError('Could not reach the prediction service. Make sure the AI service is running.');
        }
        setLoading(false);
    }, []);

    // ── Build trend data from history ──────────────────────────────────────────
    const trendData = [...history].reverse().slice(-7).map((h, i) => ({
        day: h.date,
        risk: h.pct,
    }));

    const p = result?.prediction;
    const s = result?.input_summary;
    const level = p?.risk_level || 'low';

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Risk Prediction</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        XGBoost model analyses your daily health data to predict health risk.
                    </p>
                </div>

                {/* ML service status badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                        background: mlOnline === true ? 'rgba(16,185,129,0.12)'
                                  : mlOnline === false ? 'rgba(239,68,68,0.12)'
                                  : 'rgba(148,163,184,0.12)',
                        color: mlOnline === true ? '#10b981'
                             : mlOnline === false ? '#ef4444'
                             : 'var(--text-muted)',
                        border: `1px solid ${mlOnline === true ? 'rgba(16,185,129,0.2)' : mlOnline === false ? 'rgba(239,68,68,0.2)' : 'var(--glass-border)'}`,
                    }}>
                    {mlOnline === true  ? <><Wifi className="w-3.5 h-3.5" /> AI Online</> :
                     mlOnline === false ? <><WifiOff className="w-3.5 h-3.5" /> AI Offline</> :
                                         <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…</>}
                </div>
            </div>

            {/* ── ML offline banner ─────────────────────────────────────────── */}
            {mlOnline === false && (
                <div className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>AI Service Offline</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            To start the prediction service, open a terminal and run:
                        </p>
                        <code className="text-xs mt-1 block px-2 py-1 rounded-lg font-mono"
                            style={{ background: 'rgba(0,0,0,0.2)', color: '#f97316' }}>
                            cd ai-service &amp;&amp; uvicorn main:app --reload --port 8000
                        </code>
                    </div>
                </div>
            )}

            {/* ── Error banner ──────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* ── Risk ring panel ───────────────────────────────────────── */}
                <div className="glass-card p-6 flex flex-col items-center gap-5">
                    <div className="flex items-center justify-between w-full">
                        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Current Risk</h2>
                        {p && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                style={{
                                    background: `${RISK_CONFIG[level]?.color}18`,
                                    color: RISK_CONFIG[level]?.color,
                                }}>
                                XGBoost · {p.confidence}% conf.
                            </span>
                        )}
                    </div>

                    <BigRiskRing
                        level={level}
                        pct={p?.risk_pct}
                        predicted={!!p}
                        confidence={p?.confidence}
                    />

                    {/* Input summary stats */}
                    {s && (
                        <div className="w-full grid grid-cols-2 gap-2">
                            <StatCard icon={HeartPulse} label="BMI"          value={s.bmi}                color="#ef4444" />
                            <StatCard icon={Moon}       label="Sleep"         value={`${s.sleep_hours}h`}  color="#6366f1" />
                            <StatCard icon={Footprints} label="Steps"         value={s.steps_per_day?.toLocaleString()} color="#f97316" />
                            <StatCard icon={Dumbbell}   label="Exercise"      value={`${s.exercise_minutes} min`}  color="#10b981" />
                        </div>
                    )}

                    {/* Action button */}
                    {!p ? (
                        <div className="text-center space-y-3 w-full">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Uses your latest health entry as input.
                            </p>
                            <button onClick={handlePredict} disabled={loading || mlOnline === false}
                                className="glass-btn w-full py-3 flex items-center justify-center gap-2 text-sm">
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing with XGBoost…</>
                                    : <><Brain className="w-4 h-4" /> Predict My Health Risk</>}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full space-y-3">
                            {/* Contributing factors */}
                            <div className="p-4 rounded-2xl"
                                style={{
                                    background: `${RISK_CONFIG[level]?.color}0d`,
                                    border: `1px solid ${RISK_CONFIG[level]?.color}22`,
                                }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: RISK_CONFIG[level]?.color }}>
                                    Contributing factors:
                                </p>
                                <ul className="space-y-1">
                                    {p.contributing_factors?.map(f => (
                                        <li key={f} className="text-xs flex items-center gap-2"
                                            style={{ color: 'var(--text-secondary)' }}>
                                            {level === 'low'
                                                ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10b981' }} />
                                                : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: RISK_CONFIG[level]?.color }} />}
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={handlePredict} disabled={loading}
                                className="w-full glass-btn-outline py-2.5 flex items-center justify-center gap-2 text-sm">
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating…</>
                                    : <><RefreshCw className="w-4 h-4" /> Regenerate Prediction</>}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Trend chart ───────────────────────────────────────────── */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <TrendingUp className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        </div>
                        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Risk Score Trend</h2>
                    </div>
                    {trendData.length > 0 ? (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ left: -20, right: 8 }}>
                                    <defs>
                                        <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<GlassTooltip />} />
                                    <ReferenceLine y={35} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Low', fontSize: 9, fill: '#10b981' }} />
                                    <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Medium', fontSize: 9, fill: '#f59e0b' }} />
                                    <Line type="monotone" dataKey="risk" name="Risk %" stroke="url(#lg)"
                                        strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                                        activeDot={{ r: 6, fill: '#8b5cf6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-56 flex flex-col items-center justify-center gap-2 text-sm"
                            style={{ color: 'var(--text-muted)' }}>
                            <Activity className="w-8 h-8 opacity-30" />
                            <p>Run your first prediction to see the trend.</p>
                        </div>
                    )}

                    {/* Model info card */}
                    <div className="mt-5 p-4 rounded-2xl"
                        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#8b5cf6' }}>Model Information</p>
                        <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span>Algorithm:</span>   <span className="font-medium">XGBoost Classifier</span>
                            <span>Classes:</span>     <span className="font-medium">Low / Medium / High</span>
                            <span>Features:</span>    <span className="font-medium">38 engineered</span>
                            <span>Source:</span>      <span className="font-medium">Your health entries</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Prediction History ────────────────────────────────────────── */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Prediction History</h2>
                    {history.length > 0 && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                            {history.length} run{history.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {history.length > 0 ? (
                    <div className="space-y-3">
                        {history.map((item, i) => {
                            const rc = RISK_CONFIG[item.level] || RISK_CONFIG.low;
                            return (
                                <div key={i}
                                    className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${rc.color}15`, border: `1px solid ${rc.color}25` }}>
                                        {item.level === 'low'
                                            ? <CheckCircle className="w-5 h-5" style={{ color: rc.color }} />
                                            : <AlertCircle className="w-5 h-5" style={{ color: rc.color }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold capitalize" style={{ color: rc.color }}>
                                                {rc.label} Risk — {item.pct}%
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.date}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.factors?.slice(0, 4).map(f => (
                                                <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                                    {f}
                                                </span>
                                            ))}
                                            {item.confidence && (
                                                <span className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{ background: `${rc.color}12`, color: rc.color }}>
                                                    {item.confidence}% conf.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        No prediction history yet. Run your first prediction above!
                    </div>
                )}
            </div>
        </div>
    );
}
