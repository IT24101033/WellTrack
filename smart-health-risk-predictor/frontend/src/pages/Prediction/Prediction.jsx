import React, { useState } from 'react';
import { Activity, AlertCircle, CheckCircle, RefreshCw, Loader2, TrendingUp, Zap, Moon, Brain, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Animated SVG risk ring (full size version)
function BigRiskRing({ level, predicted }) {
    const config = {
        low: { color: '#10b981', glow: '#10b981', label: 'Low', pct: 25, desc: 'Your health indicators are in a healthy range.' },
        moderate: { color: '#f59e0b', glow: '#f59e0b', label: 'Moderate', pct: 55, desc: 'Some indicators need attention. Review factors below.' },
        high: { color: '#ef4444', glow: '#ef4444', label: 'High', pct: 82, desc: 'Multiple risk factors detected. Consider seeking advice.' },
    };
    const c = config[level];
    const size = 260;
    const r = (size - 24) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = predicted ? circumference * (1 - c.pct / 100) : circumference;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                {/* Ambient glow */}
                <div className="absolute inset-0 rounded-full opacity-25 animate-pulse-glow"
                    style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 65%)` }} />
                <svg width={size} height={size} className="-rotate-90">
                    <defs>
                        <linearGradient id="brg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={c.color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={c.color} stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--glass-border)" strokeWidth={14} />
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                        stroke="url(#brg)" strokeWidth={14} strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 10px ${c.color})` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-5xl font-extrabold" style={{ color: c.color }}>{predicted ? `${c.pct}%` : '—'}</span>
                    <span className="text-sm font-bold mt-1" style={{ color: c.color }}>{predicted ? c.label : 'Not Run'}</span>
                    <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Risk Score</span>
                </div>
            </div>
            {predicted && (
                <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>{c.desc}</p>
            )}
        </div>
    );
}

// Recharts custom tooltip
const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-sm px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
            ))}
        </div>
    );
};

const trendData = [
    { day: 'Mon', risk: 30 }, { day: 'Tue', risk: 45 }, { day: 'Wed', risk: 35 },
    { day: 'Thu', risk: 55 }, { day: 'Fri', risk: 40 }, { day: 'Sat', risk: 28 }, { day: 'Sun', risk: 25 },
];

const historyItems = [
    { date: 'Today 09:30', level: 'low', pct: 25, factors: ['Good sleep', 'Active day', 'Low stress'] },
    { date: 'Yesterday', level: 'moderate', pct: 52, factors: ['High screen time', 'Irregular sleep'] },
    { date: '2 days ago', level: 'high', pct: 78, factors: ['Late night', 'Very high stress', 'No exercise'] },
];

const levelColor = l => l === 'low' ? '#10b981' : l === 'moderate' ? '#f59e0b' : '#ef4444';

export default function Prediction() {
    const [predicted, setPredicted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePredict = async () => {
        setLoading(true);
        setPredicted(false);
        await new Promise(r => setTimeout(r, 2000));
        setLoading(false);
        setPredicted(true);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Risk Prediction</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Advanced AI analyses your daily habits to predict potential health risks.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Risk ring panel */}
                <div className="glass-card p-6 flex flex-col items-center gap-5">
                    <div className="flex items-center justify-between w-full">
                        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Current Risk</h2>
                        {predicted && (
                            <span className="text-xs px-3 py-1 rounded-full font-semibold"
                                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>92% confidence</span>
                        )}
                    </div>

                    <BigRiskRing level="low" predicted={predicted} />

                    {!predicted ? (
                        <div className="text-center space-y-3">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Based on: Sleep 7h 20m · Steps 8,432 · Stress: Moderate
                            </p>
                            <button onClick={handlePredict} disabled={loading}
                                className="glass-btn px-8 py-3 flex items-center gap-2 text-sm">
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
                                    : <><Brain className="w-4 h-4" /> Predict My Health Risk</>}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full space-y-3">
                            <div className="p-4 rounded-2xl"
                                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>Contributing factors:</p>
                                <ul className="space-y-1">
                                    {['Good sleep duration (7h 20m)', 'Reasonable step count (8,432)', 'Moderate stress – watch closely'].map(f => (
                                        <li key={f} className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10b981' }} /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={handlePredict} disabled={loading}
                                className="w-full glass-btn-outline py-2.5 flex items-center justify-center gap-2 text-sm">
                                <RefreshCw className="w-4 h-4" /> Regenerate Prediction
                            </button>
                        </div>
                    )}
                </div>

                {/* Risk trend chart */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <TrendingUp className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        </div>
                        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>7-Day Risk Trend</h2>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ left: -20, right: 8 }}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<GlassTooltip />} />
                                <Line type="monotone" dataKey="risk" name="Risk %" stroke="url(#lineGrad)"
                                    strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6, fill: '#8b5cf6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Risk history */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Prediction History</h2>
                </div>
                <div className="space-y-3">
                    {historyItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${levelColor(item.level)}15`, border: `1px solid ${levelColor(item.level)}25` }}>
                                {item.level === 'low' ? <CheckCircle className="w-5 h-5" style={{ color: levelColor(item.level) }} />
                                    : <AlertCircle className="w-5 h-5" style={{ color: levelColor(item.level) }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold capitalize" style={{ color: levelColor(item.level) }}>
                                        {item.level} Risk – {item.pct}%
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.date}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {item.factors.map(f => (
                                        <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
