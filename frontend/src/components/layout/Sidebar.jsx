import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Activity, UserCircle, FileText, Bell,
    Lightbulb, Calendar, LogOut, PlusCircle, ShieldCheck,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Health Input', href: '/health-input', icon: PlusCircle },
    { name: 'Risk Prediction', href: '/prediction', icon: Activity },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Tips & Advice', href: '/tips', icon: Lightbulb },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: UserCircle },
];

export function Sidebar() {
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();
    const { user, isAdmin, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const allLinks = [
        ...links,
        ...(isAdmin ? [{ name: 'Users', href: '/admin/users', icon: ShieldCheck }] : []),
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <>
            {/* ── Desktop Sidebar ── */}
            <aside
                className="hidden md:flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out"
                style={{
                    width: collapsed ? '72px' : '240px',
                    minWidth: collapsed ? '72px' : '240px',
                }}
            >
                <div
                    className="flex flex-col h-full m-3 rounded-3xl overflow-hidden"
                    style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--card-blur))',
                        WebkitBackdropFilter: 'blur(var(--card-blur))',
                        border: '1px solid var(--glass-border)',
                        boxShadow: 'var(--glass-shadow)',
                    }}
                >
                    {/* Logo */}
                    <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        {!collapsed && (
                            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                HealthPredict
                            </span>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="mx-4 mb-3" style={{ height: '1px', background: 'var(--glass-border)' }} />

                    {/* Nav Links */}
                    <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
                        {allLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    title={collapsed ? link.name : undefined}
                                    className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 group ${collapsed ? 'justify-center' : ''}`}
                                    style={{
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))'
                                            : 'transparent',
                                        color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                        boxShadow: isActive ? '0 0 0 1px rgba(59,130,246,0.2)' : 'none',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) e.currentTarget.style.background = 'var(--glass-bg-hover)';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {/* Active indicator */}
                                    {isActive && !collapsed && (
                                        <span
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                                            style={{ background: 'linear-gradient(180deg, #60a5fa, #8b5cf6)', boxShadow: '0 0 8px rgba(59,130,246,0.6)' }}
                                        />
                                    )}
                                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
                                    {!collapsed && (
                                        <span className="text-sm font-medium truncate">{link.name}</span>
                                    )}
                                    {/* Tooltip on collapsed */}
                                    {collapsed && (
                                        <span
                                            className="absolute left-full ml-3 px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50"
                                            style={{ background: 'var(--glass-bg-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', backdropFilter: 'blur(12px)' }}
                                        >
                                            {link.name}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Divider */}
                    <div className="mx-4 mt-3" style={{ height: '1px', background: 'var(--glass-border)' }} />

                    {/* User + Logout */}
                    <div className="px-2 py-3 space-y-1">
                        {!collapsed && (
                            <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-200"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {initials}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.fullName || 'User'}</p>
                                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role || 'student'}</p>
                                </div>
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            title={collapsed ? 'Logout' : undefined}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            {!collapsed && <span className="font-medium">Logout</span>}
                        </button>
                    </div>

                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="mx-auto mb-3 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200"
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                    >
                        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </aside>

            {/* ── Mobile Bottom Navigation ── */}
            <nav
                className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-3xl px-4 py-2.5 flex items-center justify-around bottom-nav-blur"
                style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 -4px 40px rgba(0,0,0,0.12)',
                }}
            >
                {allLinks.slice(0, 6).map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all duration-200"
                            style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                        >
                            <Icon className="w-5 h-5" />
                            {isActive && (
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
