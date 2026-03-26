import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Activity, Moon, Sun } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

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
            scrolled ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
        )}>
            <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-900 dark:text-white group">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>HealthPredict</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            {link.name}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                        aria-label="Toggle Dark Mode"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isDark ? "dark" : "light"}
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </motion.div>
                        </AnimatePresence>
                    </button>
                    <Link to="/login">
                        <Button variant="outline" className="hidden sm:inline-flex border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30">Log In</Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white border-0">Get Started</Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
