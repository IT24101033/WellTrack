import React from 'react';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Hero() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    };

    return (
        <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden dark:bg-gray-950 transition-colors duration-500">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-60 -translate-x-1/4 translate-y-1/4"></div>

            <div className="container mx-auto px-4 md:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* ── Left: Copy ── */}
                    <motion.div
                        className="space-y-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            AI-Powered Health Monitoring
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.15] tracking-tight">
                            Smarter Health Monitoring for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-500 dark:from-blue-400 dark:to-sky-300">Students.</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                            Track, analyze and predict health risks using advanced AI analytics.
                            Built specifically for modern student life to help you stay ahead of stress and burnout.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                            <Link to="/dashboard">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 text-white border-0 h-12 px-8 rounded-full text-base font-semibold w-full sm:w-auto">
                                        Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </Link>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base font-semibold border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 w-full sm:w-auto">
                                    <PlayCircle className="mr-2 h-4 w-4" /> Learn More
                                </Button>
                            </motion.div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full" />
                                    </div>
                                ))}
                            </div>
                            <p>Joined by 5,000+ students</p>
                        </motion.div>
                    </motion.div>

                    {/* ── Right: Dashboard Mockup ── */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        {/* Main card — floats up and down */}
                        <motion.div
                            className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                            animate={{ y: [0, -12, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        >
                            {/* Browser chrome bar */}
                            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <div className="flex-1 mx-2 text-center text-xs text-gray-400 font-mono bg-white dark:bg-gray-700 rounded-full px-3 py-0.5 border border-gray-100 dark:border-gray-600">
                                    welltrack.app/dashboard
                                </div>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            </div>

                            {/* Dashboard body */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 space-y-3">

                                {/* Row 1: Health Score Donut + Metric Tiles */}
                                <div className="flex gap-3">
                                    {/* Health Score ring */}
                                    <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-gray-100 dark:border-gray-700 w-28">
                                        <div className="relative w-16 h-16">
                                            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                                                <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                                <motion.circle
                                                    cx="32" cy="32" r="26"
                                                    fill="none"
                                                    stroke="url(#heroScoreGrad)"
                                                    strokeWidth="6"
                                                    strokeLinecap="round"
                                                    strokeDasharray={163.4}
                                                    initial={{ strokeDashoffset: 163.4 }}
                                                    animate={{ strokeDashoffset: 163.4 * 0.09 }}
                                                    transition={{ duration: 1.8, delay: 1.0, ease: "easeOut" }}
                                                />
                                                <defs>
                                                    <linearGradient id="heroScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#3b82f6" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">91</span>
                                                <span className="text-[9px] text-gray-400">/ 100</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 text-center leading-tight">Health Score</p>
                                    </div>

                                    {/* Heart Rate + Stress tiles */}
                                    <div className="flex flex-col gap-2 flex-1">
                                        {/* Heart Rate */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-rose-500">
                                                    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-gray-400 leading-none">Heart Rate</p>
                                                <p className="text-xs font-bold text-gray-800 dark:text-white">74 <span className="text-gray-400 font-normal">bpm</span></p>
                                            </div>
                                            {/* ECG sparkline */}
                                            <svg viewBox="0 0 48 20" className="w-12 h-5 flex-shrink-0">
                                                <motion.polyline
                                                    points="0,10 6,10 8,4 10,16 12,10 16,10 18,2 20,18 22,10 28,10 30,6 32,14 34,10 48,10"
                                                    fill="none"
                                                    stroke="#f43f5e"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 1.5, delay: 1.2 }}
                                                />
                                            </svg>
                                        </div>

                                        {/* Stress Level */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-purple-500">
                                                    <path d="M21.33 12.91c.09 1.55-.62 3.04-1.89 3.95l.77 2.28-2.33-.77c-3.27 1.7-7.35.4-9.06-2.87-1.7-3.27-.4-7.35 2.87-9.06 3.27-1.7 7.35-.4 9.06 2.87.39.75.6 1.56.58 2.6z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-gray-400 leading-none">Stress Level</p>
                                                <p className="text-xs font-bold text-gray-800 dark:text-white">28 <span className="text-gray-400 font-normal">%</span></p>
                                            </div>
                                            <div className="w-12 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden flex-shrink-0">
                                                <motion.div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '28%' }}
                                                    transition={{ duration: 1.2, delay: 1.3 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Weekly Wellness Bar Chart */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-gray-700 dark:text-gray-200">Weekly Wellness</p>
                                        <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">↑ 14% this week</span>
                                    </div>
                                    <div className="flex items-end gap-1 h-14">
                                        {[
                                            { h: 62, c: '#6366f1', l: 'M' },
                                            { h: 78, c: '#3b82f6', l: 'T' },
                                            { h: 55, c: '#6366f1', l: 'W' },
                                            { h: 90, c: '#10b981', l: 'T' },
                                            { h: 70, c: '#3b82f6', l: 'F' },
                                            { h: 83, c: '#10b981', l: 'S' },
                                            { h: 76, c: '#6366f1', l: 'S' },
                                        ].map((bar, i) => (
                                            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                                                <motion.div
                                                    className="w-full rounded-t-sm"
                                                    style={{ backgroundColor: bar.c }}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(bar.h / 90) * 44}px` }}
                                                    transition={{ duration: 0.5, delay: 1.4 + i * 0.07, ease: 'easeOut' }}
                                                />
                                                <span className="text-[8px] text-gray-400">{bar.l}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Row 3: AI Risk Banner */}
                                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl px-3 py-2 border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center flex-shrink-0">
                                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-600">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">AI Risk Analysis</p>
                                        <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">Low risk profile · No anomalies detected</p>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-800/40 px-1.5 py-0.5 rounded-full flex-shrink-0">LOW</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating badge — Risk Analysis */}
                        <motion.div
                            className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-50 dark:border-gray-700 z-20"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Risk Analysis</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Low Risk • 98%</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating badge — Weekly Report */}
                        <motion.div
                            className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-50 dark:border-gray-700 z-20"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Weekly Report</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Generated ✓</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
