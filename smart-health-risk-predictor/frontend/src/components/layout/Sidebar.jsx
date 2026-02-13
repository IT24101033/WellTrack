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
        { name: 'Reports & Analytics', href: '/reports', icon: FileText },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Tips & Advice', href: '/tips', icon: Lightbulb },
        { name: 'Schedule', href: '/schedule', icon: Calendar },
    ];

    return (
        <div className="hidden md:flex h-screen w-64 flex-col border-r bg-white sticky top-0">
            <div className="p-6">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-900">
                    <Activity className="h-6 w-6 text-primary-600" />
                    <span>HealthPredict</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {links.map((link, index) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={index}
                                to={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                                    isActive
                                        ? "bg-green-50 text-success font-semibold shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn("h-4 w-4", isActive ? "text-success" : "text-gray-400 group-hover:text-gray-500")} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">JD</div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-900">John Doe</p>
                        <p className="text-xs text-gray-500">Student</p>
                    </div>
                </div>
                <Button variant="ghost" className="w-full justify-start gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50" asChild>
                    <Link to="/login">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Link>
                </Button>
            </div>
        </div>
    );
}
