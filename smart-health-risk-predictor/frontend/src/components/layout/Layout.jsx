import { Sidebar } from './Sidebar';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export function Layout() {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <div className="flex min-h-screen relative overflow-hidden">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 dark:opacity-10"
                    style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
                />
                <div
                    className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-15 dark:opacity-8"
                    style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
                />
                <div
                    className="absolute -bottom-24 left-1/3 w-72 h-72 rounded-full opacity-15 dark:opacity-8"
                    style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
                />
            </div>

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* ── Floating Glass Topbar ── */}
                <header className="sticky top-3 z-40 mx-3 mt-3 mb-0">
                    <div
                        className="glass rounded-3xl px-5 py-3 flex items-center justify-between"
                        style={{ backdropFilter: `blur(var(--topbar-blur))`, WebkitBackdropFilter: `blur(var(--topbar-blur))` }}
                    >
                        {/* Search pill */}
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search…"
                                className="pl-9 pr-4 py-2 rounded-2xl text-sm w-56 outline-none"
                                style={{
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-primary)',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                }}
                            />
                        </div>
                        <div className="flex-1 lg:hidden" />

                        {/* Right group */}
                        <div className="flex items-center gap-2">
                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="relative w-12 h-7 rounded-full transition-all duration-300 flex items-center"
                                style={{
                                    background: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(0,0,0,0.08)',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                }}
                            >
                                <span
                                    className="absolute top-1 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                                    style={{
                                        left: isDark ? '22px' : '3px',
                                        background: isDark ? '#60a5fa' : 'white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    {isDark
                                        ? <Moon className="w-2.5 h-2.5 text-white" />
                                        : <Sun className="w-2.5 h-2.5 text-yellow-500" />
                                    }
                                </span>
                            </button>

                            {/* Notification bell */}
                            <Link to="/notifications">
                                <button className="relative p-2 rounded-2xl transition-all duration-200 hover:scale-105"
                                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                    <Bell className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white dark:border-slate-800 animate-pulse" />
                                </button>
                            </Link>

                            {/* Divider */}
                            <div className="w-px h-6 mx-1" style={{ background: 'var(--glass-border)' }} />

                            {/* Profile avatar */}
                            <Link to="/profile" className="flex items-center gap-2 group">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                        {user?.fullName?.split(' ')[0] || 'User'}
                                    </p>
                                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                                        {user?.role || 'student'}
                                    </p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white/30 group-hover:ring-blue-400/50 transition-all">
                                    {initials}
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 md:p-6 flex-1 overflow-auto mt-4 pb-24 md:pb-6 page-enter">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
