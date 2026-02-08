import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function Layout() {
    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                    <h1 className="text-xl font-semibold text-gray-800">Smart Health Risk Predictor</h1>
                    <div className="text-sm text-gray-500">Welcome back, John!</div>
                </header>
                <main className="p-8 flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
