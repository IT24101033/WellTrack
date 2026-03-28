import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, BarChart2, Activity, Heart, Brain, ShieldCheck,
    ArrowUpRight, ArrowDownRight, FileText, Zap, CheckCircle2
} from 'lucide-react';

/* ─── Animated counter hook ──────────────────────────────────────────── */
function useCounter(target, duration = 1800, delay = 0) {
    const [value, setValue] = useState(0);
    const ref = useRef(false);

    useEffect(() => {
        if (ref.current) return;
        ref.current = true;
        const timeout = setTimeout(() => {
            let start = null;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setValue(Math.floor(eased * target));
                if (progress < 1) requestAnimationFrame(step);
                else setValue(target);
            };
            requestAnimationFrame(step);
        }, delay);
        return () => clearTimeout(timeout);
    }, [target, duration, delay]);

    return value;
}

/* ─── Sparkline SVG ──────────────────────────────────────────────────── */
function Sparkline({ data, color = '#3b82f6', fill = false }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const W = 120, H = 40;
    const points = data.map((v, i) => [
        (i / (data.length - 1)) * W,
        H - ((v - min) / range) * (H - 6) - 3
    ]);
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const fillPath = `${d} L ${W} ${H + 4} L 0 ${H + 4} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10">
            {fill && (
                <motion.path
                    d={fillPath}
                    fill={`${color}22`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
            )}
            <motion.path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
            />
        </svg>
    );
}

/* ─── Animated Bar Chart ─────────────────────────────────────────────── */
function BarChart({ data, inView }) {
    const max = Math.max(...data.map(d => d.value));
    return (
        <div className="flex items-end gap-1.5 h-20">
            {data.map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <motion.div
                        className="w-full rounded-t-md"
                        style={{ background: bar.color }}
                        initial={{ height: 0 }}
                        animate={inView ? { height: `${(bar.value / max) * 72}px` } : { height: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                    />
                    <span className="text-[9px] text-gray-400 font-medium">{bar.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Donut / Risk Gauge ─────────────────────────────────────────────── */
function RiskGauge({ percent, color, label, inView }) {
    const r = 30, circumference = 2 * Math.PI * r;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16">
                <svg viewBox="0 0 72 72" className="w-16 h-16 -rotate-90">
                    <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <motion.circle
                        cx="36" cy="36" r={r}
                        fill="none" stroke={color} strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={inView ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
                        transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800 dark:text-white">{percent}%</span>
                </div>
            </div>
            <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{label}</span>
        </div>
    );
}

/* ─── Metric Card ────────────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, suffix, delta, trend, sparkData, color, delay, inView }) {
    const bg = {
        blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/50',
        emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50',
        purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/50',
        rose: 'from-rose-500/10 to-rose-600/5 border-rose-200/50',
    };
    const iconColor = {
        blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
        purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
        rose: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30',
    };
    const sparkColor = {
        blue: '#3b82f6', emerald: '#10b981', purple: '#8b5cf6', rose: '#f43f5e'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${bg[color]} dark:from-gray-800/60 dark:to-gray-900/40 dark:border-gray-700/50 p-4 backdrop-blur-sm`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor[color]}`}>
                    <Icon size={16} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {delta}
                </div>
            </div>
            <div className="mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {value}<span className="text-sm font-medium text-gray-500 ml-0.5">{suffix}</span>
                </p>
            </div>
            {sparkData && (
                <div className="mt-2">
                    <Sparkline data={sparkData} color={sparkColor[color]} fill />
                </div>
            )}
        </motion.div>
    );
}

/* ─── Live Pulse Dot ─────────────────────────────────────────────────── */
function PulseDot({ color = 'bg-emerald-500' }) {
    return (
        <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
        </span>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function AnalyticsPreview() {
    const sectionRef = useRef(null);
    const inView = useInView(sectionRef, { once: true, margin: '-80px' });

    const weeklyBars = [
        { label: 'Mon', value: 62, color: '#6366f1' },
        { label: 'Tue', value: 78, color: '#3b82f6' },
        { label: 'Wed', value: 55, color: '#6366f1' },
        { label: 'Thu', value: 90, color: '#10b981' },
        { label: 'Fri', value: 70, color: '#3b82f6' },
        { label: 'Sat', value: 83, color: '#10b981' },
        { label: 'Sun', value: 76, color: '#6366f1' },
    ];

    const metrics = [
        {
            icon: Heart, label: 'Avg Heart Rate', value: '74', suffix: 'bpm',
            delta: '3%', trend: 'down', color: 'rose',
            sparkData: [72, 75, 71, 78, 73, 76, 74, 72, 74]
        },
        {
            icon: Brain, label: 'Stress Level', value: '28', suffix: '%',
            delta: '12%', trend: 'down', color: 'purple',
            sparkData: [45, 40, 38, 32, 35, 30, 28, 26, 28]
        },
        {
            icon: Activity, label: 'Health Score', value: '91', suffix: '/100',
            delta: '8%', trend: 'up', color: 'emerald',
            sparkData: [72, 75, 79, 80, 83, 85, 88, 90, 91]
        },
        {
            icon: ShieldCheck, label: 'Risk Index', value: '12', suffix: '%',
            delta: '5%', trend: 'down', color: 'blue',
            sparkData: [22, 20, 18, 17, 16, 15, 14, 13, 12]
        },
    ];

    const features = [
        "Generate Weekly & Monthly Reports",
        "Visual Risk Trend Charts",
        "Export as PDF for Medical Professionals",
        "Compare Historical Data Periods",
        "AI-Powered Anomaly Detection",
        "Real-time Health Score Tracking",
    ];

    return (
        <section
            ref={sectionRef}
            id="analytics"
            className="relative py-28 overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #f0f7ff 0%, #f8faff 40%, #edfdf8 100%)' }}
        >
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-100/60 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-purple-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-4 md:px-8 relative z-10">

                {/* Section heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100 mb-4">
                        <PulseDot />
                        Live Analytics Engine
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
                        Advanced Reporting &amp;{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                            Analytics
                        </span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                        Dive deep into your health data with our comprehensive analytics suite.
                        Understand trends, identify triggers, and take control.
                    </p>
                </motion.div>

                {/* Main grid */}
                <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">

                    {/* LEFT — Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="relative"
                    >
                        {/* Dashboard card */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/80 bg-white/70 backdrop-blur-xl p-5"
                            style={{ boxShadow: '0 25px 60px rgba(59,130,246,0.12), 0 8px 24px rgba(0,0,0,0.06)' }}
                        >
                            {/* Fake browser bar */}
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <div className="flex-1 mx-2 text-center text-xs text-gray-400 bg-gray-50 rounded-full py-0.5 px-3 border border-gray-100 font-mono">
                                    welltrack.app/analytics
                                </div>
                                <PulseDot color="bg-emerald-400" />
                            </div>

                            {/* Metric cards row */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {metrics.map((m, i) => (
                                    <MetricCard key={i} {...m} delay={0.2 + i * 0.08} inView={inView} />
                                ))}
                            </div>

                            {/* Bar chart + risk gauges */}
                            <div className="grid grid-cols-5 gap-3">
                                {/* Weekly wellness bar chart */}
                                <div className="col-span-3 rounded-2xl border border-gray-100 bg-white/80 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">Weekly Wellness</p>
                                            <p className="text-[10px] text-gray-400">Score trend</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                                            <TrendingUp size={10} /> +14%
                                        </div>
                                    </div>
                                    <BarChart data={weeklyBars} inView={inView} />
                                </div>

                                {/* Risk gauges */}
                                <div className="col-span-2 rounded-2xl border border-gray-100 bg-white/80 p-4 flex flex-col gap-3">
                                    <p className="text-xs font-bold text-gray-800">Risk Profile</p>
                                    <div className="flex flex-col gap-3">
                                        <RiskGauge percent={12} color="#10b981" label="Cardiac" inView={inView} />
                                        <RiskGauge percent={28} color="#8b5cf6" label="Mental" inView={inView} />
                                    </div>
                                </div>
                            </div>

                            {/* PDF export row */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.9 }}
                                className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-4 py-2.5"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <FileText size={14} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800">Monthly Report — March 2025</p>
                                        <p className="text-[10px] text-gray-400">PDF • 2.1 MB • generated just now</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Export
                                </motion.button>
                            </motion.div>
                        </div>

                        {/* Floating badge */}
                        <motion.div
                            className="absolute -top-5 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-20"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <Zap size={15} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 leading-none">AI Insight</p>
                                    <p className="text-xs font-bold text-gray-900 leading-snug">Great Progress! 🎉</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bottom floating badge */}
                        <motion.div
                            className="absolute -bottom-5 -left-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-20"
                            animate={{ y: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <BarChart2 size={15} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 leading-none">Reports Ready</p>
                                    <p className="text-xs font-bold text-gray-900 leading-snug">3 new exports</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* RIGHT — Features list + Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="space-y-10"
                    >
                        <div className="space-y-3">
                            {features.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={inView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.45, delay: 0.3 + index * 0.07 }}
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    </div>
                                    <span className="text-gray-700 font-medium text-sm group-hover:text-gray-900 transition-colors">{item}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: 5000, suffix: '+', label: 'Active Students', color: 'blue' },
                                { value: 98, suffix: '%', label: 'Accuracy Rate', color: 'emerald' },
                                { value: 12000, suffix: '+', label: 'Reports Generated', color: 'purple' },
                            ].map((stat, i) => {
                                const count = inView ? stat.value : 0;
                                return (
                                    <AnimatedStat key={i} {...stat} inView={inView} delay={0.5 + i * 0.12} />
                                );
                            })}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <motion.a
                                href="/register"
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
                            >
                                <Zap size={15} /> Start Tracking Free
                            </motion.a>
                            <motion.a
                                href="/#features"
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-gray-700 text-sm font-semibold border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <BarChart2 size={15} className="text-gray-500" /> Explore Features
                            </motion.a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/* ─── Animated Stat sub-component ───────────────────────────────────── */
function AnimatedStat({ value, suffix, label, color, inView, delay }) {
    const [displayed, setDisplayed] = useState(0);

    useEffect(() => {
        if (!inView) return;
        let start = null;
        const duration = 1600;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(step);
            else setDisplayed(value);
        };
        const id = setTimeout(() => requestAnimationFrame(step), delay * 1000);
        return () => clearTimeout(id);
    }, [inView, value, delay]);

    const gradients = {
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay }}
            className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-4 text-center shadow-sm"
        >
            <div className={`text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradients[color]}`}>
                {displayed.toLocaleString()}{suffix}
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
            {/* Subtle gradient bar at bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradients[color]} opacity-60`} />
        </motion.div>
    );
}
