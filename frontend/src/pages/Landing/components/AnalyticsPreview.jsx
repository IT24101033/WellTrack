import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function AnalyticsPreview() {
    return (
        <section id="analytics" className="py-20 overflow-hidden bg-gray-50">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="relative rounded-2xl shadow-2xl border border-gray-200 bg-white p-2">
                            <img src="/dashboard-preview.png" alt="Analytics Dashboard" className="w-full rounded-xl bg-gray-100"
                                onError={(e) => {
                                    e.target.src = 'https://placehold.co/800x600/f3f4f6/3B82F6?text=Analytics+Preview';
                                }}
                            />
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-8">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Advanced Reporting & Analytics</h2>
                        <p className="text-lg text-gray-600">
                            Dive deep into your health data with our comprehensive analytics suite. Understand trends, identify triggers, and take control.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Generate Weekly & Monthly Reports",
                                "Visual Risk Trend Charts",
                                "Export as PDF for Medical Professionals",
                                "Compare Historical Data Periods"
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-success-600 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
