import React from 'react';

export function TrustSection() {
    return (
        <section className="py-12 border-y border-gray-100 bg-white">
            <div className="container mx-auto px-4 md:px-8">
                <p className="text-center text-gray-500 font-medium mb-8">Trusted by Students & Researchers Worldwide</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {[
                        { label: "Students Monitored", value: "5,000+" },
                        { label: "Prediction Accuracy", value: "95%" },
                        { label: "AI Risk Analysis", value: "24/7" },
                    ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl font-extrabold text-primary-900 mb-2">{stat.value}</div>
                            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
