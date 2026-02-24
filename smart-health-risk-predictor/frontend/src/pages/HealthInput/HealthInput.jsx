import React, { useState, useEffect, useCallback } from 'react';
import {
    User, Moon, Activity, Brain, Smartphone, Heart,
    ChevronRight, ChevronLeft, Save, RotateCcw, Zap,
    Droplets, Flame, Wind, AlertCircle, CheckCircle2,
    Loader2, Info, TrendingUp, Shield
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 1, label: 'Basic Info', icon: User, color: 'blue' },
    { id: 2, label: 'Sleep', icon: Moon, color: 'indigo' },
    { id: 3, label: 'Activity', icon: Activity, color: 'green' },
    { id: 4, label: 'Mental Health', icon: Brain, color: 'purple' },
    { id: 5, label: 'Lifestyle', icon: Smartphone, color: 'orange' },
    { id: 6, label: 'Health Metrics', icon: Heart, color: 'red' },
];

const INITIAL_FORM = {
    // Section 1
    age: '', gender: '', height: '', weight: '',
    // Section 2
    sleep_duration: 7, sleep_quality: 7, bedtime: '22:30', wakeup_time: '06:30',
    // Section 3
    steps_count: '', physical_activity: 'moderate', exercise_duration: '', calories_burned: '',
    // Section 4
    stress_level: 4, anxiety_score: 4, depression_score: 3, study_hours: '',
    // Section 5
    screen_time: '', water_intake: '', calorie_intake: '', smoking_status: false, alcohol_consumption: 'none',
    // Section 6
    heart_rate: '', blood_pressure_sys: '', blood_pressure_dia: '', medical_history: '', family_history: '',
};

// ─── BMI Helpers ──────────────────────────────────────────────────────────────
const calcBMI = (h, w) => {
    if (!h || !w || h <= 0) return null;
    return (w / ((h / 100) ** 2)).toFixed(1);
};
const bmiInfo = (bmi) => {
    if (!bmi) return { label: '—', color: 'text-gray-400', bg: 'bg-gray-100' };
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (b < 25) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-50' };
    if (b < 30) return { label: 'Overweight', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-50' };
};
const stressInfo = (v) => {
    if (v <= 3) return { label: 'Low Stress', color: '#22c55e', accent: 'text-green-600' };
    if (v <= 6) return { label: 'Moderate Stress', color: '#f59e0b', accent: 'text-yellow-600' };
    return { label: 'High Stress', color: '#ef4444', accent: 'text-red-600' };
};
const riskPreview = (form) => {
    let score = 0;
    if (form.stress_level > 6) score += 2;
    if (form.anxiety_score > 6) score += 2;
    if (form.depression_score > 6) score += 2;
    if (parseFloat(calcBMI(form.height, form.weight)) > 30) score += 2;
    if (form.sleep_duration < 6) score += 1;
    if (form.smoking_status) score += 2;
    if (form.alcohol_consumption === 'high') score += 1;
    if (score <= 2) return { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200', dot: 'bg-green-500' };
    if (score <= 5) return { label: 'Moderate Risk', color: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200', dot: 'bg-yellow-500' };
    return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200', dot: 'bg-red-500' };
};

// ─── Reusable Sub-components ──────────────────────────────────────────────────
const FieldLabel = ({ icon: Icon, label, color = 'blue', tooltip }) => (
    <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-${color}-500`} />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {tooltip && (
            <span className="group relative cursor-help">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                <span className="absolute left-5 -top-1 z-10 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 shadow-xl">
                    {tooltip}
                </span>
            </span>
        )}
    </div>
);

const Input = ({ className = '', ...props }) => (
    <input
        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
      placeholder:text-gray-400 transition-all duration-200 ${className}`}
        {...props}
    />
);

const Select = ({ children, className = '', ...props }) => (
    <select
        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
      transition-all duration-200 cursor-pointer ${className}`}
        {...props}
    >
        {children}
    </select>
);

const Slider = ({ value, onChange, min, max, step = 1, color = 'blue' }) => {
    const pct = ((value - min) / (max - min)) * 100;
    const trackColor = color === 'stress'
        ? value <= 3 ? '#22c55e' : value <= 6 ? '#f59e0b' : '#ef4444'
        : color === 'purple' ? '#8b5cf6'
            : color === 'indigo' ? '#6366f1'
                : '#3b82f6';

    return (
        <div className="relative py-1">
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, ${trackColor} ${pct}%, #e5e7eb ${pct}%)`,
                    accentColor: trackColor,
                }}
            />
        </div>
    );
};

