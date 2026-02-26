import React, { useState, useCallback, useEffect } from 'react';
import {
    User, Moon, Activity, Brain, Smartphone, Heart,
    ChevronRight, ChevronLeft, Save, RotateCcw, Zap,
    Droplets, Flame, Wind, AlertCircle, CheckCircle2,
    Loader2, Info, TrendingUp, Shield, Coffee, Utensils,
    Clock, Eye, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createHealthEntry, fetchHealthEntries, updateHealthEntry } from '../../services/healthService';

// ─── Constants ─────────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 1, label: 'Physiological', icon: Heart },
    { id: 2, label: 'Lifestyle', icon: Utensils },
    { id: 3, label: 'Activity', icon: Activity },
    { id: 4, label: 'Psychological', icon: Brain },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const INITIAL_FORM = {
    date: todayStr(),
    // Physiological
    height: '', weight: '',
    restingHeartRate: '', sleepHours: 7, sleepQuality: 7,
    // Lifestyle
    waterIntake: '', junkFoodFrequency: 'Never', caffeineIntake: 0,
    mealRegularity: 'Regular',
    // Activity
    stepsPerDay: '', exerciseMinutes: '', sedentaryHours: '',
    screenTimeHours: '', lateNightScreen: false,
    // Psychological
    stressScore: 5, moodScore: 7,
    socialInteractionLevel: 'Medium', weekendSleepShift: 0,
};

