import React, { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustSection } from './components/TrustSection';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { AnalyticsPreview } from './components/AnalyticsPreview';
import { Footer } from './components/Footer';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export default function Landing() {
    // Smooth scroll for anchor links
    useEffect(() => {
        const handleAnchorClick = (e) => {
            const target = e.target;
            const href = target.getAttribute('href');
            if (href && href.startsWith('/#')) {
                const id = href.replace('/#', '');
                const element = document.getElementById(id);
                if (element) {
                    e.preventDefault();
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);
        return () => document.removeEventListener('click', handleAnchorClick);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-primary-100 selection:text-primary-900">
            <Navbar />

            <main>
                <Hero />
                <TrustSection />
                <Features />
                <HowItWorks />
                <AnalyticsPreview />

                {/* CTA Section */}
                <section className="py-20 bg-blue-950 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-900/50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/2"></div>
                    <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
                        <h2 className="text-3xl font-bold sm:text-4xl mb-6">Take Control of Your Health Today.</h2>
                        <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                            Join thousands of students who are improving their well-being with AI-powered insights.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 h-12 px-10 rounded-full font-semibold text-base shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105">
                                    Create Free Account
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm h-12 px-10 rounded-full font-semibold text-base transition-transform hover:scale-105">
                                    Login to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
