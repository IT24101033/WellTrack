import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Activity } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/#home' },
        { name: 'How It Works', href: '/#how-it-works' },
        { name: 'Features', href: '/#features' },
        { name: 'Analytics', href: '/#analytics' },
        { name: 'About', href: '/#about' },
        { name: 'Contact', href: '/#contact' },
    ];

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300",
            scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
        )}>
            <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-900 group">
                    <Activity className="h-6 w-6 text-primary-600 group-hover:scale-110 transition-transform" />
                    <span>HealthPredict</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                        >
                            {link.name}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/login">
                        <Button variant="outline" className="hidden sm:inline-flex border-primary-200 text-primary-700 hover:bg-primary-50">Log In</Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button className="bg-success hover:bg-success-600 shadow-lg shadow-success/20 text-white border-0">Get Started</Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
