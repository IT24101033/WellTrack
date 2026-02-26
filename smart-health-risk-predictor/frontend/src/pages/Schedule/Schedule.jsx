import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    PlusCircle, Clock, Dumbbell, Moon, BookOpen, Utensils, Coffee,
    Edit2, Trash2, X, Save, Bell, BellOff, CheckCircle2, Circle,
    ChevronLeft, ChevronRight, CalendarDays, LayoutList, Timer,
    Filter, AlertCircle, Loader2, Calendar
} from 'lucide-react';
import {
    fetchActivities, createActivity, updateActivity,
    deleteActivity, patchActivityStatus,
    fetchReminders, acknowledgeReminder,
} from '../../services/activityService';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = {
    Workout: { icon: Dumbbell, color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Workout' },
    Study: { icon: BookOpen, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Study' },
    Sleep: { icon: Moon, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Sleep' },
    Meal: { icon: Utensils, color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Meal' },
    Break: { icon: Coffee, color: '#ec4899', bg: 'rgba(236,72,153,0.12)', label: 'Break' },
};

const HOURS = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, '0')}:00`
);

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EMPTY_FORM = {
    title: '', description: '', category: 'Study',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00', endTime: '10:00',
    reminderEnabled: false, reminderTimeBefore: 15,
    status: 'Pending',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getWeekDates = (anchor) => {
    const d = new Date(anchor);
    const day = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
        const dd = new Date(sunday);
        dd.setDate(sunday.getDate() + i);
        return dd;
    });
};

const isSameDate = (a, b) =>
    new Date(a).toDateString() === new Date(b).toDateString();

const toLocalDateStr = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

// ── Toast System ──────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id}
                    className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl min-w-64 max-w-80 animate-slide-up"
                    style={{
                        background: t.type === 'error' ? 'rgba(239,68,68,0.92)' :
                            t.type === 'reminder' ? 'rgba(251,191,36,0.95)' :
                                'rgba(16,185,129,0.92)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        color: 'white',
                    }}>
                    {t.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                        t.type === 'reminder' ? <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{t.title}</p>
                        {t.message && <p className="text-xs opacity-90 mt-0.5">{t.message}</p>}
                    </div>
                    <button onClick={() => onDismiss(t.id)} className="p-0.5 rounded-lg hover:bg-white/20">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// ── Category Badge ────────────────────────────────────────────────────────────
function CategoryBadge({ category, small }) {
    const cfg = CATEGORIES[category];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
        <span className="inline-flex items-center gap-1 rounded-full font-medium"
            style={{
                background: cfg.bg, color: cfg.color,
                padding: small ? '2px 8px' : '3px 10px',
                fontSize: small ? '10px' : '11px',
            }}>
            <Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            {cfg.label}
        </span>
    );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, small }) {
    const completed = status === 'Completed';
    return (
        <span className="inline-flex items-center gap-1 rounded-full font-medium"
            style={{
                background: completed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                color: completed ? '#10b981' : '#f59e0b',
                padding: small ? '2px 8px' : '3px 10px',
                fontSize: small ? '10px' : '11px',
            }}>
            {completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {status}
        </span>
    );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function Skeleton({ className }) {
    return (
        <div className={`animate-pulse rounded-xl ${className}`}
            style={{ background: 'var(--glass-bg)' }} />
    );
}

// ── Activity Form Modal ───────────────────────────────────────────────────────
function ActivityModal({ initial, onSave, onClose, loading }) {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const [errors, setErrors] = useState({});

    const setF = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => ({ ...e, [k]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!form.date) errs.date = 'Date is required';
        if (!form.startTime) errs.startTime = 'Start time required';
        if (!form.endTime) errs.endTime = 'End time required';
        if (form.startTime && form.endTime && form.startTime >= form.endTime)
            errs.endTime = 'End time must be after start time';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) onSave(form);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.35)' }}
            onClick={onClose}>
            <div
                className="glass-card w-full max-w-lg p-6 space-y-4"
                style={{ animation: 'scale-in 0.2s ease-out both', maxHeight: '90vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {initial ? 'Edit Activity' : 'Add Activity'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:scale-105 transition-transform"
                        style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Grid */}
                <div className="space-y-3">
                    {/* Category */}
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Category *</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(CATEGORIES).map(cat => {
                                const cfg = CATEGORIES[cat];
                                const Icon = cfg.icon;
                                const selected = form.category === cat;
                                return (
                                    <button key={cat} type="button"
                                        onClick={() => setF('category', cat)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                                        style={{
                                            background: selected ? cfg.bg : 'var(--glass-bg)',
                                            color: selected ? cfg.color : 'var(--text-muted)',
                                            border: `1px solid ${selected ? cfg.color + '60' : 'var(--glass-border)'}`,
                                            boxShadow: selected ? `0 0 12px ${cfg.color}30` : 'none',
                                        }}>
                                        <Icon className="w-3 h-3" /> {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                        <input className="glass-input" placeholder="Activity title" value={form.title}
                            onChange={e => setF('title', e.target.value)} />
                        {errors.title && <p className="text-xs mt-1 text-red-400">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Description</label>
                        <textarea className="glass-input resize-none" rows={2}
                            placeholder="Optional description" value={form.description}
                            onChange={e => setF('description', e.target.value)} />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Date *</label>
                        <input type="date" className="glass-input" value={form.date}
                            onChange={e => setF('date', e.target.value)} />
                        {errors.date && <p className="text-xs mt-1 text-red-400">{errors.date}</p>}
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Start Time *</label>
                            <input type="time" className="glass-input" value={form.startTime}
                                onChange={e => setF('startTime', e.target.value)} />
                            {errors.startTime && <p className="text-xs mt-1 text-red-400">{errors.startTime}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>End Time *</label>
                            <input type="time" className="glass-input" value={form.endTime}
                                onChange={e => setF('endTime', e.target.value)} />
                            {errors.endTime && <p className="text-xs mt-1 text-red-400">{errors.endTime}</p>}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Status</label>
                        <div className="flex gap-2">
                            {['Pending', 'Completed'].map(s => (
                                <button key={s} type="button"
                                    onClick={() => setF('status', s)}
                                    className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all"
                                    style={{
                                        background: form.status === s
                                            ? (s === 'Completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)')
                                            : 'var(--glass-bg)',
                                        color: form.status === s
                                            ? (s === 'Completed' ? '#10b981' : '#f59e0b')
                                            : 'var(--text-muted)',
                                        border: `1px solid ${form.status === s
                                            ? (s === 'Completed' ? '#10b98140' : '#f59e0b40')
                                            : 'var(--glass-border)'}`,
                                    }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reminder Toggle */}
                    <div className="glass-sm p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {form.reminderEnabled ? <Bell className="w-4 h-4 text-amber-400" /> : <BellOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Reminder</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {form.reminderEnabled ? `${form.reminderTimeBefore} min before` : 'Off'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {form.reminderEnabled && (
                                <select className="glass-input py-1 text-xs w-24"
                                    value={form.reminderTimeBefore}
                                    onChange={e => setF('reminderTimeBefore', Number(e.target.value))}>
                                    {[5, 10, 15, 30, 60, 120].map(m => (
                                        <option key={m} value={m}>{m} min</option>
                                    ))}
                                </select>
                            )}
                            <button
                                type="button"
                                onClick={() => setF('reminderEnabled', !form.reminderEnabled)}
                                className="relative w-11 h-6 rounded-full transition-all duration-300"
                                style={{
                                    background: form.reminderEnabled ? 'rgba(251,191,36,0.7)' : 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                }}>
                                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
                                    style={{ left: form.reminderEnabled ? '22px' : '2px' }} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-1">
                    <button onClick={onClose} className="glass-btn-outline px-4 py-2 text-sm">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="glass-btn px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-60">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initial ? 'Update' : 'Add Activity'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Timeline View ─────────────────────────────────────────────────────────────
function TimelineView({ activities, onEdit, onDelete, onToggleStatus }) {
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center py-16 gap-3">
                <CalendarDays className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activities for this day</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click "Add Activity" to get started</p>
            </div>
        );
    }

    const sorted = [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
        <div className="relative mt-2">
            {/* Vertical line */}
            <div className="absolute left-[52px] top-3 bottom-3 w-px"
                style={{ background: 'linear-gradient(to bottom, var(--accent-blue), rgba(59,130,246,0.05))' }} />
            <div className="space-y-2">
                {sorted.map(item => {
                    const cfg = CATEGORIES[item.category] || CATEGORIES.Study;
                    const Icon = cfg.icon;
                    return (
                        <div key={item._id} className="flex gap-4 group">
                            {/* Time */}
                            <div className="w-12 flex-shrink-0 text-right pt-2">
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                    {fmt12(item.startTime)}
                                </span>
                            </div>
                            {/* Dot */}
                            <div className="flex-shrink-0 mt-2 relative z-10">
                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: cfg.bg, borderColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}50` }}>
                                    <Icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                                </div>
                            </div>
                            {/* Card */}
                            <div className="flex-1 mb-1">
                                <div className="glass-sm p-3 transition-all duration-200 hover:-translate-y-0.5"
                                    style={{
                                        borderLeft: `3px solid ${cfg.color}70`,
                                        opacity: item.status === 'Completed' ? 0.7 : 1,
                                    }}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className={`text-sm font-semibold ${item.status === 'Completed' ? 'line-through' : ''}`}
                                                    style={{ color: 'var(--text-primary)' }}>
                                                    {item.title}
                                                </p>
                                                <StatusBadge status={item.status} small />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="text-xs flex items-center gap-1"
                                                    style={{ color: 'var(--text-muted)' }}>
                                                    <Clock className="w-3 h-3" />
                                                    {fmt12(item.startTime)} – {fmt12(item.endTime)}
                                                </span>
                                                <CategoryBadge category={item.category} small />
                                                {item.reminderEnabled && (
                                                    <span className="text-xs flex items-center gap-1 text-amber-400">
                                                        <Bell className="w-3 h-3" />{item.reminderTimeBefore}m
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        {/* Action buttons */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button onClick={() => onToggleStatus(item)}
                                                className="p-1.5 rounded-lg transition-all"
                                                title={item.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                                                style={{ background: item.status === 'Completed' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: item.status === 'Completed' ? '#f59e0b' : '#10b981' }}>
                                                {item.status === 'Completed' ? <Circle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                            </button>
                                            <button onClick={() => onEdit(item)}
                                                className="p-1.5 rounded-lg transition-all"
                                                style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => onDelete(item._id)}
                                                className="p-1.5 rounded-lg transition-all"
                                                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Weekly View ───────────────────────────────────────────────────────────────
function WeeklyView({ activities, weekDates, onEdit }) {
    const today = new Date();
    return (
        <div className="overflow-x-auto">
            <div className="grid gap-1.5 min-w-[600px]" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {weekDates.map((date, di) => {
                    const isToday = isSameDate(date, today);
                    const dayActivities = activities.filter(a => isSameDate(new Date(a.date), date));
                    return (
                        <div key={di} className="glass-sm p-2 min-h-32"
                            style={{ borderTop: isToday ? '2px solid var(--accent-blue)' : '2px solid transparent' }}>
                            <div className="text-center mb-2">
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{DAYS_SHORT[di]}</p>
                                <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${isToday ? 'bg-blue-500 text-white' : ''}`}
                                    style={{ color: isToday ? undefined : 'var(--text-primary)' }}>
                                    {date.getDate()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                {dayActivities.map(a => {
                                    const cfg = CATEGORIES[a.category] || CATEGORIES.Study;
                                    return (
                                        <button key={a._id} onClick={() => onEdit(a)}
                                            className="w-full text-left px-1.5 py-1 rounded-lg text-xs font-medium truncate transition-opacity hover:opacity-80"
                                            style={{ background: cfg.bg, color: cfg.color }}>
                                            {fmt12(a.startTime)} {a.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── All Activities Card List ───────────────────────────────────────────────────
function AllActivitiesView({ activities, onEdit, onDelete, onToggleStatus }) {
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center py-16 gap-3">
                <LayoutList className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activities match your filters</p>
            </div>
        );
    }
    const sorted = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date) || a.startTime.localeCompare(b.startTime));

    return (
        <div className="space-y-2">
            {sorted.map(item => {
                const cfg = CATEGORIES[item.category] || CATEGORIES.Study;
                const Icon = cfg.icon;
                return (
                    <div key={item._id} className="glass-sm p-4 group transition-all hover:-translate-y-0.5"
                        style={{ borderLeft: `3px solid ${cfg.color}70` }}>
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: cfg.bg }}>
                                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-sm font-semibold ${item.status === 'Completed' ? 'line-through opacity-70' : ''}`}
                                        style={{ color: 'var(--text-primary)' }}>
                                        {item.title}
                                    </p>
                                    <CategoryBadge category={item.category} small />
                                    <StatusBadge status={item.status} small />
                                    {item.reminderEnabled && (
                                        <span className="text-xs flex items-center gap-1 text-amber-400">
                                            <Bell className="w-3 h-3" />{item.reminderTimeBefore}m
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs flex-wrap"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {fmt12(item.startTime)} – {fmt12(item.endTime)}
                                    </span>
                                </div>
                                {item.description && (
                                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                                        {item.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => onToggleStatus(item)}
                                    className="p-2 rounded-xl transition-all"
                                    title={item.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                                    style={{ background: item.status === 'Completed' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: item.status === 'Completed' ? '#f59e0b' : '#10b981' }}>
                                    {item.status === 'Completed' ? <Circle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => onEdit(item)}
                                    className="p-2 rounded-xl transition-all"
                                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(item._id)}
                                    className="p-2 rounded-xl transition-all"
                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Schedule Page ────────────────────────────────────────────────────────
export default function Schedule() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('timeline'); // timeline | weekly | all
    const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
    const [weekAnchor, setWeekAnchor] = useState(new Date());
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toasts, setToasts] = useState([]);
    const acknowledgedReminders = useRef(new Set());

    // ── Toast helpers ──────────────────────────────────────────────────────────
    const addToast = useCallback((title, message = '', type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }, []);

    const dismissToast = useCallback(id => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // ── Load Activities ────────────────────────────────────────────────────────
    const loadActivities = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (tab === 'timeline') params.date = selectedDate;
            if (tab === 'weekly') {
                const week = getWeekDates(weekAnchor);
                params.weekStart = toLocalDateStr(week[0]);
            }
            if (filterCategory) params.category = filterCategory;
            if (filterStatus) params.status = filterStatus;

            const res = await fetchActivities(params);
            setActivities(res.data?.data || []);
        } catch {
            addToast('Failed to load activities', 'Check your connection and try again', 'error');
        } finally {
            setLoading(false);
        }
    }, [tab, selectedDate, weekAnchor, filterCategory, filterStatus, addToast]);

    useEffect(() => { loadActivities(); }, [loadActivities]);

    // ── Reminder Poller (every 60s) ────────────────────────────────────────────
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetchReminders();
                const reminders = res.data?.data || [];
                const now = new Date();
                for (const r of reminders) {
                    if (!acknowledgedReminders.current.has(r._id) && new Date(r.triggerTime) <= now) {
                        addToast(
                            `⏰ ${r.activityTitle || 'Activity'} starting soon!`,
                            `${r.activityCategory || ''} reminder`,
                            'reminder'
                        );
                        acknowledgedReminders.current.add(r._id);
                        acknowledgeReminder(r._id).catch(() => { });
                    }
                }
            } catch { /* silent */ }
        };
        poll();
        const interval = setInterval(poll, 60000);
        return () => clearInterval(interval);
    }, [addToast]);

    // ── CRUD handlers ──────────────────────────────────────────────────────────
    const handleSave = async (form) => {
        try {
            setSaving(true);
            if (editItem) {
                await updateActivity(editItem._id, form);
                addToast('Activity updated!');
            } else {
                await createActivity(form);
                addToast('Activity added!', form.title);
            }
            setShowModal(false);
            setEditItem(null);
            loadActivities();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save activity';
            addToast('Error', msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this activity?')) return;
        try {
            await deleteActivity(id);
            setActivities(prev => prev.filter(a => a._id !== id));
            addToast('Activity deleted');
        } catch {
            addToast('Error', 'Failed to delete activity', 'error');
        }
    };

    const handleToggleStatus = async (item) => {
        const newStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await patchActivityStatus(item._id, newStatus);
            setActivities(prev => prev.map(a =>
                a._id === item._id ? { ...a, status: newStatus } : a
            ));
            addToast(newStatus === 'Completed' ? '✓ Marked completed!' : 'Marked as pending');
        } catch {
            addToast('Error', 'Failed to update status', 'error');
        }
    };

    const openAdd = () => { setEditItem(null); setShowModal(true); };
    const openEdit = (item) => {
        setEditItem({
            ...item,
            date: toLocalDateStr(item.date),
        });
        setShowModal(true);
    };

    // ── Computed stats ─────────────────────────────────────────────────────────
    const todayActivities = activities.filter(a => isSameDate(new Date(a.date), new Date()));
    const completedCount = activities.filter(a => a.status === 'Completed').length;
    const pendingCount = activities.filter(a => a.status === 'Pending').length;

    const weekDates = getWeekDates(weekAnchor);

    // ── Date navigation ────────────────────────────────────────────────────────
    const prevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(toLocalDateStr(d));
    };
    const nextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(toLocalDateStr(d));
    };

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Schedule
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={openAdd} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm">
                        <PlusCircle className="w-4 h-4" /> Add Activity
                    </button>
                </div>

                {/* ── Stats Strip ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Today's Total", value: todayActivities.length, color: '#3b82f6', icon: CalendarDays },
                        { label: 'Completed', value: completedCount, color: '#10b981', icon: CheckCircle2 },
                        { label: 'Pending', value: pendingCount, color: '#f59e0b', icon: Timer },
                        { label: 'With Reminders', value: activities.filter(a => a.reminderEnabled).length, color: '#ec4899', icon: Bell },
                    ].map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="glass-sm p-4 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${s.color}18` }}>
                                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Today's Progress Bar ────────────────────────────────── */}
                {todayActivities.length > 0 && (() => {
                    const todayCompleted = todayActivities.filter(a => a.status === 'Completed').length;
                    const pct = Math.round((todayCompleted / todayActivities.length) * 100);
                    return (
                        <div className="glass-sm p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        Today's Progress
                                    </span>
                                </div>
                                <span className="text-xs font-bold" style={{
                                    color: pct === 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b'
                                }}>
                                    {pct}% — {todayCompleted}/{todayActivities.length} done
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                                <div className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${pct}%`,
                                        background: pct === 100
                                            ? 'linear-gradient(90deg, #10b981, #059669)'
                                            : pct >= 50
                                                ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                                                : 'linear-gradient(90deg, #f59e0b, #f97316)',
                                        boxShadow: pct === 100
                                            ? '0 0 10px rgba(16,185,129,0.5)'
                                            : pct >= 50
                                                ? '0 0 10px rgba(59,130,246,0.4)'
                                                : '0 0 8px rgba(245,158,11,0.3)',
                                    }} />
                            </div>
                        </div>
                    );
                })()}

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <div className="glass-sm p-1 flex gap-1">
                    {[
                        { id: 'timeline', label: 'Timeline', icon: Timer },
                        { id: 'weekly', label: 'Weekly', icon: CalendarDays },
                        { id: 'all', label: 'All Activities', icon: LayoutList },
                    ].map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={{
                                    background: tab === t.id ? 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(37,99,235,0.9))' : 'transparent',
                                    color: tab === t.id ? 'white' : 'var(--text-muted)',
                                    boxShadow: tab === t.id ? '0 4px 14px rgba(59,130,246,0.3)' : 'none',
                                }}>
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Filters ─────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />

                    {/* Category pills */}
                    <button onClick={() => setFilterCategory('')}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                            background: !filterCategory ? 'rgba(59,130,246,0.15)' : 'var(--glass-bg)',
                            color: !filterCategory ? '#3b82f6' : 'var(--text-muted)',
                            border: `1px solid ${!filterCategory ? 'rgba(59,130,246,0.4)' : 'var(--glass-border)'}`,
                        }}>All</button>
                    {Object.keys(CATEGORIES).map(cat => {
                        const cfg = CATEGORIES[cat];
                        const Icon = cfg.icon;
                        const active = filterCategory === cat;
                        return (
                            <button key={cat}
                                onClick={() => setFilterCategory(active ? '' : cat)}
                                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all"
                                style={{
                                    background: active ? cfg.bg : 'var(--glass-bg)',
                                    color: active ? cfg.color : 'var(--text-muted)',
                                    border: `1px solid ${active ? cfg.color + '60' : 'var(--glass-border)'}`,
                                }}>
                                <Icon className="w-2.5 h-2.5" />{cfg.label}
                            </button>
                        );
                    })}

                    {/* Status filter */}
                    <div className="ml-auto flex gap-1.5">
                        {['', 'Pending', 'Completed'].map(s => (
                            <button key={s || 'All'} onClick={() => setFilterStatus(s)}
                                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                                style={{
                                    background: filterStatus === s ?
                                        (s === 'Completed' ? 'rgba(16,185,129,0.15)' : s === 'Pending' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)') :
                                        'var(--glass-bg)',
                                    color: filterStatus === s ?
                                        (s === 'Completed' ? '#10b981' : s === 'Pending' ? '#f59e0b' : '#3b82f6') :
                                        'var(--text-muted)',
                                    border: `1px solid ${filterStatus === s ?
                                        (s === 'Completed' ? '#10b98140' : s === 'Pending' ? '#f59e0b40' : 'rgba(59,130,246,0.4)') :
                                        'var(--glass-border)'}`,
                                }}>
                                {s || 'All Status'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Date Nav (Timeline tab only) ───────────────────────── */}
                {tab === 'timeline' && (
                    <div className="flex items-center gap-3">
                        <button onClick={prevDay}
                            className="glass-btn-outline p-2 rounded-xl"
                            style={{ padding: '8px' }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <input type="date" className="glass-input text-sm flex-1 max-w-xs"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)} />
                        <button onClick={nextDay}
                            className="glass-btn-outline rounded-xl"
                            style={{ padding: '8px' }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSelectedDate(toLocalDateStr(new Date()))}
                            className="glass-btn-outline px-3 py-2 text-xs rounded-xl">
                            Today
                        </button>
                    </div>
                )}

                {/* ── Week Nav (Weekly tab only) ─────────────────────────── */}
                {tab === 'weekly' && (
                    <div className="flex items-center justify-between">
                        <button onClick={() => {
                            const d = new Date(weekAnchor);
                            d.setDate(d.getDate() - 7);
                            setWeekAnchor(d);
                        }} className="glass-btn-outline p-2 rounded-xl" style={{ padding: '8px' }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <button onClick={() => {
                            const d = new Date(weekAnchor);
                            d.setDate(d.getDate() + 7);
                            setWeekAnchor(d);
                        }} className="glass-btn-outline rounded-xl" style={{ padding: '8px' }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── Content Panel ───────────────────────────────────────── */}
                <div className="glass-card p-5">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    <Skeleton className="w-12 h-4" />
                                    <Skeleton className="w-5 h-5 rounded-full" />
                                    <Skeleton className="flex-1 h-14 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {tab === 'timeline' && (
                                <TimelineView activities={activities}
                                    onEdit={openEdit} onDelete={handleDelete}
                                    onToggleStatus={handleToggleStatus} />
                            )}
                            {tab === 'weekly' && (
                                <WeeklyView activities={activities}
                                    weekDates={weekDates} onEdit={openEdit} />
                            )}
                            {tab === 'all' && (
                                <AllActivitiesView activities={activities}
                                    onEdit={openEdit} onDelete={handleDelete}
                                    onToggleStatus={handleToggleStatus} />
                            )}
                        </>
                    )}
                </div>

                {/* ── Category Legend ─────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(CATEGORIES).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                            <div key={key} className="glass-sm flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                                style={{ color: cfg.color }}>
                                <Icon className="w-3.5 h-3.5" /> {cfg.label}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Activity Modal ───────────────────────────────────────────── */}
            {showModal && (
                <ActivityModal
                    initial={editItem}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                    loading={saving}
                />
            )}

            {/* ── Toast Container ──────────────────────────────────────────── */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
    );
}