const Toggle = ({ checked, onChange, label }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none
      ${checked ? 'bg-red-500' : 'bg-gray-200'}`}
        aria-label={label}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300
      ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const SectionCard = ({ title, icon: Icon, iconColor, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-${iconColor}-50 to-white
      flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl bg-${iconColor}-100 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${iconColor}-600`} />
            </div>
            <h3 className="text-base font-bold text-gray-800">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HealthInput() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});

    const bmi = calcBMI(form.height, form.weight);
    const bmiMeta = bmiInfo(bmi);
    const stress = stressInfo(form.stress_level);
    const risk = riskPreview(form);

    const set = useCallback((field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }, []);

    const validate = () => {
        const e = {};
        if (step === 1) {
            if (!form.age || form.age < 10 || form.age > 120) e.age = 'Enter a valid age (10-120)';
            if (!form.gender) e.gender = 'Select gender';
            if (!form.height || form.height < 100 || form.height > 250) e.height = 'Enter height in cm (100-250)';
            if (!form.weight || form.weight < 20 || form.weight > 300) e.weight = 'Enter weight in kg (20-300)';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => { if (validate()) setStep(s => Math.min(s + 1, 6)); };
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1200));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handlePredict = async () => {
        setPredicting(true);
        await new Promise(r => setTimeout(r, 2000));
        setPredicting(false);
        alert('🧠 Prediction complete! Risk Level: ' + risk.label);
    };

    const handleReset = () => { setForm(INITIAL_FORM); setStep(1); setErrors({}); };

    // ── Render Sections ─────────────────────────────────────────────────────────
    const renderSection = () => {
        switch (step) {
            // ── SECTION 1: Basic Information ───────────────────────────────────────
            case 1: return (
                <SectionCard title="Basic Information" icon={User} iconColor="blue">
                    {/* BMI Live Badge */}
                    <div className={`mb-6 p-4 rounded-xl ${bmiMeta.bg} ring-1 ring-inset ${bmi ? 'ring-blue-100' : 'ring-gray-100'}
            flex items-center justify-between`}>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Live BMI</p>
                            <p className={`text-3xl font-bold mt-0.5 ${bmiMeta.color}`}>{bmi ?? '—'}</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-sm font-semibold ${bmiMeta.color}`}>{bmiMeta.label}</span>
                            <p className="text-xs text-gray-400 mt-1">kg / m²</p>
                        </div>
                        <Shield className={`w-10 h-10 ${bmiMeta.color} opacity-20 ml-4`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel icon={User} label="Age" color="blue" tooltip="Your current age in years" />
                            <Input type="number" placeholder="22" min="10" max="120"
                                value={form.age} onChange={e => set('age', e.target.value)} />
                            {errors.age && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.age}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={User} label="Gender" color="blue" />
                            <Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other / Prefer not to say</option>
                            </Select>
                            {errors.gender && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.gender}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={TrendingUp} label="Height (cm)" color="blue" tooltip="Your height in centimetres" />
                            <Input type="number" placeholder="175" min="100" max="250"
                                value={form.height} onChange={e => set('height', e.target.value)} />
                            {errors.height && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.height}</p>}
                        </div>
                        <div>
                            <FieldLabel icon={TrendingUp} label="Weight (kg)" color="blue" tooltip="Your weight in kilograms" />
                            <Input type="number" placeholder="70" min="20" max="300"
                                value={form.weight} onChange={e => set('weight', e.target.value)} />
                            {errors.weight && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.weight}</p>}
                        </div>
                    </div>
                </SectionCard>
            );

            // ── SECTION 2: Sleep & Recovery ────────────────────────────────────────
            case 2: return (
                <SectionCard title="Sleep & Recovery" icon={Moon} iconColor="indigo">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Moon} label="Sleep Duration" color="indigo" tooltip="Hours of sleep per night" />
                                <span className="text-2xl font-bold text-indigo-600">{form.sleep_duration}h</span>
                            </div>
                            <Slider value={form.sleep_duration} onChange={v => set('sleep_duration', v)}
                                min={0} max={12} step={0.5} color="indigo" />
                            <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
                                <span>0h</span><span>6h (recommended: 7–9h)</span><span>12h</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Moon} label="Sleep Quality" color="indigo" tooltip="How restful was your sleep? 1=Very poor, 10=Excellent" />
                                <span className={`text-2xl font-bold ${form.sleep_quality >= 7 ? 'text-green-600' : form.sleep_quality >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {form.sleep_quality}/10
                                </span>
                            </div>
                            <Slider value={form.sleep_quality} onChange={v => set('sleep_quality', v)} min={1} max={10} color="indigo" />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <FieldLabel icon={Moon} label="Bedtime" color="indigo" />
                                <Input type="time" value={form.bedtime} onChange={e => set('bedtime', e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel icon={Moon} label="Wake-up Time" color="indigo" />
                                <Input type="time" value={form.wakeup_time} onChange={e => set('wakeup_time', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </SectionCard>
            );

            // ── SECTION 3: Physical Activity ───────────────────────────────────────
            case 3: return (
                <SectionCard title="Physical Activity" icon={Activity} iconColor="green">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel icon={Activity} label="Steps Count" color="green" tooltip="Total steps walked today" />
                            <Input type="number" placeholder="8000" min="0" max="100000"
                                value={form.steps_count} onChange={e => set('steps_count', e.target.value)} />
                            <p className="text-xs text-gray-400 mt-1">Goal: 10,000 steps/day</p>
                        </div>
                        <div>
                            <FieldLabel icon={Zap} label="Activity Level" color="green" />
                            <Select value={form.physical_activity} onChange={e => set('physical_activity', e.target.value)}>
                                <option value="low">Low (mostly sedentary)</option>
                                <option value="moderate">Moderate (light exercise)</option>
                                <option value="high">High (intense daily exercise)</option>
                            </Select>
                        </div>
                        <div>
                            <FieldLabel icon={Activity} label="Exercise Duration (min)" color="green" tooltip="Total minutes of exercise" />
                            <Input type="number" placeholder="30" min="0" max="480"
                                value={form.exercise_duration} onChange={e => set('exercise_duration', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel icon={Flame} label="Calories Burned" color="green" tooltip="Estimated calories burned during exercise" />
                            <Input type="number" placeholder="250" min="0" max="5000"
                                value={form.calories_burned} onChange={e => set('calories_burned', e.target.value)} />
                        </div>
                    </div>
                </SectionCard>
            );

            // ── SECTION 4: Mental Health ───────────────────────────────────────────
            case 4: return (
                <SectionCard title="Mental Health" icon={Brain} iconColor="purple">
                    <div className="space-y-6">
                        {/* Stress */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Stress Level" color="purple" tooltip="1=No stress, 10=Extremely stressed" />
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold" style={{ color: stress.color }}>{form.stress_level}</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stress.accent} bg-gray-50`}>
                                        {stress.label}
                                    </span>
                                </div>
                            </div>
                            <Slider value={form.stress_level} onChange={v => set('stress_level', v)} min={1} max={10} color="stress" />
                            <div className="flex justify-between text-xs mt-1 px-0.5">
                                <span className="text-green-500">Low</span>
                                <span className="text-yellow-500">Moderate</span>
                                <span className="text-red-500">High</span>
                            </div>
                        </div>

                        {/* Anxiety */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Anxiety Score (GAD-7)" color="purple" tooltip="Generalised Anxiety Disorder scale, 0–21" />
                                <span className={`text-2xl font-bold ${form.anxiety_score >= 7 ? 'text-red-600' : form.anxiety_score >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {form.anxiety_score}/10
                                </span>
                            </div>
                            <Slider value={form.anxiety_score} onChange={v => set('anxiety_score', v)} min={1} max={10} color="purple" />
                        </div>

                        {/* Depression */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={Brain} label="Depression Score (PHQ-9)" color="purple" tooltip="Patient Health Questionnaire scale, 0–27" />
                                <span className={`text-2xl font-bold ${form.depression_score >= 7 ? 'text-red-600' : form.depression_score >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {form.depression_score}/10
                                </span>
                            </div>
                            <Slider value={form.depression_score} onChange={v => set('depression_score', v)} min={1} max={10} color="purple" />
                        </div>

                        <div>
                            <FieldLabel icon={Brain} label="Study Hours" color="purple" tooltip="Hours spent studying/working today" />
                            <Input type="number" placeholder="4" min="0" max="24"
                                value={form.study_hours} onChange={e => set('study_hours', e.target.value)} />
                        </div>
                    </div>
                </SectionCard>
            );

            // ── SECTION 5: Lifestyle ───────────────────────────────────────────────
            case 5: return (
                <SectionCard title="Lifestyle" icon={Smartphone} iconColor="orange">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel icon={Smartphone} label="Screen Time (hours)" color="orange" tooltip="Total hours on devices today" />
                            <Input type="number" placeholder="4" min="0" max="24"
                                value={form.screen_time} onChange={e => set('screen_time', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel icon={Droplets} label="Water Intake (liters)" color="orange" tooltip="Total water consumed today" />
                            <Input type="number" placeholder="2.0" min="0" max="10" step="0.1"
                                value={form.water_intake} onChange={e => set('water_intake', e.target.value)} />
                            <p className="text-xs text-gray-400 mt-1">Recommended: 2–3 L/day</p>
                        </div>
                        <div>
                            <FieldLabel icon={Flame} label="Calorie Intake (kcal)" color="orange" tooltip="Total food calories consumed today" />
                            <Input type="number" placeholder="2000" min="0" max="10000"
                                value={form.calorie_intake} onChange={e => set('calorie_intake', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel icon={Wind} label="Alcohol Consumption" color="orange" />
                            <Select value={form.alcohol_consumption} onChange={e => set('alcohol_consumption', e.target.value)}>
                                <option value="none">None</option>
                                <option value="low">Low (1–2 drinks/week)</option>
                                <option value="moderate">Moderate (3–7 drinks/week)</option>
                                <option value="high">High (8+ drinks/week)</option>
                            </Select>
                        </div>

                        {/* Smoking Toggle */}
                        <div className="md:col-span-2">
                            <div className={`flex items-center justify-between p-4 rounded-xl border
                ${form.smoking_status ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'} transition-colors`}>
                                <div>
                                    <FieldLabel icon={Wind} label="Smoking Status" color="orange" tooltip="Do you currently smoke?" />
                                    <p className="text-xs text-gray-500 -mt-1">
                                        {form.smoking_status ? '🚬 Currently smoking — significant risk factor' : '✅ Non-smoker'}
                                    </p>
                                </div>
                                <Toggle checked={form.smoking_status} onChange={v => set('smoking_status', v)} label="Smoking" />
                            </div>
                        </div>
                    </div>
                </SectionCard>
            );

            // ── SECTION 6: Health Metrics ──────────────────────────────────────────
            case 6: return (
                <SectionCard title="Health Metrics" icon={Heart} iconColor="red">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <FieldLabel icon={Heart} label="Heart Rate (bpm)" color="red" tooltip="Resting heart rate. Normal: 60–100 bpm" />
                                <Input type="number" placeholder="72" min="30" max="220"
                                    value={form.heart_rate} onChange={e => set('heart_rate', e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel icon={Heart} label="Systolic BP (mmHg)" color="red" tooltip="Upper blood pressure number. Normal: <120" />
                                <Input type="number" placeholder="120" min="60" max="250"
                                    value={form.blood_pressure_sys} onChange={e => set('blood_pressure_sys', e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel icon={Heart} label="Diastolic BP (mmHg)" color="red" tooltip="Lower blood pressure number. Normal: <80" />
                                <Input type="number" placeholder="80" min="40" max="150"
                                    value={form.blood_pressure_dia} onChange={e => set('blood_pressure_dia', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <FieldLabel icon={Heart} label="Existing Medical Conditions" color="red" tooltip="List any diagnosed conditions (e.g. diabetes, asthma)" />
                            <textarea
                                rows={3}
                                placeholder="e.g. Type 2 Diabetes, Hypertension..."
                                value={form.medical_history}
                                onChange={e => set('medical_history', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent
                  placeholder:text-gray-400 resize-none transition-all"
                            />
                        </div>
                        <div>
                            <FieldLabel icon={Heart} label="Family Medical History" color="red" tooltip="Known hereditary conditions in your family" />
                            <textarea
                                rows={3}
                                placeholder="e.g. Heart disease, Cancer, Diabetes..."
                                value={form.family_history}
                                onChange={e => set('family_history', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent
                  placeholder:text-gray-400 resize-none transition-all"
                            />
                        </div>
                    </div>
                </SectionCard>
            );

            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pb-32">
            {/* ── Top Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 leading-none">Daily Health Check-in</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Smart Health Risk Predictor</p>
                        </div>
                    </div>

                    {/* Live Risk Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
            ring-1 ${risk.ring} ${risk.bg} ${risk.color} transition-all`}>
                        <span className={`w-2 h-2 rounded-full ${risk.dot} animate-pulse`} />
                        {risk.label}
                    </div>
                </div>

                {/* ── Step Progress Bar ────────────────────────────────────────────── */}
                <div className="max-w-4xl mx-auto px-4 pb-4">
                    <div className="flex items-center gap-1.5">
                        {SECTIONS.map((s) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => s.id < step && setStep(s.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-300 cursor-pointer
                    ${isActive ? `bg-blue-600 text-white shadow-md shadow-blue-200 scale-105` : ''}
                    ${isCompleted ? `bg-green-100 text-green-700 hover:bg-green-200` : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}`}
                                >
                                    {isCompleted
                                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                                        : <Icon className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">{s.label}</span>
                                    <span className="sm:hidden">{s.id}</span>
                                </button>
                            );
                        })}
                    </div>
                    {/* Progress line */}
                    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${((step - 1) / 5) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Step {step} of 6</p>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 pt-6">

                {/* Success Toast */}
                {saved && (
                    <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700
            rounded-xl px-4 py-3 shadow-sm animate-bounce-once">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm font-medium">Health data saved successfully!</span>
                    </div>
                )}

                {/* Section Form */}
                <div className="transition-all duration-300">
                    {renderSection()}
                </div>

                {/* ── Navigation Buttons ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              border transition-all duration-200
              ${step === 1
                                ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
                                : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:shadow-sm'}`}
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    {step < 6 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition-all duration-200 hover:scale-105"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-all"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                            <button
                                onClick={handlePredict}
                                disabled={predicting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-purple-600 to-purple-700 text-white
                  hover:from-purple-700 hover:to-purple-800 shadow-md shadow-purple-200 transition-all hover:scale-105"
                            >
                                {predicting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Predicting…</>
                                    : <><Brain className="w-4 h-4" /> Predict Risk</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sticky Save Bar ──────────────────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md
        border-t border-gray-100 shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Info className="w-3.5 h-3.5" />
                        <span>Your data is encrypted and stored securely.</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold
              bg-gradient-to-r from-blue-600 to-blue-700 text-white
              hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200
              transition-all duration-200 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            : <><Save className="w-4 h-4" /> Save Health Data</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
