import React, { useState, useEffect } from 'react';
import { Users, FileText, Crown, Activity, Calendar, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const COLORS = {
    high: '#ef4444',
    moderate: '#f59e0b',
    low: '#10b981'
};

function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="glass-card p-6 flex items-center gap-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</h3>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { token, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`${BASE_URL}/admin/analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setStats(data.analytics);
                }
            } catch (err) {
                console.error('Failed to fetch admin analytics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!stats) return <p className="text-center mt-10" style={{ color: 'var(--text-muted)' }}>Analytics unavailable.</p>;

    const pieData = [
        { name: 'High Risk', value: stats.riskStats.high, color: COLORS.high },
        { name: 'Moderate Risk', value: stats.riskStats.moderate, color: COLORS.moderate },
        { name: 'Low Risk', value: stats.riskStats.low, color: COLORS.low },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>System Overview</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Welcome back, Admin {user?.fullName?.split(' ')[0]}</p>
                </div>
                <div className="px-4 py-2 rounded-2xl flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-sm font-bold">Admin Privileges</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard title="Total Students" value={stats.totalUsers} icon={Users} color="#3b82f6" />
                <StatCard title="Total Health Reports" value={stats.totalReports} icon={FileText} color="#6366f1" />
                <StatCard title="Premium Subscriptions" value={stats.premiumUsers} icon={Crown} color="#f59e0b" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Global Risk Distribution */}
                <div className="glass-card p-6 flex flex-col items-center">
                    <div className="w-full flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Global Risk Distribution</h2>
                    </div>
                    {pieData.length === 0 ? (
                        <p className="text-sm my-auto text-center" style={{ color: 'var(--text-muted)' }}>No reports generated yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem' }} 
                                    itemStyle={{ fontWeight: 'bold' }} 
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Recent Signups */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Recent Signups</h2>
                    </div>
                    {stats.recentUsers.length === 0 ? (
                        <p className="text-sm text-center my-4" style={{ color: 'var(--text-muted)' }}>No users found.</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentUsers.map(u => (
                                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ border: '1px solid var(--glass-border)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold font-mono">
                                            {u.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{u.fullName}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
