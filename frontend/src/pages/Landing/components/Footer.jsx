import React from 'react';
import { Activity, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-900 mb-4">
                            <Activity className="h-6 w-6 text-primary-600" />
                            <span>HealthPredict</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Empowering students to take control of their health through AI-driven insights and predictive analytics.
                        </p>
                        <div className="flex gap-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary"><Twitter className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary"><Github className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary"><Linkedin className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Roadmap</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Guides</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">API Status</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>© 2024 HealthPredict Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-gray-900">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-900">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
