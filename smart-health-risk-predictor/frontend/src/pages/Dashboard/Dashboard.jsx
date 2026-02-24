import React, { useState, useEffect, useRef } from 'react';
import { Moon, Zap, Smartphone, Activity, ArrowUp, ArrowDown, Minus, Sparkles, CheckCircle, Target, Award, Flame } from 'lucide-react';

// ── Animated SVG Risk Ring ─────────────────────────────────────────────
function RiskRing({ level = 'low', size = 180 }) {
    const config = {
        low: { color: '#10b981', glow: 'rgba(16,185,129,0.5)', label: 'Low Risk', pct: 25 },
        moderate: { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', label: 'Moderate Risk', pct: 55 },
        high: { color: '#ef4444', glow: 'rgba(239,68,68,0.5)', label: 'High Risk', pct: 82 },
    };
    const c = config[level];
    const r = (size - 20) / 2;
    const circumference = 2 * Math.PI * r;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const t = setTimeout(() => setOffset(circumference * (1 - c.pct / 100)), 300);
        return () => clearTimeout(t);
    }, [level, circumference, c.pct]);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 rounded-full opacity-30 animate-pulse-glow"
                style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)` }} />
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id={`rg-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={c.color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={c.color} stopOpacity="1" />
                    </linearGradient>
                </defs>
                {/* Track */}
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="var(--glass-border)" strokeWidth={10} />
                {/* Progress */}
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={`url(#rg-${level})`}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 8px ${c.color})` }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold" style={{ color: c.color }}>{c.pct}%</span>
                <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Risk Score</span>
            </div>
        </div>
    );
}

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, change, trend, delay = 0 }) {
    const trendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
    const TrendIcon = trendIcon;
    const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : 'var(--text-muted)';

    return (
        <div
            className="glass-card p-5 cursor-default animate-fade-in"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: `${trendColor}18`, color: trendColor }}>
                    <TrendIcon className="w-3 h-3" />
                    {change}
                </div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{title}</div>
        </div>
    );
}

// ── Progress bar ───────────────────────────────────────────────────────
function GoalBar({ label, pct, color }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="font-semibold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
            </div>
        </div>
    );
}

// ── Badge ──────────────────────────────────────────────────────────────
function Badge({ icon: Icon, label, earned }) {
    return (
        <div className="glass-sm p-3 flex flex-col items-center gap-1 text-center transition-all duration-200 group"
            style={{ opacity: earned ? 1 : 0.4 }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                    background: earned ? 'linear-gradient(135deg, rgba(251,191,36,0.2),rgba(245,158,11,0.3))' : 'var(--glass-bg)',
                    boxShadow: earned ? '0 0 16px rgba(245,158,11,0.3)' : 'none',
                }}>
                <Icon className="w-5 h-5" style={{ color: earned ? '#f59e0b' : 'var(--text-muted)' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: earned ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
        </div>
    );
}

// ── Timeline Item ──────────────────────────────────────────────────────
function TimelineItem({ icon: Icon, color, time, description, metric, last }) {
    return (
        <div className="relative flex gap-4 pl-2">
            {/* Line */}
            {!last && (
                <div className="absolute left-6 top-10 bottom-0 w-px"
                    style={{ background: 'linear-gradient(to bottom, var(--accent-blue) 0%, transparent 100%)', opacity: 0.25 }} />
            )}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 glass-sm p-3 mb-3">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{description}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)' }}>{metric}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{time}</p>
            </div>
        </div>
    );
}

// ── Main Dashboard ─────────────────────────────────────────────────────
export default function Dashboard() {
    const stats = [
        { title: 'Sleep', value: '7h 20m', icon: Moon, color: '#6366f1', change: '+50m', trend: 'up' },
        { title: 'Steps', value: '8,432', icon: Zap, color: '#f97316', change: '-12%', trend: 'down' },
        { title: 'Screen Time', value: '3h 45m', icon: Smartphone, color: '#3b82f6', change: '-30m', trend: 'up' },
        { title: 'Stress Level', value: 'Moderate', icon: Activity, color: '#f59e0b', change: 'Stable', trend: 'neutral' },
    ];

    const timeline = [
        { icon: Moon, color: '#6366f1', time: '10:30 PM', description: 'Slept 7h 20m', metric: '+50m' },
        { icon: Zap, color: '#f97316', time: '8:00 AM', description: 'Morning walk – 4,200 steps', metric: '42%' },
        { icon: Activity, color: '#10b981', time: '1:00 PM', description: 'Stress check – Moderate', metric: '5/10' },
        { icon: Smartphone, color: '#3b82f6', time: '9:00 PM', description: 'Screen time logged', metric: '3h 45m' },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Hero greeting */}
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Good evening 👋</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Here's your health snapshot for today.</p>
            </div>

            {/* ── 1. Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((s, i) => <StatCard key={s.title} {...s} delay={i * 60} />)}
            </div>

            {/* ── 2. Middle row: Risk ring + AI insight */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Risk Prediction Centerpiece */}
                <div className="glass-card p-6 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between w-full mb-2">
                        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Risk Prediction</h2>
                        <span className="text-xs px-3 py-1 rounded-full font-semibold"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Live</span>
                    </div>
                    <RiskRing level="low" size={180} />
                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                        Based on your sleep and stress trends
                    </p>
                    {/* Metric badges */}
                    <div className="flex gap-3 w-full">
                        {[
                            { label: 'Sleep Score', value: '82', color: '#6366f1' },
                            { label: 'Activity', value: '68', color: '#f97316' },
                            { label: 'Stress Stability', value: '74', color: '#10b981' },
                        ].map(b => (
                            <div key={b.label} className="glass-sm flex-1 p-2.5 text-center">
                                <p className="text-lg font-bold" style={{ color: b.color }}>{b.value}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Insight Panel */}
                <div className="glass-card p-6 flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '260ms' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))' }}>
                            <Sparkles className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                        </div>
                        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>AI Insights</h2>
                    </div>

                    {[
                        { insight: 'Your stress increases when sleep drops below 6 hours. Consider adjusting your bedtime by 30 minutes.', strong: true },
                        { insight: 'Screen time was 25% lower this week. This likely contributed to better sleep quality.', strong: false },
                        { insight: 'Step count is trending down. A 15-minute walk after lunch could help you hit your daily goal.', strong: false },
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

            {/* ── 3. Timeline + Goals */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Activity Timeline */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '320ms' }}>
                    <h2 className="font-bold text-base mb-5" style={{ color: 'var(--text-primary)' }}>Today's Timeline</h2>
                    <div className="space-y-1">
                        {timeline.map((item, i) => (
                            <TimelineItem key={i} {...item} last={i === timeline.length - 1} />
                        ))}
                    </div>
                </div>

                {/* Goals & Achievements */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '380ms' }}>
                    <h2 className="font-bold text-base mb-5" style={{ color: 'var(--text-primary)' }}>Goals & Achievements</h2>
                    <div className="space-y-4 mb-6">
                        <GoalBar label="Daily Sleep Goal (8h)" pct={92} color="#6366f1" />
                        <GoalBar label="Steps Goal (10,000)" pct={84} color="#f97316" />
                        <GoalBar label="Screen Time Limit (4h)" pct={94} color="#3b82f6" />
                    </div>
                    <div className="h-px mb-5" style={{ background: 'var(--glass-border)' }} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Achievements</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <Badge icon={Flame} label="7-Day Streak" earned />
                        <Badge icon={Zap} label="Active Student" earned />
                        <Badge icon={CheckCircle} label="Balanced Lifestyle" earned={false} />
                    </div>
                </div>
            </div>
        </div>
    );
}
