import React, { useState } from 'react';
import { Download, PlusCircle, Sparkles, TrendingUp, FileText, BarChart3, Moon, Activity } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

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

const weekData = [
    { day: 'Mon', sleep: 7.0, steps: 7500, stress: 4, risk: 32 },
    { day: 'Tue', sleep: 6.5, steps: 9200, stress: 6, risk: 45 },
    { day: 'Wed', sleep: 8.0, steps: 5800, stress: 3, risk: 28 },
    { day: 'Thu', sleep: 6.0, steps: 10200, stress: 7, risk: 55 },
    { day: 'Fri', sleep: 7.5, steps: 8300, stress: 5, risk: 38 },
    { day: 'Sat', sleep: 8.5, steps: 12000, stress: 2, risk: 22 },
    { day: 'Sun', sleep: 7.2, steps: 8432, stress: 4, risk: 25 },
];

const reports = [
    { id: 1, name: 'Weekly Summary – W7', date: 'Feb 17, 2026', risk: 'Low', riskPct: 25, status: 'Completed' },
    { id: 2, name: 'Weekly Summary – W6', date: 'Feb 10, 2026', risk: 'Moderate', riskPct: 48, status: 'Completed' },
    { id: 3, name: 'Monthly Report – Jan', date: 'Feb 01, 2026', risk: 'Low', riskPct: 30, status: 'Completed' },
];
const riskColor = r => r === 'Low' ? '#10b981' : r === 'Moderate' ? '#f59e0b' : '#ef4444';

const SummaryCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}22` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {sub && <p className="text-xs mt-1 font-semibold" style={{ color }}>{sub}</p>}
    </div>
);

export default function Reports() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Your health trends at a glance</p>
                </div>
                <button onClick={() => setShowModal(true)} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm">
                    <PlusCircle className="w-4 h-4" /> Generate Report
                </button>
            </div>

            {/* AI summary banner */}
            <div className="glass-card p-5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.2))' }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Weekly Summary</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Your sleep improved by <strong>12%</strong> this week and stress was down on weekends.
                        High step counts on Thursday offset elevated stress — keep it up!
                        Consider reducing screen time on weekdays to further lower risk.
                    </p>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={Moon} label="Avg Sleep" value="7.2h" sub="▲ +30m vs last wk" color="#6366f1" />
                <SummaryCard icon={Activity} label="Avg Steps" value="8,790" sub="▼ -8% vs last wk" color="#f97316" />
                <SummaryCard icon={TrendingUp} label="Avg Risk" value="35%" sub="▼ Improving" color="#10b981" />
                <SummaryCard icon={BarChart3} label="Reports Total" value="3" sub="This month" color="#3b82f6" />
            </div>

            {/* Charts */}
            <div className="grid gap-5 lg:grid-cols-2">
                {/* Sleep + Risk trend */}
                <div className="glass-card p-5">
                    <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Sleep vs Risk Score</h2>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weekData} margin={{ left: -20, right: 8 }}>
                                <defs>
                                    <linearGradient id="sleepGr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="riskGr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<GlassTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Area type="monotone" dataKey="sleep" name="Sleep (h)" stroke="#6366f1" fill="url(#sleepGr)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="risk" name="Risk (%)" stroke="#f59e0b" fill="url(#riskGr)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Step / stress bars */}
                <div className="glass-card p-5">
                    <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Daily Steps & Stress</h2>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weekData} margin={{ left: -20, right: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<GlassTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="steps" name="Steps" fill="rgba(249,115,22,0.6)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="stress" name="Stress" fill="rgba(239,68,68,0.5)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Reports table */}
            <div className="glass-card p-5">
                <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Recent Reports</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                {['Report Name', 'Date', 'Risk Level', 'Status', ''].map(h => (
                                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide"
                                        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(r => (
                                <tr key={r.id} className="transition-colors"
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td className="py-3 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                            {r.name}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3" style={{ color: 'var(--text-muted)' }}>{r.date}</td>
                                    <td className="py-3 px-3">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                            style={{ background: `${riskColor(r.risk)}15`, color: riskColor(r.risk) }}>
                                            {r.risk} ({r.riskPct}%)
                                        </span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>{r.status}</span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <button className="flex items-center gap-1 text-xs glass-btn-outline px-3 py-1.5">
                                            <Download className="w-3.5 h-3.5" /> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.3)' }}
                    onClick={() => setShowModal(false)}>
                    <div className="glass-card max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Generate New Report</h2>
                        <div className="space-y-3">
                            {['Weekly Summary', 'Monthly Overview', 'Custom Date Range'].map(t => (
                                <button key={t} className="w-full text-left p-3 rounded-2xl text-sm font-medium transition-all duration-200"
                                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--glass-bg)'}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button className="glass-btn-outline px-4 py-2 text-sm" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="glass-btn px-4 py-2 text-sm" onClick={() => setShowModal(false)}>Generate</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
