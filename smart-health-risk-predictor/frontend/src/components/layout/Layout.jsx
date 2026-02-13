import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Bell, ChevronDown, Calendar, Search } from 'lucide-react';
import { Button } from '../ui/Button';

export function Layout() {
    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    {/* Left: Mobile Menu (Hidden on Desktop) & Title/Search */}
                    <div className="flex items-center gap-4">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reports, students..."
                                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Date Filter */}
                        <div className="hidden sm:flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <Button variant="ghost" size="sm" className="h-7 text-xs font-medium bg-white shadow-sm text-primary-700">Weekly</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-gray-900">Monthly</Button>
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:bg-gray-100 rounded-full">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </Button>

                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">John Doe</p>
                                <p className="text-xs text-gray-500">Admin</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-600 to-secondary-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white cursor-pointer">
                                JD
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-4 md:p-8 flex-1 overflow-auto bg-gray-50/50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
