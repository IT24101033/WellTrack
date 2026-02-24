import React, { useState, useCallback } from 'react';
import {
    User, Moon, Activity, Brain, Smartphone, Heart,
    ChevronRight, ChevronLeft, Save, RotateCcw, Zap,
    Droplets, Flame, Wind, AlertCircle, CheckCircle2,
    Loader2, Info, TrendingUp, Shield
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 1, label: 'Basic Info', icon: User },
    { id: 2, label: 'Sleep', icon: Moon },
    { id: 3, label: 'Activity', icon: Activity },
    { id: 4, label: 'Mental Health', icon: Brain },
    { id: 5, label: 'Lifestyle', icon: Smartphone },
    { id: 6, label: 'Health Metrics', icon: Heart },
];

const INITIAL_FORM = {
    age: '', gender: '', height: '', weight: '',
    sleep_duration: 7, sleep_quality: 7, bedtime: '22:30', wakeup_time: '06:30',
    steps_count: '', physical_activity: 'moderate', exercise_duration: '', calories_burned: '',
    stress_level: 4, anxiety_score: 4, depression_score: 3, study_hours: '',
    screen_time: '', water_intake: '', calorie_intake: '', smoking_status: false, alcohol_consumption: 'none',
    heart_rate: '', blood_pressure_sys: '', blood_pressure_dia: '', medical_history: '', family_history: '',
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
const stressLabel = v => v <= 3 ? 'Low Stress' : v <= 6 ? 'Moderate Stress' : 'High Stress';
const riskPreview = form => {
    let score = 0;
    if (form.stress_level > 6) score += 2;
    if (form.anxiety_score > 6) score += 2;
    if (parseFloat(calcBMI(form.height, form.weight)) > 30) score += 2;
    if (form.sleep_duration < 6) score += 1;
    if (form.smoking_status) score += 2;
    if (score <= 2) return { label: '● Low Risk', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
    if (score <= 5) return { label: '● Moderate Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    return { label: '● High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
};

// ─── Glass Input ──────────────────────────────────────────────────────────────
const GInput = ({ className = '', ...props }) => (
    <input className={`glass-input ${className}`} {...props} />
);

const GSelect = ({ children, ...props }) => (
    <select className="glass-input" {...props}>{children}</select>
);

const GSlider = ({ value, onChange, min, max, step = 1 }) => {
    const color = stressColor(value);
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <input type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full"
            style={{ background: `linear-gradient(to right, ${color} ${pct}%, rgba(148,163,184,0.25) ${pct}%)` }} />
    );
};

const GToggle = ({ checked, onChange }) => (
    <button type="button" onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300"
        style={{ background: checked ? '#ef4444' : 'rgba(148,163,184,0.3)' }}>
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

// ─── Section Cards ────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HealthInput() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});

    const bmi = calcBMI(form.height, form.weight);
    const bmiMeta = bmiInfo(bmi);
    const risk = riskPreview(form);

    const set = useCallback((field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }, []);

    const validate = () => {
        const e = {};
        if (step === 1) {
            if (!form.age || form.age < 10 || form.age > 120) e.age = 'Enter a valid age (10–120)';
            if (!form.gender) e.gender = 'Select gender';
            if (!form.height || form.height < 100 || form.height > 250) e.height = 'Height in cm (100–250)';
            if (!form.weight || form.weight < 20 || form.weight > 300) e.weight = 'Weight in kg (20–300)';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => { if (validate()) setStep(s => Math.min(s + 1, 6)); };
    const handleBack = () => setStep(s => Math.max(s - 1, 1));
    const handleReset = () => { setForm(INITIAL_FORM); setStep(1); setErrors({}); };

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1200));
        setSaving(false); setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handlePredict = async () => {
        setPredicting(true);
        await new Promise(r => setTimeout(r, 2000));
        setPredicting(false);
        alert('🧠 Prediction complete! Risk Level: ' + risk.label.replace('● ', ''));
    };

    const renderSection = () => {
        switch (step) {
            case 1: return (
                <SectionCard title="Basic Information" icon={User} color="#3b82f6">
                    {/* BMI live badge */}
                    <div className="mb-5 p-4 rounded-2xl flex items-center justify-between"
                        style={{ background: bmiMeta.bg, border: `1px solid ${bmiMeta.color}20` }}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Live BMI</p>
                            <p className="text-3xl font-bold mt-0.5" style={{ color: bmiMeta.color }}>{bmi ?? '—'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold" style={{ color: bmiMeta.color }}>{bmiMeta.label}</span>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>kg / m²</p>
                        </div>
                        <Shield className="w-10 h-10 ml-4 opacity-20" style={{ color: bmiMeta.color }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel icon={User} label="Age" tooltip="Your current age in years" />
                            <GInput type="number" placeholder="22" min="10" max="120" value={form.age} onChange={e => set('age', e.target.value)} />
                            {errors.age && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.age}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={User} label="Gender" />
                            <GSelect value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </GSelect>
                            {errors.gender && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.gender}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={TrendingUp} label="Height (cm)" tooltip="Your height in centimetres" />
                            <GInput type="number" placeholder="175" min="100" max="250" value={form.height} onChange={e => set('height', e.target.value)} />
                            {errors.height && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.height}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={TrendingUp} label="Weight (kg)" tooltip="Your weight in kilograms" />
                            <GInput type="number" placeholder="70" min="20" max="300" value={form.weight} onChange={e => set('weight', e.target.value)} />
                            {errors.weight && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.weight}</p>}
                        </div>
                    </div>
                </SectionCard>
            );
            case 2: return (
                <SectionCard title="Sleep & Recovery" icon={Moon} color="#6366f1">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Moon} label="Sleep Duration" color="#6366f1" tooltip="Hours of sleep per night" />
                                <span className="text-2xl font-bold" style={{ color: '#6366f1' }}>{form.sleep_duration}h</span>
                            </div>
                            <GSlider value={form.sleep_duration} onChange={v => set('sleep_duration', v)} min={0} max={12} step={0.5} />
                            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                <span>0h</span><span>Recommended: 7–9h</span><span>12h</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Moon} label="Sleep Quality" color="#6366f1" tooltip="How restful? 1=Poor, 10=Excellent" />
                                <span className="text-2xl font-bold" style={{ color: form.sleep_quality >= 7 ? '#10b981' : form.sleep_quality >= 4 ? '#f59e0b' : '#ef4444' }}>
                                    {form.sleep_quality}/10
                                </span>
                            </div>
                            <GSlider value={form.sleep_quality} onChange={v => set('sleep_quality', v)} min={1} max={10} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><FieldLabel icon={Moon} label="Bedtime" color="#6366f1" /><GInput type="time" value={form.bedtime} onChange={e => set('bedtime', e.target.value)} /></div>
                            <div><FieldLabel icon={Moon} label="Wake-up Time" color="#6366f1" /><GInput type="time" value={form.wakeup_time} onChange={e => set('wakeup_time', e.target.value)} /></div>
                        </div>
                    </div>
                </SectionCard>
            );
            case 3: return (
                <SectionCard title="Physical Activity" icon={Activity} color="#10b981">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel icon={Activity} label="Steps Count" color="#10b981" tooltip="Total steps today" />
                            <GInput type="number" placeholder="8000" min="0" max="100000" value={form.steps_count} onChange={e => set('steps_count', e.target.value)} />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Goal: 10,000 steps/day</p>
                        </div>
                        <div>
                            <FieldLabel icon={Zap} label="Activity Level" color="#10b981" />
                            <GSelect value={form.physical_activity} onChange={e => set('physical_activity', e.target.value)}>
                                <option value="low">Low (mostly sedentary)</option>
                                <option value="moderate">Moderate (light exercise)</option>
                                <option value="high">High (intense daily exercise)</option>
                            </GSelect>
                        </div>
                        <div>
                            <FieldLabel icon={Activity} label="Exercise Duration (min)" color="#10b981" />
                            <GInput type="number" placeholder="30" min="0" max="480" value={form.exercise_duration} onChange={e => set('exercise_duration', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel icon={Flame} label="Calories Burned" color="#10b981" />
                            <GInput type="number" placeholder="250" min="0" max="5000" value={form.calories_burned} onChange={e => set('calories_burned', e.target.value)} />
                        </div>
                    </div>
                </SectionCard>
            );
            case 4: return (
                <SectionCard title="Mental Health" icon={Brain} color="#8b5cf6">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Stress Level" color="#8b5cf6" tooltip="1=No stress, 10=Extremely stressed" />
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold" style={{ color: stressColor(form.stress_level) }}>{form.stress_level}</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: `${stressColor(form.stress_level)}18`, color: stressColor(form.stress_level) }}>
                                        {stressLabel(form.stress_level)}
                                    </span>
                                </div>
                            </div>
                            <GSlider value={form.stress_level} onChange={v => set('stress_level', v)} min={1} max={10} />
                            <div className="flex justify-between text-xs mt-1">
                                <span style={{ color: '#10b981' }}>Low</span>
                                <span style={{ color: '#f59e0b' }}>Moderate</span>
                                <span style={{ color: '#ef4444' }}>High</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Anxiety Score (GAD-7)" color="#8b5cf6" />
                                <span className="text-2xl font-bold" style={{ color: form.anxiety_score >= 7 ? '#ef4444' : form.anxiety_score >= 4 ? '#f59e0b' : '#10b981' }}>
                                    {form.anxiety_score}/10
                                </span>
                            </div>
                            <GSlider value={form.anxiety_score} onChange={v => set('anxiety_score', v)} min={1} max={10} />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Depression Score (PHQ-9)" color="#8b5cf6" />
                                <span className="text-2xl font-bold" style={{ color: form.depression_score >= 7 ? '#ef4444' : form.depression_score >= 4 ? '#f59e0b' : '#10b981' }}>
                                    {form.depression_score}/10
                                </span>
                            </div>
                            <GSlider value={form.depression_score} onChange={v => set('depression_score', v)} min={1} max={10} />
                        </div>
                        <div>
                            <FieldLabel icon={Brain} label="Study Hours" color="#8b5cf6" tooltip="Hours studying/working today" />
                            <GInput type="number" placeholder="4" min="0" max="24" value={form.study_hours} onChange={e => set('study_hours', e.target.value)} />
                        </div>
                    </div>
                </SectionCard>
            );
            case 5: return (
                <SectionCard title="Lifestyle" icon={Smartphone} color="#f97316">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel icon={Smartphone} label="Screen Time (hours)" color="#f97316" tooltip="Total hours on devices today" />
                            <GInput type="number" placeholder="4" min="0" max="24" value={form.screen_time} onChange={e => set('screen_time', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel icon={Droplets} label="Water Intake (liters)" color="#f97316" />
                            <GInput type="number" placeholder="2.0" min="0" max="10" step="0.1" value={form.water_intake} onChange={e => set('water_intake', e.target.value)} />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Recommended: 2–3 L/day</p>
                        </div>
                        <div>
                            <FieldLabel icon={Flame} label="Calorie Intake (kcal)" color="#f97316" />
                            <GInput type="number" placeholder="2000" min="0" max="10000" value={form.calorie_intake} onChange={e => set('calorie_intake', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel icon={Wind} label="Alcohol Consumption" color="#f97316" />
                            <GSelect value={form.alcohol_consumption} onChange={e => set('alcohol_consumption', e.target.value)}>
                                <option value="none">None</option>
                                <option value="low">Low (1–2 drinks/week)</option>
                                <option value="moderate">Moderate (3–7/week)</option>
                                <option value="high">High (8+/week)</option>
                            </GSelect>
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between p-4 rounded-2xl"
                                style={{ background: form.smoking_status ? 'rgba(239,68,68,0.08)' : 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                <div>
                                    <FieldLabel icon={Wind} label="Smoking Status" color="#f97316" tooltip="Do you currently smoke?" />
                                    <p className="text-xs -mt-1" style={{ color: 'var(--text-muted)' }}>
                                        {form.smoking_status ? '🚬 Currently smoking – significant risk factor' : '✅ Non-smoker'}
                                    </p>
                                </div>
                                <GToggle checked={form.smoking_status} onChange={v => set('smoking_status', v)} />
                            </div>
                        </div>
                    </div>
                </SectionCard>
            );
            case 6: return (
                <SectionCard title="Health Metrics" icon={Heart} color="#ef4444">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <FieldLabel icon={Heart} label="Heart Rate (bpm)" color="#ef4444" tooltip="Resting HR. Normal: 60–100 bpm" />
                                <GInput type="number" placeholder="72" min="30" max="220" value={form.heart_rate} onChange={e => set('heart_rate', e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel icon={Heart} label="Systolic BP (mmHg)" color="#ef4444" tooltip="Upper number. Normal: <120" />
                                <GInput type="number" placeholder="120" min="60" max="250" value={form.blood_pressure_sys} onChange={e => set('blood_pressure_sys', e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel icon={Heart} label="Diastolic BP (mmHg)" color="#ef4444" tooltip="Lower number. Normal: <80" />
                                <GInput type="number" placeholder="80" min="40" max="150" value={form.blood_pressure_dia} onChange={e => set('blood_pressure_dia', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <FieldLabel icon={Heart} label="Existing Medical Conditions" color="#ef4444" />
                            <textarea rows={3} placeholder="e.g. Type 2 Diabetes, Hypertension…"
                                value={form.medical_history} onChange={e => set('medical_history', e.target.value)}
                                className="glass-input resize-none" style={{ height: 'auto' }} />
                        </div>
                        <div>
                            <FieldLabel icon={Heart} label="Family Medical History" color="#ef4444" />
                            <textarea rows={3} placeholder="e.g. Heart disease, Cancer, Diabetes…"
                                value={form.family_history} onChange={e => set('family_history', e.target.value)}
                                className="glass-input resize-none" style={{ height: 'auto' }} />
                        </div>
                    </div>
                </SectionCard>
            );
            default: return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in pb-10">
            {/* Header */}
            <div className="glass-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Daily Health Check-in</h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Smart Health Risk Predictor</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: risk.bg, color: risk.color }}>
                    {risk.label}
                </div>
            </div>

            {/* Step bar */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
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
                        style={{ width: `${((step - 1) / 5) * 100}%`, background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Step {step} of 6</p>
            </div>

            {/* Success toast */}
            {saved && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-scale-in"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-semibold">Health data saved successfully!</span>
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
                {step < 6 ? (
                    <button onClick={handleNext} className="glass-btn px-6 py-2.5 flex items-center gap-2">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="glass-btn-outline px-4 py-2.5 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <button onClick={handlePredict} disabled={predicting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>
                            {predicting ? <><Loader2 className="w-4 h-4 animate-spin" /> Predicting…</> : <><Brain className="w-4 h-4" /> Predict Risk</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Sticky save */}
            <div className="fixed bottom-3 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                <div className="glass rounded-3xl px-6 py-3 flex items-center gap-8 pointer-events-auto"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Info className="w-3.5 h-3.5" />
                        Your data is encrypted and stored securely.
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
