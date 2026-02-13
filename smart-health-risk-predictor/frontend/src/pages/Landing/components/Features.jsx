import React from 'react';
import { Activity, LayoutDashboard, Brain, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

export function Features() {
    const features = [
        {
            icon: Activity,
            title: "AI Risk Prediction",
            description: "Real-time health risk detection powered by advanced machine learning models.",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: LayoutDashboard,
            title: "Smart Analytics Dashboard",
            description: "Detailed weekly and monthly insights visualize your health journey effortlessly.",
            color: "text-green-500",
            bg: "bg-green-50"
        },
        {
            icon: Brain,
            title: "Personalized Recommendations",
            description: "Tailored lifestyle and stress advice adapt to your unique patterns.",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            icon: ShieldCheck,
            title: "Secure & Private",
            description: "Enterprise-grade encryption ensures your health data remains completely private.",
            color: "text-orange-500",
            bg: "bg-orange-50"
        }
    ];

    return (
        <section id="features" className="py-20 bg-gray-50/50">
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">Features</span>
                    <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Everything You Need to Stay Healthy</h2>
                    <p className="mt-4 text-lg text-gray-600">A complete suite of tools designed to monitor, analyze, and improve your student wellbeing.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <CardContent className="p-8">
                                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6`}>
                                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
