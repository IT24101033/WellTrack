import { Sidebar } from './Sidebar';
import { Outlet, Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Layout() {
    const { user } = useAuth();
    const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="bg-white border-b px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    {/* Search */}
                    <div className="flex items-center gap-4">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reports, students..."
                                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <Link to="/notifications">
                            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                            </button>
                        </Link>

                        <div className="w-px h-6 bg-gray-200 mx-1" />

                        {/* User badge → links to profile */}
                        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{user?.fullName || 'User'}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role || 'student'}</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                                {initials}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 md:p-8 flex-1 overflow-auto bg-gray-50/50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