const calcBMI = (h, w) => (!h || !w || h <= 0) ? null : (w / ((h / 100) ** 2)).toFixed(1);
const bmiInfo = (bmi) => {
    if (!bmi) return { label: '—', color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.1)' };
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: 'Underweight', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (b < 25) return { label: 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (b < 30) return { label: 'Overweight', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Obese', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
};
const stressColor = v => v <= 3 ? '#10b981' : v <= 6 ? '#f59e0b' : '#ef4444';
const stressLabel = v => v <= 3 ? 'Low' : v <= 6 ? 'Moderate' : 'High';
const moodColor = v => v >= 7 ? '#10b981' : v >= 4 ? '#f59e0b' : '#ef4444';
const moodLabel = v => v >= 7 ? 'Good' : v >= 4 ? 'Neutral' : 'Low';

// ─── Reusable Input Components ─────────────────────────────────────────────────
const GInput = ({ className = '', ...props }) => (
    <input className={`glass-input ${className}`} {...props} />
);
const GSelect = ({ children, ...props }) => (
    <select className="glass-input" {...props}>{children}</select>
);
const GSlider = ({ value, onChange, min, max, step = 1, color = '#3b82f6' }) => {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <input type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full"
            style={{ background: `linear-gradient(to right, ${color} ${pct}%, rgba(148,163,184,0.25) ${pct}%)` }} />
    );
};
const GToggle = ({ checked, onChange, onColor = '#3b82f6' }) => (
    <button type="button" onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 flex-shrink-0"
        style={{ background: checked ? onColor : 'rgba(148,163,184,0.3)' }}>
        <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300"
            style={{ transform: checked ? 'translateX(24px)' : 'translateX(4px)' }} />
    </button>
);
const FieldLabel = ({ icon: Icon, label, color = '#3b82f6', tooltip }) => (
    <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {tooltip && (
            <span className="group relative cursor-help">
                <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <span className="absolute left-5 -top-1 z-50 hidden group-hover:block w-52 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-normal"
                    style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)' }}>{tooltip}</span>
            </span>
        )}
    </div>
);
function SectionCard({ title, icon: Icon, color, children }) {
    return (
        <div className="glass-card p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}20`, border: `1px solid ${color}25` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HealthInput() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState(INITIAL_FORM);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});
    const [existingId, setExistingId] = useState(null); // for update mode
    const [toast, setToast] = useState(null); // { type: 'success'|'error'|'alert', msg }
    const [loadingToday, setLoadingToday] = useState(true);

    const bmi = calcBMI(form.height, form.weight);
    const bmiMeta = bmiInfo(bmi);
    const riskAlert = Number(form.stressScore) > 8 && Number(form.sleepHours) < 5;

    // Load today's existing record (update mode)
    useEffect(() => {
        const loadToday = async () => {
            try {
                const res = await fetchHealthEntries({ from: todayStr(), to: todayStr(), limit: 1 });
                if (res.data?.entries?.length > 0) {
                    const rec = res.data.entries[0];
                    setExistingId(rec._id);
                    // Flatten nested data back into form
                    setForm(f => ({
                        ...f,
                        date: rec.date,
                        ...rec.physiological,
                        ...rec.lifestyle,
                        ...rec.activity,
                        ...rec.psychological,
                    }));
                }
            } catch { /* ignore — first entry */ }
            setLoadingToday(false);
        };
        loadToday();
    }, []);

    const set = useCallback((field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }, []);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const validate = () => {
        const e = {};
        if (step === 1) {
            if (!form.height || form.height < 100 || form.height > 250) e.height = 'Height in cm (100–250)';
            if (!form.weight || form.weight < 20 || form.weight > 300) e.weight = 'Weight in kg (20–300)';
            if (form.restingHeartRate && (form.restingHeartRate < 40 || form.restingHeartRate > 180)) e.restingHeartRate = 'Heart rate 40–180 bpm';
            if (form.sleepHours < 0 || form.sleepHours > 24) e.sleepHours = 'Sleep 0–24 hours';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => { if (validate()) setStep(s => Math.min(s + 1, 4)); };
    const handleBack = () => setStep(s => Math.max(s - 1, 1));
    const handleReset = () => { setForm({ ...INITIAL_FORM, date: todayStr() }); setStep(1); setErrors({}); setExistingId(null); };

    const buildPayload = () => ({
        date: form.date,
        physiological: {
            height: Number(form.height) || null,
            weight: Number(form.weight) || null,
            restingHeartRate: Number(form.restingHeartRate) || null,
            sleepHours: Number(form.sleepHours),
            sleepQuality: Number(form.sleepQuality),
        },
        lifestyle: {
            waterIntake: Number(form.waterIntake) || null,
            junkFoodFrequency: form.junkFoodFrequency,
            caffeineIntake: Number(form.caffeineIntake),
            mealRegularity: form.mealRegularity,
        },
        activity: {
            stepsPerDay: Number(form.stepsPerDay) || null,
            exerciseMinutes: Number(form.exerciseMinutes) || null,
            sedentaryHours: Number(form.sedentaryHours) || null,
            screenTimeHours: Number(form.screenTimeHours) || null,
            lateNightScreen: Boolean(form.lateNightScreen),
        },
        psychological: {
            stressScore: Number(form.stressScore),
            moodScore: Number(form.moodScore),
            socialInteractionLevel: form.socialInteractionLevel,
            weekendSleepShift: Number(form.weekendSleepShift),
        },
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = buildPayload();
            if (existingId) {
                await updateHealthEntry(existingId, payload);
                showToast('success', '✅ Health record updated!');
            } else {
                const res = await createHealthEntry(payload);
                setExistingId(res.data.entry._id);
                showToast('success', '✅ Health data saved!');
            }
            setSaved(true);
            if (riskAlert) showToast('alert', '⚠️ High stress + low sleep detected! Please rest.');
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save. Please try again.';
            showToast('error', '❌ ' + msg);
        }
        setSaving(false);
    };

    const renderSection = () => {
        switch (step) {
            // ── Section 1: Physiological ───────────────────────────────────
            case 1: return (
                <SectionCard title="🫀 Physiological Features" icon={Heart} color="#ef4444">
                    {/* BMI live badge */}
                    <div className="mb-5 p-4 rounded-2xl flex items-center justify-between"
                        style={{ background: bmiMeta.bg, border: `1px solid ${bmiMeta.color}20` }}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Live BMI</p>
                            <p className="text-3xl font-bold mt-0.5" style={{ color: bmiMeta.color }}>{bmi ?? '—'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold" style={{ color: bmiMeta.color }}>{bmiMeta.label}</span>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>weight / height²</p>
                        </div>
                        <Shield className="w-10 h-10 ml-4 opacity-20" style={{ color: bmiMeta.color }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel icon={TrendingUp} label="Height (cm)" tooltip="Your height in centimetres" />
                            <GInput type="number" placeholder="175" min="100" max="250"
                                value={form.height} onChange={e => set('height', e.target.value)} />
                            {errors.height && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.height}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={TrendingUp} label="Weight (kg)" tooltip="Your weight in kilograms" />
                            <GInput type="number" placeholder="70" min="20" max="300"
                                value={form.weight} onChange={e => set('weight', e.target.value)} />
                            {errors.weight && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.weight}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={Heart} label="Resting Heart Rate (bpm)" tooltip="Measure after waking, before getting up. Normal: 60–100" color="#ef4444" />
                            <GInput type="number" placeholder="72" min="40" max="180"
                                value={form.restingHeartRate} onChange={e => set('restingHeartRate', e.target.value)} />
                            {errors.restingHeartRate && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.restingHeartRate}</p>}
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Moon} label="Sleep Hours" color="#6366f1" tooltip="Total sleep last night" />
                                <span className="text-xl font-bold" style={{ color: '#6366f1' }}>{form.sleepHours}h</span>
                            </div>
                            <GSlider value={Number(form.sleepHours)} onChange={v => set('sleepHours', v)} min={0} max={14} step={0.5} color="#6366f1" />
                            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                <span>0h</span><span>Ideal: 7–9h</span><span>14h</span>
                            </div>
                            {errors.sleepHours && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.sleepHours}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Moon} label="Sleep Quality" color="#6366f1" tooltip="1 = Terrible, 10 = Excellent" />
                                <span className="text-xl font-bold" style={{ color: form.sleepQuality >= 7 ? '#10b981' : form.sleepQuality >= 4 ? '#f59e0b' : '#ef4444' }}>
                                    {form.sleepQuality}/10
                                </span>
                            </div>
                            <GSlider value={Number(form.sleepQuality)} onChange={v => set('sleepQuality', v)} min={1} max={10} color="#6366f1" />
                        </div>
                    </div>
                </SectionCard>
            );

            // ── Section 2: Lifestyle & Nutrition ──────────────────────────
            case 2: return (
                <SectionCard title="🥗 Lifestyle & Nutrition" icon={Utensils} color="#10b981">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel icon={Droplets} label="Water Intake (liters/day)" color="#3b82f6" tooltip="Recommended: 2–3 L/day" />
                            <GInput type="number" placeholder="2.0" min="0" max="10" step="0.1"
                                value={form.waterIntake} onChange={e => set('waterIntake', e.target.value)} />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Recommended: 2–3 L/day</p>
                        </div>
                        <div>
                            <FieldLabel icon={Coffee} label="Caffeine Intake (cups/day)" color="#92400e" tooltip="Coffee, tea, energy drinks" />
                            <div className="flex items-center gap-4">
                                <GSlider value={Number(form.caffeineIntake)} onChange={v => set('caffeineIntake', v)} min={0} max={10} color="#92400e" />
                                <span className="text-lg font-bold w-8 text-center" style={{ color: '#92400e' }}>{form.caffeineIntake}</span>
                            </div>
                        </div>
                        <div>
                            <FieldLabel icon={Flame} label="Junk Food Frequency" color="#f97316" tooltip="How often do you eat junk food?" />
                            <GSelect value={form.junkFoodFrequency} onChange={e => set('junkFoodFrequency', e.target.value)}>
                                <option value="Never">Never</option>
                                <option value="Weekly">Weekly (1–2 times)</option>
                                <option value="2-3 times">2–3 times a week</option>
                                <option value="Daily">Daily</option>
                            </GSelect>
                        </div>
                        <div>
                            <FieldLabel icon={Utensils} label="Meal Regularity" color="#10b981" tooltip="Do you eat at regular times?" />
                            <div className="flex items-center justify-between p-4 rounded-2xl"
                                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {form.mealRegularity === 'Regular' ? '✅ Regular meals' : '⚠️ Irregular meals'}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {form.mealRegularity === 'Regular' ? 'Eating at consistent times' : 'Skipping or eating at random times'}
                                    </p>
                                </div>
                                <GToggle checked={form.mealRegularity === 'Regular'} onColor="#10b981"
                                    onChange={v => set('mealRegularity', v ? 'Regular' : 'Irregular')} />
                            </div>
                        </div>
                    </div>
                </SectionCard>
            );

            // ── Section 3: Activity & Behavioral ─────────────────────────
            case 3: return (
                <SectionCard title="🏃 Activity & Behavior" icon={Activity} color="#f97316">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel icon={Zap} label="Steps Per Day" color="#f97316" tooltip="Total steps tracked. Goal: 10,000" />
                            <GInput type="number" placeholder="8000" min="0" max="100000"
                                value={form.stepsPerDay} onChange={e => set('stepsPerDay', e.target.value)} />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Goal: 10,000 steps/day</p>
                        </div>
                        <div>
                            <FieldLabel icon={Activity} label="Exercise Minutes" color="#f97316" tooltip="Total active exercise time today" />
                            <GInput type="number" placeholder="30" min="0" max="480"
                                value={form.exerciseMinutes} onChange={e => set('exerciseMinutes', e.target.value)} />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>WHO recommends 30 min/day</p>
                        </div>
                        <div>
                            <FieldLabel icon={Clock} label="Sedentary Hours" color="#94a3b8" tooltip="Hours sitting/lying down (excluding sleep)" />
                            <GInput type="number" placeholder="6" min="0" max="18"
                                value={form.sedentaryHours} onChange={e => set('sedentaryHours', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel icon={Smartphone} label="Screen Time (hours)" color="#3b82f6" tooltip="Total hours on phone, PC, TV" />
                            <GInput type="number" placeholder="4" min="0" max="24"
                                value={form.screenTimeHours} onChange={e => set('screenTimeHours', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between p-4 rounded-2xl transition-all"
                                style={{
                                    background: form.lateNightScreen ? 'rgba(239,68,68,0.08)' : 'var(--glass-bg)',
                                    border: `1px solid ${form.lateNightScreen ? 'rgba(239,68,68,0.25)' : 'var(--glass-border)'}`,
                                }}>
                                <div>
                                    <FieldLabel icon={Eye} label="Late Night Screen Usage (after 10PM)" color="#ef4444" />
                                    <p className="text-xs -mt-1" style={{ color: 'var(--text-muted)' }}>
                                        {form.lateNightScreen ? '🌙 Disrupts melatonin production' : '✅ Good screen hygiene'}
                                    </p>
                                </div>
                                <GToggle checked={Boolean(form.lateNightScreen)} onColor="#ef4444"
                                    onChange={v => set('lateNightScreen', v)} />
                            </div>
                        </div>
                    </div>
                </SectionCard>
            );

            // ── Section 4: Psychological & Social ─────────────────────────
            case 4: return (
                <SectionCard title="🧠 Psychological & Social" icon={Brain} color="#8b5cf6">
                    <div className="space-y-6">
                        {/* Stress Score */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Stress Score (1–10)" color="#ef4444" tooltip="1 = No stress, 10 = Extremely stressed" />
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold" style={{ color: stressColor(form.stressScore) }}>{form.stressScore}</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: `${stressColor(form.stressScore)}18`, color: stressColor(form.stressScore) }}>
                                        {stressLabel(form.stressScore)}
                                    </span>
                                </div>
                            </div>
                            <GSlider value={Number(form.stressScore)} onChange={v => set('stressScore', v)} min={1} max={10} color={stressColor(form.stressScore)} />
                            <div className="flex justify-between text-xs mt-1">
                                <span style={{ color: '#10b981' }}>1 – None</span>
                                <span style={{ color: '#f59e0b' }}>5 – Moderate</span>
                                <span style={{ color: '#ef4444' }}>10 – Severe</span>
                            </div>
                        </div>
                        {/* Mood Score */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Mood Score (1–10)" color="#8b5cf6" tooltip="1 = Very low, 10 = Excellent" />
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold" style={{ color: moodColor(form.moodScore) }}>{form.moodScore}</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: `${moodColor(form.moodScore)}18`, color: moodColor(form.moodScore) }}>
                                        {moodLabel(form.moodScore)}
                                    </span>
                                </div>
                            </div>
                            <GSlider value={Number(form.moodScore)} onChange={v => set('moodScore', v)} min={1} max={10} color={moodColor(form.moodScore)} />
                        </div>
                        {/* Social Interaction */}
                        <div>
                            <FieldLabel icon={User} label="Social Interaction Level" color="#8b5cf6" tooltip="How much did you interact today?" />
                            <div className="grid grid-cols-3 gap-3">
                                {['Low', 'Medium', 'High'].map(level => (
                                    <button key={level} onClick={() => set('socialInteractionLevel', level)}
                                        className="py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
                                        style={{
                                            background: form.socialInteractionLevel === level
                                                ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)'
                                                : 'var(--glass-bg)',
                                            color: form.socialInteractionLevel === level ? 'white' : 'var(--text-secondary)',
                                            border: `1px solid ${form.socialInteractionLevel === level ? 'transparent' : 'var(--glass-border)'}`,
                                            boxShadow: form.socialInteractionLevel === level ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
                                        }}>
                                        {level === 'Low' ? '😔' : level === 'Medium' ? '🙂' : '😊'} {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Weekend Sleep Shift */}
                        <div>
                            <FieldLabel icon={Moon} label="Weekend Sleep Shift (hours)" color="#6366f1"
                                tooltip="How many extra hours do you sleep on weekends vs weekdays? Social jetlag indicator." />
                            <div className="flex items-center gap-4">
                                <GSlider value={Number(form.weekendSleepShift)} onChange={v => set('weekendSleepShift', v)} min={-4} max={6} step={0.5} color="#6366f1" />
                                <span className="text-lg font-bold w-12 text-center" style={{ color: '#6366f1' }}>
                                    {form.weekendSleepShift > 0 ? '+' : ''}{form.weekendSleepShift}h
                                </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                {Math.abs(form.weekendSleepShift) > 2 ? '⚠️ High social jetlag (>2h shift)' : '✅ Low social jetlag'}
                            </p>
                        </div>
                    </div>
                </SectionCard>
            );
            default: return null;
        }
    };

    if (loadingToday) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-24">
            {/* Header */}
            <div className="glass-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                            {existingId ? 'Update Today\'s Health Data' : 'Daily Health Check-in'}
                        </h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {existingId ? '✏️ Editing existing record' : form.date} · {user?.fullName?.split(' ')[0] || 'Student'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: bmiMeta.bg, color: bmiMeta.color }}>
                    BMI {bmi ?? '—'} · {bmiMeta.label}
                </div>
            </div>

            {/* Risk alert banner */}
            {riskAlert && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-scale-in"
                    style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold">High Stress + Low Sleep Detected</p>
                        <p className="text-xs opacity-80">Stress {'>'} 8 with less than 5h sleep is a risk combination. Please prioritize rest.</p>
                    </div>
                </div>
            )}

            {/* Step progress */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                    {SECTIONS.map(s => {
                        const Icon = s.icon;
                        const isActive = step === s.id;
                        const isCompleted = step > s.id;
                        return (
                            <button key={s.id} onClick={() => s.id < step && setStep(s.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                                style={{
                                    background: isActive ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : isCompleted ? 'rgba(16,185,129,0.15)' : 'var(--glass-bg)',
                                    color: isActive ? 'white' : isCompleted ? '#10b981' : 'var(--text-muted)',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: isActive ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                                }}>
                                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{s.label}</span>
                                <span className="sm:hidden">{s.id}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${((step - 1) / 3) * 100}%`, background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Section {step} of 4</p>
            </div>

            {/* Toast notifications */}
            {toast && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-scale-in"
                    style={{
                        background: toast.type === 'success' ? 'rgba(16,185,129,0.12)'
                            : toast.type === 'alert' ? 'rgba(245,158,11,0.12)'
                                : 'rgba(239,68,68,0.12)',
                        border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.25)'
                            : toast.type === 'alert' ? 'rgba(245,158,11,0.25)'
                                : 'rgba(239,68,68,0.25)'}`,
                        color: toast.type === 'success' ? '#10b981' : toast.type === 'alert' ? '#f59e0b' : '#ef4444',
                    }}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span className="text-sm font-semibold">{toast.msg}</span>
                </div>
            )}

            {/* Section form */}
            <div className="transition-all duration-300">{renderSection()}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button onClick={handleBack} disabled={step === 1}
                    className="flex items-center gap-2 glass-btn-outline px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {step < 4 ? (
                    <button onClick={handleNext} className="glass-btn px-6 py-2.5 flex items-center gap-2">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="glass-btn-outline px-4 py-2.5 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <button onClick={() => { handleSave(); navigate('/prediction'); }} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Brain className="w-4 h-4" /> Save & Predict</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Sticky save bar */}
            <div className="fixed bottom-3 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                <div className="glass rounded-3xl px-6 py-3 flex items-center gap-8 pointer-events-auto"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Info className="w-3.5 h-3.5" />
                        Data encrypted &amp; stored securely.
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className="glass-btn flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Data</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
