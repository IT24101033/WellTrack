import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, User, FileText, Bell, Lightbulb, Calendar, LogOut, PlusCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export function Sidebar() {
    const location = useLocation();
    const pathname = location.pathname;

    const links = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Health Input', href: '/health-input', icon: PlusCircle },
        { name: 'Risk Prediction', href: '/prediction', icon: Activity },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Tips & Advice', href: '/tips', icon: Lightbulb },
        { name: 'Schedule', href: '/schedule', icon: Calendar },
    ];

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-white">
            <div className="p-6">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
                    <Activity className="h-6 w-6" />
                    <span>HealthPredict</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {links.map((link, index) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={index}
                                to={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    pathname === link.href
                                        ? "bg-primary-50 text-primary"
                                        : "text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">JD</div>
                    <div className="text-sm">
                        <p className="font-medium">John Doe</p>
                        <p className="text-xs text-gray-500">Student</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link to="/login">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Link>
                </Button>
            </div>
        </div>
    );
}
