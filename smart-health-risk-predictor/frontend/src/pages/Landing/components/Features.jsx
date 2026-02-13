import React from 'react';
import { Activity, LayoutDashboard, Brain, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { motion } from 'framer-motion';

export function Features() {
    const features = [
        {
            icon: Activity,
            title: "AI Risk Prediction",
            description: "Real-time health risk detection powered by advanced machine learning models.",
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            icon: LayoutDashboard,
            title: "Smart Analytics Dashboard",
            description: "Detailed weekly and monthly insights visualize your health journey effortlessly.",
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            icon: Brain,
            title: "Personalized Recommendations",
            description: "Tailored lifestyle and stress advice adapt to your unique patterns.",
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-900/20"
        },
        {
            icon: ShieldCheck,
            title: "Secure & Private",
            description: "Enterprise-grade encryption ensures your health data remains completely private.",
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900/20"
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <section id="features" className="py-20 bg-gray-50/50 dark:bg-gray-900 transition-colors duration-500">
            <div className="container mx-auto px-4 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <span className="text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase text-sm">Features</span>
                    <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Everything You Need to Stay Healthy</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">A complete suite of tools designed to monitor, analyze, and improve your student wellbeing.</p>
                </motion.div>

                <motion.div
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                    variants={container}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={item} whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}>
                            <Card className="border-0 shadow-lg shadow-gray-200/50 dark:shadow-none dark:bg-gray-800 h-full">
                                <CardContent className="p-8">
                                    <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6`}>
                                        <feature.icon className={`h-7 w-7 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
