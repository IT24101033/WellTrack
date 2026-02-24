import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, UserCircle, FileText, Bell, Lightbulb, Calendar, LogOut, PlusCircle, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();
    const { user, isAdmin, logout } = useAuth();

    const links = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Health Input', href: '/health-input', icon: PlusCircle },
        { name: 'Risk Prediction', href: '/prediction', icon: Activity },
        { name: 'Reports & Analytics', href: '/reports', icon: FileText },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Tips & Advice', href: '/tips', icon: Lightbulb },
        { name: 'Schedule', href: '/schedule', icon: Calendar },
        { name: 'My Profile', href: '/profile', icon: UserCircle },
        ...(isAdmin ? [{ name: 'User Management', href: '/admin/users', icon: ShieldCheck }] : []),
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <div className="hidden md:flex h-screen w-64 flex-col border-r bg-white sticky top-0">
            {/* Logo */}
            <div className="p-6">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-900">
                    <Activity className="h-6 w-6 text-primary-600" />
                    <span>HealthPredict</span>
                </Link>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium gap-0.5">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} to={link.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                )}>
                                <Icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : 'text-gray-400')} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User Footer */}
            <div className="border-t p-4">
                <Link to="/profile"
                    className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {initials}
                    </div>
                    <div className="text-sm overflow-hidden">
                        <p className="font-medium text-gray-900 truncate">{user?.fullName || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || 'student'}</p>
                    </div>
                </Link>
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition font-medium">
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}
