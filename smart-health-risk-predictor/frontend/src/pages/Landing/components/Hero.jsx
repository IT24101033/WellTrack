import React from 'react';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
    return (
        <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary-100/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-success-100/50 rounded-full blur-3xl opacity-60 -translate-x-1/4 translate-y-1/4"></div>

            <div className="container mx-auto px-4 md:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            AI-Powered Health Monitoring
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-[1.15] tracking-tight">
                            Smarter Health Monitoring for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">Students.</span>
                        </h1>

                        <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                            Track, analyze and predict health risks using advanced AI analytics.
                            Built specifically for modern student life to help you stay ahead of stress and burnout.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/dashboard">
                                <Button size="lg" className="bg-success hover:bg-success-600 shadow-xl shadow-success/20 text-white border-0 h-12 px-8 rounded-full text-base">
                                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base border-gray-200 hover:bg-gray-50 text-gray-700">
                                <PlayCircle className="mr-2 h-4 w-4" /> Learn More
                            </Button>
                        </div>

                        <div className="pt-4 flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden`}>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full" />
                                    </div>
                                ))}
                            </div>
                            <p>Joined by 5,000+ students</p>
                        </div>
                    </div>

                    <div className="relative animate-in slide-in-from-right duration-700 delay-200">
                        <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
                            {/* Dashboard Mockup Representation */}
                            <div className="bg-gray-50 border-b p-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                </div>
                                <div className="flex-1 text-center text-xs text-gray-400 font-medium">healthpredict.app/dashboard</div>
                            </div>
                            <div className="p-1">
                                <img src="/dashboard-preview.png" alt="Dashboard Preview" className="w-full rounded-lg bg-gray-50 aspect-[4/3] object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/800x600/f3f4f6/3B82F6?text=Health+Dashboard+Preview';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-gray-50 animate-bounce-slow z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Risk Analysis</p>
                                    <p className="text-sm font-bold text-gray-900">Low Risk • 98%</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-50 animate-bounce-slow delay-500 z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Weekly Report</p>
                                    <p className="text-sm font-bold text-gray-900">Generated</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
