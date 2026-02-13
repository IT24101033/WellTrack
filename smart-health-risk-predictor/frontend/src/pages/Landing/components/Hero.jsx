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
                                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 overflow-hidden`}>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full" />
                                    </div>
                                ))}
                            </div>
                            <p>Joined by 5,000+ students</p>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <motion.div
                            className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                            animate={{ y: [0, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        >
                            {/* Dashboard Mockup Representation */}
                            <div className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 p-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                </div>
                                <div className="flex-1 text-center text-xs text-gray-400 font-medium">healthpredict.app/dashboard</div>
                            </div>
                            <div className="p-1">
                                <img src="/dashboard-preview.png" alt="Dashboard Preview" className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 aspect-[4/3] object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/800x600/f3f4f6/3B82F6?text=Health+Dashboard+Preview';
                                    }}
                                />
                            </div>
                        </motion.div>

                        {/* Floating Elements */}
                        <motion.div
                            className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-50 dark:border-gray-700 z-20"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Risk Analysis</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Low Risk • 98%</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-50 dark:border-gray-700 z-20"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Weekly Report</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Generated</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
