import React, { useState } from 'react';
import { Moon, Flame, Brain, Apple, Droplets, Zap, BookOpen, Heart, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All Tips' },
    { id: 'sleep', label: 'Sleep' },
    { id: 'activity', label: 'Activity' },
    { id: 'mental', label: 'Mental Health' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'lifestyle', label: 'Lifestyle' },
];

const TIPS = [
    {
        id: 1, cat: 'sleep', icon: Moon, color: '#6366f1', title: 'Consistent Sleep Schedule', tag: '🌟 Top Pick',
        summary: 'Going to bed and waking at the same time every day stabilises your circadian rhythm.',
        details: 'Even on weekends, a consistent sleep schedule reduces sleep debt, improves mood, and boosts cognitive function. Try adjusting your bedtime in 15-minute increments until you find the natural time your body wants to sleep.'
    },
    {
        id: 2, cat: 'activity', icon: Zap, color: '#f97316', title: '10-Minute Micro Workouts', tag: '⚡ Quick Win',
        summary: 'Short bursts of movement throughout the day are as effective as a single long session.',
        details: "Science shows that three 10-minute moderate exercise bouts per day deliver the same cardiovascular benefits as one 30-minute session. Try a brisk walk after each meal."
    },
    {
        id: 3, cat: 'mental', icon: Brain, color: '#8b5cf6', title: 'Box Breathing Technique', tag: '🧘 Stress Relief',
        summary: 'A simple 4-4-4-4 breathing technique activates your parasympathetic nervous system.',
        details: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times. This activates the body's 'rest and digest' mode and can lower stress hormones within minutes."
    },
    {
        id: 4, cat: 'nutrition', icon: Apple, color: '#10b981', title: 'Eat the Rainbow', tag: '🥦 Nutrition',
        summary: 'Consuming 5+ different-coloured vegetables daily ensures broad micronutrient coverage.',
        details: 'Each colour group provides different phytonutrients: red (lycopene), orange (beta-carotene), green (folate), purple (anthocyanins), white (quercetin). Aim for variety every meal.'
    },
    {
        id: 5, cat: 'lifestyle', icon: Droplets, color: '#3b82f6', title: 'Hydration Anchors', tag: '💧 Habit',
        summary: 'Link water drinking to existing habits to naturally reach your 2–3L daily target.',
        details: "Drink a full glass of water: immediately after waking, before each meal, when you sit at your desk, and before bed. These 'anchors' can easily get you to 2.5L without counting."
    },
    {
        id: 6, cat: 'sleep', icon: Moon, color: '#6366f1', title: 'Blue Light Wind-Down', tag: '📱 Digital',

        summary: 'Reducing screen exposure 90 minutes before bed significantly improves sleep quality.',
        details: "Blue light from devices suppresses melatonin by up to 50%. Enable 'night mode' from 8 PM, or use blue-light-blocking glasses. Replace scrolling with reading, journaling, or light stretching."
    },
    {
        id: 7, cat: 'mental', icon: BookOpen, color: '#8b5cf6', title: 'Gratitude Journaling', tag: '✍️ Mental',
        summary: 'Writing 3 specific things you are grateful for daily reduces stress hormones measurably.',
        details: 'Specificity matters — "my friend texted to check on me" is more powerful than "my friends". Do this before bed for improved sleep onset latency.'
    },
    {
        id: 8, cat: 'nutrition', icon: Flame, color: '#f97316', title: 'Protein at Every Meal', tag: '💪 Nutrition',
        summary: 'Including 20–30g of protein per meal keeps you fuller and stabilises blood sugar.',
        details: 'Protein requires more energy to digest (thermogenic effect), increases satiety hormones, and preserves muscle mass. Good sources: eggs, Greek yogurt, legumes, chicken, tofu.'
    },
    {
        id: 9, cat: 'activity', icon: Heart, color: '#ef4444', title: 'Daily 5-Minute Stretch', tag: '🤸 Movement',
        summary: 'A 5-minute stretch routine every morning prevents musculoskeletal fatigue from studying.',
        details: 'Focus on: neck rolls, chest opener, hip flexor stretch, forward fold, and spinal twist. Hold each for 30–45 seconds. This improves posture, reduces back pain, and increases morning energy.'
    },
];

function TipCard({ tip }) {
    const [expanded, setExpanded] = useState(false);
    const [saved, setSaved] = useState(false);
    const Icon = tip.icon;
    return (
        <div className="glass-card p-5 flex flex-col gap-3 transition-all duration-300 cursor-default group">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                        style={{ background: `${tip.color}18`, border: `1px solid ${tip.color}25`, boxShadow: expanded ? `0 0 16px ${tip.color}30` : 'none' }}>
                        <Icon className="w-5 h-5" style={{ color: tip.color }} />
                    </div>
                    <div>
                        <span className="text-xs font-bold mb-0.5 block" style={{ color: tip.color }}>{tip.tag}</span>
                        <h3 className="font-bold text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{tip.title}</h3>
                    </div>
                </div>
                <button onClick={() => setSaved(s => !s)} className="p-1.5 rounded-lg flex-shrink-0 transition-all duration-200"
                    style={{ color: saved ? '#f59e0b' : 'var(--text-muted)', background: saved ? 'rgba(245,158,11,0.12)' : 'transparent' }}>
                    <Bookmark className="w-4 h-4" fill={saved ? '#f59e0b' : 'none'} />
                </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tip.summary}</p>
            {expanded && (
                <div className="p-3 rounded-2xl text-xs leading-relaxed animate-fade-in"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    {tip.details}
                </div>
            )}
            <button onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 self-start"
                style={{ color: 'var(--accent-blue)' }}>
                {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Read more</>}
            </button>
        </div>
    );
}

export default function Tips() {
    const [category, setCategory] = useState('all');
    const filtered = TIPS.filter(t => category === 'all' || t.cat === category);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Tips & Advice</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Personalised health tips curated for students
                </p>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => {
                    const active = category === c.id;
                    return (
                        <button key={c.id} onClick={() => setCategory(c.id)}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                            style={{
                                background: active ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'var(--glass-bg)',
                                color: active ? 'white' : 'var(--text-muted)',
                                border: '1px solid var(--glass-border)',
                                boxShadow: active ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                            }}>
                            {c.label}
                        </button>
                    );
                })}
            </div>

            {/* Tip cards grid */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(tip => <TipCard key={tip.id} tip={tip} />)}
            </div>
        </div>
    );
}
