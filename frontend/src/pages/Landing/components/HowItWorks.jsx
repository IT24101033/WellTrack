import React from 'react';
import { ClipboardList, Cpu, FileText } from 'lucide-react';

export function HowItWorks() {
    const steps = [
        {
            icon: ClipboardList,
            title: "Input Health Data",
            description: "Log your daily sleep, stress levels, and activity in seconds.",
            step: "01"
        },
        {
            icon: Cpu,
            title: "AI Analyzes Patterns",
            description: "Our advanced AI processes your data to find hidden risk patterns.",
            step: "02"
        },
        {
            icon: FileText,
            title: "Get Insights & Reports",
            description: "Receive personalized risk reports and actionable health recommendations.",
            step: "03"
        }
    ];

    return (
        <section id="how-it-works" className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How It Works</h2>
                    <p className="mt-4 text-lg text-gray-600">Three simple steps to better health monitoring.</p>
                </div>

                <div className="relative grid md:grid-cols-3 gap-12">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-100 -z-10"></div>

                    {steps.map((step, index) => (
                        <div key={index} className="relative flex flex-col items-center text-center group">
                            <div className="w-24 h-24 bg-white border-4 border-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:border-primary-100 group-hover:bg-primary-50 transition-colors duration-300">
                                <step.icon className="h-10 w-10 text-primary-600" />
                            </div>
                            <div className="absolute top-0 right-1/2 translate-x-12 -translate-y-2 text-6xl font-black text-gray-50 opacity-50 z-[-1] select-none">
                                {step.step}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                            <p className="text-gray-600 leading-relaxed max-w-xs">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
