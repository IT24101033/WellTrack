import React, { useState, useEffect, useRef } from 'react';
import {
    Moon, Zap, Smartphone, Activity, Sparkles, CheckCircle,
    Target, Award, Flame, Heart, Brain, AlertTriangle,
    TrendingUp, Droplets, Plus, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { fetchHealthEntries } from '../../services/healthService';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v, unit = '') => v == null ? '—' : `${v}${unit}`;
const pctDiff = (curr, prev) => {
    if (curr == null || prev == null || prev === 0) return null;
    const d = Math.round(((curr - prev) / prev) * 100);
    return d > 0 ? { label: `+${d}%`, trend: 'up' } : d < 0 ? { label: `${d}%`, trend: 'down' } : { label: '0%', trend: 'neutral' };
};

const CHART_COLORS = {
    sleep: '#6366f1',
    stress: '#ef4444',
    screen: '#3b82f6',
    steps: '#f97316',
    exercise: '#10b981',
    sedentary: '#94a3b8',
};

// ── Animated SVG Risk Ring ─────────────────────────────────────────────────────
function RiskRing({ score = 0, size = 180 }) {
    const pct = Math.max(0, Math.min(100, score));
    const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
    const label = pct >= 70 ? 'Good' : pct >= 45 ? 'Fair' : 'Low';
    const glow = pct >= 70 ? 'rgba(16,185,129,0.5)' : pct >= 45 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)';

    const r = (size - 20) / 2;
    const circumference = 2 * Math.PI * r;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const t = setTimeout(() => setOffset(circumference * (1 - pct / 100)), 300);
        return () => clearTimeout(t);
    }, [pct, circumference]);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <div className="absolute inset-0 rounded-full opacity-30 animate-pulse-glow"
                style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id="rg-health" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="1" />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--glass-border)" strokeWidth={10} />
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={`url(#rg-health)`} strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 8px ${color})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold" style={{ color }}>{pct}</span>
                <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Health Score</span>
                <span className="text-xs font-bold mt-0.5" style={{ color }}>{label}</span>
            </div>
        </div>
    );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, diff, delay = 0 }) {
    const trendColor = diff?.trend === 'up' ? '#10b981' : diff?.trend === 'down' ? '#ef4444' : 'var(--text-muted)';
    const TrendIcon = diff?.trend === 'up' ? ArrowUp : diff?.trend === 'down' ? ArrowDown : Minus;
    return (
        <div className="glass-card p-5 cursor-default animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                {diff && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: `${trendColor}18`, color: trendColor }}>
                        <TrendIcon className="w-3 h-3" />{diff.label}
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{title}</div>
        </div>
    );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass px-3 py-2 rounded-xl text-xs" style={{ border: '1px solid var(--glass-border)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
};

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Health Data Yet</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    Start tracking your health to see analytics, trends, and your AI risk score.
                </p>
            </div>
            <Link to="/health-input">
                <button className="glass-btn flex items-center gap-2 px-6 py-3">
                    <Plus className="w-4 h-4" /> Add Today's Health Data
                </button>
            </Link>
        </div>
    );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchHealthEntries({ limit: 7 });
                if (res.data?.success) {
                    // Sort ascending (oldest → newest for charts)
                    setEntries([...res.data.entries].sort((a, b) => a.date.localeCompare(b.date)));
                }
            } catch { /* silent */ }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (entries.length === 0) return <EmptyState />;

    const latest = entries[entries.length - 1];
    const prev = entries.length >= 2 ? entries[entries.length - 2] : null;

    // ── Chart Data ─────────────────────────────────────────────────────────────
    const chartData = entries.map(e => ({
        date: e.date.slice(5), // MM-DD
        sleep: e.physiological?.sleepHours ?? null,
        stress: e.psychological?.stressScore ?? null,
        screen: e.activity?.screenTimeHours ?? null,
        steps: e.activity?.stepsPerDay ? Math.round(e.activity.stepsPerDay / 100) / 10 : null,
        exercise: e.activity?.exerciseMinutes ?? null,
        mood: e.psychological?.moodScore ?? null,
        score: e.healthScore ?? null,
    }));

    // Activity pie
    const totalHours = 24;
    const sleepH = latest.physiological?.sleepHours ?? 0;
    const exerciseH = ((latest.activity?.exerciseMinutes ?? 0) / 60);
    const sedentaryH = latest.activity?.sedentaryHours ?? 0;
    const otherH = Math.max(0, totalHours - sleepH - exerciseH - sedentaryH);
    const pieData = [
        { name: 'Sleep', value: parseFloat(sleepH.toFixed(1)), color: '#6366f1' },
        { name: 'Exercise', value: parseFloat(exerciseH.toFixed(1)), color: '#10b981' },
        { name: 'Sedentary', value: parseFloat(sedentaryH.toFixed(1)), color: '#94a3b8' },
        { name: 'Other', value: parseFloat(otherH.toFixed(1)), color: '#f97316' },
    ].filter(d => d.value > 0);

    // Radar chart
    const radarData = [
        { subject: 'Sleep', value: Math.min(100, ((latest.physiological?.sleepHours ?? 0) / 9) * 100) },
        { subject: 'Activity', value: Math.min(100, ((latest.activity?.stepsPerDay ?? 0) / 10000) * 100) },
        { subject: 'Mood', value: Math.min(100, ((latest.psychological?.moodScore ?? 0) / 10) * 100) },
        { subject: 'Nutrition', value: Math.min(100, ((latest.lifestyle?.waterIntake ?? 0) / 3) * 100) },
        { subject: 'Focus', value: Math.min(100, (1 - Math.min((latest.activity?.screenTimeHours ?? 0) / 10, 1)) * 100) },
        { subject: 'Calm', value: Math.min(100, ((10 - (latest.psychological?.stressScore ?? 5)) / 9) * 100) },
    ];

    // Stat diffs
    const sleepDiff = pctDiff(latest.physiological?.sleepHours, prev?.physiological?.sleepHours);
    const stepsDiff = pctDiff(latest.activity?.stepsPerDay, prev?.activity?.stepsPerDay);
    const stressDiff = pctDiff(prev?.psychological?.stressScore, latest.psychological?.stressScore); // inverted: lower = better
    const screenDiff = pctDiff(prev?.activity?.screenTimeHours, latest.activity?.screenTimeHours);

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
            {/* Greeting */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {greeting}, {user?.fullName?.split(' ')[0] || 'there'} 👋
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Based on your last {entries.length} recorded day{entries.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link to="/health-input">
                    <button className="glass-btn flex items-center gap-2 px-4 py-2 text-sm">
                        <Plus className="w-4 h-4" /> Add Today's Data
                    </button>
                </Link>
            </div>

            {/* Risk Alert Banner */}
            {latest.riskAlert && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl animate-scale-in"
                    style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <div>
                        <p className="font-bold text-sm" style={{ color: '#ef4444' }}>Health Risk Alert</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Your latest entry shows high stress (stress {'>'} 8) combined with low sleep ({'<'} 5h).
                            Please prioritize rest and consider speaking to a wellness advisor.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Stat Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Last Sleep" icon={Moon} color="#6366f1"
                    value={fmt(latest.physiological?.sleepHours, 'h')} diff={sleepDiff} delay={0} />
                <StatCard title="Steps" icon={Zap} color="#f97316"
                    value={latest.activity?.stepsPerDay?.toLocaleString() ?? '—'} diff={stepsDiff} delay={60} />
                <StatCard title="Screen Time" icon={Smartphone} color="#3b82f6"
                    value={fmt(latest.activity?.screenTimeHours, 'h')} diff={screenDiff} delay={120} />
                <StatCard title="Stress Level" icon={Brain} color="#ef4444"
                    value={latest.psychological?.stressScore != null
                        ? `${latest.psychological.stressScore}/10` : '—'} diff={stressDiff} delay={180} />
            </div>

            {/* ── Risk Ring + Radar ──────────────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Health Score Ring */}
                <div className="glass-card p-6 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between w-full mb-2">
                        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Health Score</h2>
                        <span className="text-xs px-3 py-1 rounded-full font-semibold"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Live</span>
                    </div>
                    <RiskRing score={latest.healthScore ?? 0} size={180} />
                    <div className="flex gap-3 w-full">
                        {[
                            { label: 'Sleep', value: latest.physiological?.sleepHours != null ? `${latest.physiological.sleepHours}h` : '—', color: '#6366f1' },
                            { label: 'Stress', value: latest.psychological?.stressScore != null ? `${latest.psychological.stressScore}/10` : '—', color: '#ef4444' },
                            { label: 'Steps', value: latest.activity?.stepsPerDay ? `${Math.round(latest.activity.stepsPerDay / 1000)}k` : '—', color: '#f97316' },
                        ].map(b => (
                            <div key={b.label} className="glass-sm flex-1 p-2.5 text-center">
                                <p className="text-lg font-bold" style={{ color: b.color }}>{b.value}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '260ms' }}>
                    <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Wellness Balance</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="var(--glass-border)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25}
                                dot={{ r: 3, fill: '#3b82f6' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Sleep Trend + Stress vs Screen ────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Sleep Trend Line Chart */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                        Sleep Trend <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>last {entries.length} days</span>
                    </h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 12]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Goal line at 8h */}
                            <Line type="monotone" dataKey={() => 8} stroke="rgba(16,185,129,0.3)" strokeDasharray="4 4"
                                dot={false} name="Goal" />
                            <Line type="monotone" dataKey="sleep" stroke={CHART_COLORS.sleep} strokeWidth={2.5}
                                dot={{ r: 4, fill: CHART_COLORS.sleep, strokeWidth: 0 }}
                                activeDot={{ r: 6 }} name="Sleep (h)" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stress vs Screen Time Bar Chart */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '360ms' }}>
                    <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                        Stress vs Screen Time
                    </h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} barCategoryGap="30%">
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-muted)' }} />
                            <Bar dataKey="stress" fill={CHART_COLORS.stress} radius={[4, 4, 0, 0]} name="Stress (/10)" fillOpacity={0.85} />
                            <Bar dataKey="screen" fill={CHART_COLORS.screen} radius={[4, 4, 0, 0]} name="Screen (h)" fillOpacity={0.75} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Activity Pie + Health Score Trend ─────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Activity Pie Chart */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '420ms' }}>
                    <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                        Today's Time Breakdown
                    </h2>
                    <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={170}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                                    paddingAngle={3} dataKey="value">
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} opacity={0.85} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => [`${v}h`, '']} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                            {pieData.map(d => (
                                <div key={d.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: d.color }}>{d.value}h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Health Score Trend */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '480ms' }}>
                    <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                        Health Score Trend
                    </h2>
                    <ResponsiveContainer width="100%" height={170}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5}
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} name="Score" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── AI Insight Panel ───────────────────────────────────────── */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '540ms' }}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))' }}>
                        <Sparkles className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                    </div>
                    <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>AI Insights</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        {
                            insight: latest.physiological?.sleepHours < 7
                                ? `Your sleep of ${latest.physiological?.sleepHours}h is below the recommended 7–9h. Try sleeping 30 min earlier.`
                                : `Great sleep of ${latest.physiological?.sleepHours}h! Consistent sleep timing will boost your score further.`,
                            strong: latest.physiological?.sleepHours < 7
                        },
                        {
                            insight: latest.psychological?.stressScore > 6
                                ? `Stress score ${latest.psychological?.stressScore}/10 is elevated. Consider a 10-min mindfulness break.`
                                : `Stress is well managed at ${latest.psychological?.stressScore}/10. Keep it up!`,
                            strong: latest.psychological?.stressScore > 6
                        },
                        {
                            insight: (latest.activity?.stepsPerDay ?? 0) < 8000
                                ? `Only ${(latest.activity?.stepsPerDay ?? 0).toLocaleString()} steps today. A 15-min walk adds ~1,500 steps.`
                                : `${(latest.activity?.stepsPerDay ?? 0).toLocaleString()} steps — great activity level!`,
                            strong: (latest.activity?.stepsPerDay ?? 0) < 8000
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                            <div className="w-1.5 flex-shrink-0 rounded-full mt-1"
                                style={{ background: item.strong ? '#8b5cf6' : 'var(--glass-border)', minHeight: '16px' }} />
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.insight}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
