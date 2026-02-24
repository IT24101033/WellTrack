import React, { useState } from 'react';
import { PlusCircle, Clock, Dumbbell, Moon, BookOpen, Coffee, Utensils, Edit2, Trash2, X, Save } from 'lucide-react';

const TYPE_CONFIG = {
    sleep: { icon: Moon, color: '#6366f1', label: 'Sleep' },
    study: { icon: BookOpen, color: '#3b82f6', label: 'Study' },
    exercise: { icon: Dumbbell, color: '#10b981', label: 'Exercise' },
    meal: { icon: Utensils, color: '#f97316', label: 'Meal' },
    break: { icon: Coffee, color: '#8b5cf6', label: 'Break' },
};

const DEFAULT_ITEMS = [
    { id: 1, type: 'sleep', time: '06:30', title: 'Morning Wake-up', duration: '8h sleep', note: 'Slept well – 7h 30m' },
    { id: 2, type: 'meal', time: '07:15', title: 'Breakfast', duration: '20 min', note: 'Oats + banana + coffee' },
    { id: 3, type: 'exercise', time: '08:00', title: 'Morning Walk', duration: '30 min', note: '4,200 steps' },
    { id: 4, type: 'study', time: '09:00', title: 'AI/ML Lectures', duration: '3 hours', note: 'Chapter 5–7 completed' },
    { id: 5, type: 'meal', time: '12:30', title: 'Lunch', duration: '45 min', note: '' },
    { id: 6, type: 'study', time: '13:30', title: 'Project Work', duration: '2.5 hours', note: 'Frontend redesign' },
    { id: 7, type: 'break', time: '16:00', title: 'Screen Break', duration: '15 min', note: 'Box breathing + stretch' },
    { id: 8, type: 'exercise', time: '17:00', title: 'Gym Session', duration: '45 min', note: 'Chest + triceps' },
    { id: 9, type: 'meal', time: '19:00', title: 'Dinner', duration: '30 min', note: '' },
    { id: 10, type: 'study', time: '20:00', title: 'Evening Review', duration: '1 hour', note: 'Tomorrow\'s prep' },
    { id: 11, type: 'sleep', time: '22:00', title: 'Wind-down & Sleep', duration: '', note: 'No screens after 9pm' },
];

const TYPES_ARRAY = Object.entries(TYPE_CONFIG).map(([k, v]) => ({ id: k, ...v }));
const EMPTY_FORM = { type: 'study', time: '', title: '', duration: '', note: '' };

export default function Schedule() {
    const [items, setItems] = useState(DEFAULT_ITEMS);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowAdd(true); };
    const openEdit = (item) => {
        setForm({ type: item.type, time: item.time, title: item.title, duration: item.duration, note: item.note });
        setEditId(item.id); setShowAdd(true);
    };
    const handleDelete = id => setItems(prev => prev.filter(i => i.id !== id));
    const handleSave = () => {
        if (!form.title || !form.time) return;
        if (editId) {
            setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form } : i));
        } else {
            setItems(prev => [...prev, { id: Date.now(), ...form }]);
        }
        setShowAdd(false); setForm(EMPTY_FORM); setEditId(null);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Daily Schedule</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button onClick={openAdd} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm">
                    <PlusCircle className="w-4 h-4" /> Add Activity
                </button>
            </div>

            {/* Legend pills */}
            <div className="flex flex-wrap gap-2">
                {TYPES_ARRAY.map(t => {
                    const Icon = t.icon;
                    return (
                        <div key={t.id} className="glass-sm flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                            style={{ color: t.color }}>
                            <Icon className="w-3.5 h-3.5" /> {t.label}
                        </div>
                    );
                })}
            </div>

            {/* Timeline */}
            <div className="glass-card p-5">
                <div className="relative">
                    {/* vertical gradient line */}
                    <div className="absolute left-11 top-5 bottom-5 w-px"
                        style={{ background: 'linear-gradient(to bottom, var(--accent-blue), rgba(59,130,246,0.05))' }} />
                    <div className="space-y-3">
                        {sorted.map((item) => {
                            const cfg = TYPE_CONFIG[item.type];
                            const Icon = cfg.icon;
                            return (
                                <div key={item.id} className="flex gap-4 group relative">
                                    {/* Time label */}
                                    <div className="w-10 flex-shrink-0 text-right">
                                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                                    </div>
                                    {/* Dot */}
                                    <div className="flex-shrink-0 mt-1 relative z-10">
                                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                            style={{ backgroundColor: `${cfg.color}20`, borderColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}40` }}>
                                            <Icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                                        </div>
                                    </div>
                                    {/* Content bubble */}
                                    <div className="flex-1 glass-sm p-3 transition-all duration-200 hover:-translate-y-0.5"
                                        style={{ borderLeft: `2px solid ${cfg.color}50` }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                                                {item.duration && (
                                                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                        <Clock className="w-3 h-3" /> {item.duration}
                                                    </p>
                                                )}
                                                {item.note && (
                                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{item.note}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => openEdit(item)}
                                                    className="p-1.5 rounded-lg transition-all"
                                                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 rounded-lg transition-all"
                                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.3)' }}
                    onClick={() => setShowAdd(false)}>
                    <div className="glass-card w-full max-w-md p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{editId ? 'Edit Activity' : 'Add Activity'}</h2>
                            <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-xl" style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)' }}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Activity Type</label>
                                <select className="glass-input" value={form.type} onChange={e => setF('type', e.target.value)}>
                                    {TYPES_ARRAY.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Time</label>
                                    <input type="time" className="glass-input" value={form.time} onChange={e => setF('time', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Duration</label>
                                    <input placeholder="e.g. 30 min" className="glass-input" value={form.duration} onChange={e => setF('duration', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                                <input placeholder="Activity title" className="glass-input" value={form.title} onChange={e => setF('title', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Note</label>
                                <input placeholder="Optional note" className="glass-input" value={form.note} onChange={e => setF('note', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-1">
                            <button onClick={() => setShowAdd(false)} className="glass-btn-outline px-4 py-2 text-sm">Cancel</button>
                            <button onClick={handleSave} disabled={!form.title || !form.time}
                                className="glass-btn px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
                                <Save className="w-4 h-4" /> {editId ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
