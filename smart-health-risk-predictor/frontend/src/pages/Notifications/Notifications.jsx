import React, { useState } from 'react';
import { Bell, AlertCircle, Info, CheckCircle, Zap, Check, Trash2 } from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
    { id: 1, type: 'warning', read: false, title: 'Stress Level High', time: '10 min ago', message: 'Your stress score was 8/10 today. Consider a short mindfulness break.' },
    { id: 2, type: 'info', read: false, title: 'Weekly Report Ready', time: '2 hours ago', message: 'Your Week 7 health report is generated. View your detailed analytics.' },
    { id: 3, type: 'success', read: false, title: 'Step Goal Achieved!', time: '3 hours ago', message: 'You reached 10,000 steps today. Excellent work – keep it up!' },
    { id: 4, type: 'alert', read: false, title: 'Sleep Below Target', time: 'Yesterday', message: 'You slept only 5.5h last night. Aim for 7–9 hours for optimal health.' },
    { id: 5, type: 'info', read: true, title: 'New Health Tips Arrived', time: '2 days ago', message: '5 personalised tips are ready for you in the Tips & Advice section.' },
    { id: 6, type: 'success', read: true, title: 'Profile Updated', time: '3 days ago', message: 'Your health profile was updated successfully.' },
];

const typeConfig = {
    warning: { icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', glow: 'rgba(245,158,11,0.2)' },
    info: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', glow: 'rgba(59,130,246,0.15)' },
    success: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', glow: 'rgba(16,185,129,0.15)' },
    alert: { icon: Zap, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', glow: 'rgba(239,68,68,0.15)' },
};

export default function Notifications() {
    const [items, setItems] = useState(INITIAL_NOTIFICATIONS);
    const [filter, setFilter] = useState('all');
    const unreadCount = items.filter(n => !n.read).length;

    const markAll = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
    const markOne = id => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const deleteOne = id => setItems(prev => prev.filter(n => n.id !== id));

    const shown = items.filter(n => filter === 'all' ? true : filter === 'unread' ? !n.read : n.read);

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAll}
                        className="glass-btn-outline flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                )}
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'unread', 'read'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200"
                        style={{
                            background: filter === f ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'var(--glass-bg)',
                            color: filter === f ? 'white' : 'var(--text-muted)',
                            border: '1px solid var(--glass-border)',
                            boxShadow: filter === f ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                        }}>
                        {f} {f === 'all' ? `(${items.length})` : f === 'unread' ? `(${unreadCount})` : `(${items.length - unreadCount})`}
                    </button>
                ))}
            </div>

            {/* Notification list */}
            <div className="space-y-3">
                {shown.length === 0 && (
                    <div className="glass-card p-10 text-center">
                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications here</p>
                    </div>
                )}
                {shown.map(n => {
                    const cfg = typeConfig[n.type];
                    const Icon = cfg.icon;
                    return (
                        <div key={n.id}
                            className="glass-card p-4 flex gap-4 cursor-default"
                            style={{
                                animationName: 'fade-in',
                                boxShadow: !n.read
                                    ? `var(--glass-shadow), 0 0 20px ${cfg.glow}`
                                    : 'var(--glass-shadow)',
                                opacity: n.read ? 0.75 : 1,
                            }}>
                            {/* Unread dot */}
                            <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                    <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                                </div>
                                {!n.read && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"
                                        style={{ background: cfg.color }} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{n.time}</span>
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                            </div>
                            <div className="flex flex-col justify-between items-end gap-1 flex-shrink-0">
                                {!n.read && (
                                    <button onClick={() => markOne(n.id)} title="Mark as read"
                                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                        <Check className="w-3 h-3" />
                                    </button>
                                )}
                                <button onClick={() => deleteOne(n.id)} title="Delete"
                                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
