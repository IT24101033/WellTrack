import React, { useState, useEffect } from 'react';
import tipService from '../../services/tipService';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Utensils, Dumbbell, Brain, Loader2, AlertCircle,
    Clock, CalendarPlus, Sparkles, Play, Youtube, Zap
} from 'lucide-react';

// ── AI Health Insights Section ─────────────────────────────────────────────────

const ADVICE_CATEGORIES = [
    { key: 'diet',    label: 'Diet & Nutrition', emoji: '🥗', color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
    { key: 'workout', label: 'Workout Plan',     emoji: '💪', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
    { key: 'mental',  label: 'Mental Wellness',  emoji: '🧠', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
];

function AIHealthInsights({ onAddAiPlan, subscriptionPlan }) {
    const [aiData, setAiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const fetchAdvice = async () => {
        if (subscriptionPlan === 'Free') {
            setAiError(
                <span>
                    AI Health Insights require a Premium or Pro subscription.{' '}
                    <a href="/notifications" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 'bold' }}>
                        Upgrade here
                    </a>
                </span>
            );
            return;
        }
        setLoading(true);
        setAiError('');
        try {
            const { data } = await api.post('/ai/health-advice');
            setAiData(data.data);
        } catch (err) {
            setAiError(err.response?.data?.message || 'Failed to generate AI advice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.06) 100%)',
            border: '1px solid rgba(139,92,246,0.18)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                    }}>
                        <Sparkles style={{ color: 'white', width: '22px', height: '22px' }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                            🤖 AI Health Insights
                        </h2>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Powered by Google Gemini · Analyzes your real health data
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchAdvice}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', borderRadius: '12px',
                        background: loading ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                        color: loading ? '#8b5cf6' : 'white',
                        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 600,
                        boxShadow: loading ? 'none' : '0 4px 14px rgba(139,92,246,0.35)',
                        transition: 'all 0.2s',
                    }}
                >
                    {loading
                        ? <><Loader2 className="animate-spin" style={{ width: '15px', height: '15px' }} /> Generating…</>
                        : <><Sparkles style={{ width: '15px', height: '15px' }} /> Get AI Advice</>
                    }
                </button>
            </div>

            {/* Error */}
            {aiError && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '13px',
                }}>
                    <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                    {aiError}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && !aiData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '14px' }}>
                    {ADVICE_CATEGORIES.map(cat => (
                        <div key={cat.key} style={{ background: cat.bg, border: `1px solid ${cat.border}`, borderRadius: '14px', padding: '18px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${cat.color}22` }} />
                                <div style={{ height: '14px', width: '100px', background: `${cat.color}22`, borderRadius: '6px' }} />
                            </div>
                            <div style={{ height: '12px', width: '90%', background: `${cat.color}15`, borderRadius: '6px', marginBottom: '6px' }} />
                            <div style={{ height: '12px', width: '70%', background: `${cat.color}15`, borderRadius: '6px' }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Advice Cards + Videos */}
            {aiData && !loading && (
                <>
                    {/* 3 advice cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '14px', marginBottom: '24px' }}>
                        {ADVICE_CATEGORIES.map(cat => (
                            <div key={cat.key} style={{
                                background: cat.bg, border: `1px solid ${cat.border}`,
                                borderRadius: '14px', padding: '18px', transition: 'transform 0.2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        {cat.emoji}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Zap style={{ width: '11px', height: '11px', color: cat.color }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: cat.color }}>{cat.label}</span>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#374151' }}>
                                    {aiData.advice?.[cat.key] || 'No advice available.'}
                                </p>

                                {/* Render generated plans if available */}
                                {aiData.advice?.[`${cat.key}_plans`] && aiData.advice[`${cat.key}_plans`].length > 0 && (
                                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {aiData.advice[`${cat.key}_plans`].map((plan, idx) => (
                                            <div key={idx} style={{ 
                                                padding: '10px', background: 'rgba(255,255,255,0.6)', 
                                                borderRadius: '10px', border: `1px solid ${cat.border}`,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{plan.title}</h4>
                                                    <span style={{ fontSize: '10px', background: cat.color, color: 'white', padding: '3px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {plan.recommended_time || (cat.key === 'diet' ? 'Meal' : 'Activity')}
                                                    </span>
                                                </div>
                                                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{plan.description}</p>
                                                
                                                <button 
                                                    onClick={() => onAddAiPlan && onAddAiPlan(plan, cat.key)}
                                                    style={{ 
                                                        width: '100%', fontSize: '12px', background: 'white', 
                                                        color: cat.color, border: `1px solid ${cat.color}40`, 
                                                        padding: '6px 0', borderRadius: '8px', cursor: 'pointer', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                        gap: '6px', fontWeight: 600, transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = cat.color; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = cat.color; }}
                                                >
                                                    <CalendarPlus size={14} /> Add to Schedule
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* YouTube Videos */}
                    {aiData.videos && aiData.videos.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <Youtube style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                    ▶ Recommended YouTube Videos based on your data
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {aiData.videos.map((video, idx) => (
                                    <a key={idx} href={video.url} target="_blank" rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', flexShrink: 0, width: '180px' }}>
                                        <div style={{
                                            borderRadius: '12px', overflow: 'hidden',
                                            border: '1px solid rgba(0,0,0,0.08)', background: '#fff',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                                        >
                                            <div style={{ position: 'relative', width: '180px', height: '101px', background: '#f1f5f9' }}>
                                                {video.thumbnail
                                                    ? <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0' }}>
                                                        <Youtube style={{ width: '32px', height: '32px', color: '#ef4444' }} />
                                                      </div>
                                                }
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239,68,68,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}>
                                                        <Play style={{ width: '14px', height: '14px', color: 'white', marginLeft: '2px' }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ padding: '10px' }}>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, lineHeight: '1.4', color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {video.title}
                                                </p>
                                                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>{video.channelTitle}</p>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No YouTube key fallback */}
                    {aiData.videos && aiData.videos.length === 0 && (
                        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                            <Youtube style={{ width: '20px', height: '20px', margin: '0 auto 6px', color: '#ef4444' }} />
                            <p style={{ margin: 0 }}>Add a YouTube API key in .env to see video recommendations.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── Error Boundary ─────────────────────────────────────────────────────────────

class DashboardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ hasError: true, error, errorInfo });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#ffebee', color: '#c62828' }}>
                    <h1>Something went wrong in HealthTipsDashboard.</h1>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// ── Main Dashboard Inner ───────────────────────────────────────────────────────

function HealthTipsDashboardInner() {
    const { user, token } = useAuth();
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [selectedTip, setSelectedTip] = useState(null);
    const [subscriptionPlan, setSubscriptionPlan] = useState('Free');

    useEffect(() => {
        const loadSub = async () => {
            try {
                const r = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/subscription', {
                    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                });
                const d = await r.json();
                if (d.success && d.subscription) {
                    setSubscriptionPlan(d.subscription.planName);
                }
            } catch (e) { /* silent */ }
        };
        fetchTips();
        loadSub();
    }, [user, token]);

    const fetchTips = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await tipService.getPersonalizedTips(user?.id);
            setTips(res.data);
        } catch (err) {
            setError('Failed to fetch personalized health tips.');
        } finally {
            setLoading(false);
        }
    };

    const filteredTips = activeTab === 'ALL'
        ? tips
        : tips.filter(tip => tip.category === activeTab);

    const timelineTips = tips
        .filter(t => t.recommended_time)
        .sort((a, b) => a.recommended_time.localeCompare(b.recommended_time));

    const summaries = {
        DIET:    tips.filter(t => t.category === 'DIET').length,
        WORKOUT: tips.filter(t => t.category === 'WORKOUT').length,
        MENTAL:  tips.filter(t => t.category === 'MENTAL').length,
    };

    const handleAddToSchedule = async (tip) => {
        try {
            const payload = {
                title: tip.title,
                description: tip.description,
                category: tip.category,
                time: tip.recommended_time || "",
                duration: tip.duration || "",
                status: "approved",
                target_type: tip.target_type || "GENERAL",
                difficulty_level: tip.difficulty_level || "EASY"
            };
            await api.post('/tips/schedule', payload);
            fetchTips();
            alert(`Added "${tip.title}" to your schedule!`);
            setSelectedTip(null);
        } catch (err) {
            console.error('Add to schedule failed', err);
            alert('Failed to add to schedule.');
        }
    };

    const handleAddAiPlanToSchedule = async (plan, categoryStr) => {
        try {
            const payload = {
                title: plan.title,
                description: plan.description,
                category: categoryStr.toUpperCase(),
                time: plan.recommended_time || "",
                duration: plan.duration || "",
                status: "approved",
                target_type: plan.target_type || "GENERAL",
                difficulty_level: plan.difficulty_level || "EASY"
            };
            await api.post('/tips/schedule', payload);
            fetchTips();
            alert(`Added "${plan.title}" to your schedule!`);
        } catch (err) {
            console.error('Failed to add plan to schedule', err);
            alert('Failed to add plan to schedule.');
        }
    };

    return (
        <div className="p-6 min-h-screen text-gray-800" style={{ background: 'var(--bg-primary, #f3f6fc)' }}>
            {/* Header */}
            <div className="mb-6 text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tips &amp; Advice</h1>
                <p className="text-gray-500 mt-2">Personalized insights based on your recent activity, sleep, and stress data.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-red-50 text-red-700 border border-red-100 shadow-sm">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* AI Health Insights */}
            <AIHealthInsights onAddAiPlan={handleAddAiPlanToSchedule} subscriptionPlan={subscriptionPlan} />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Diet Plan"       count={summaries.DIET}    icon={<Utensils size={24} className="text-emerald-500" />} bg="bg-emerald-50/50 border-emerald-100" />
                <SummaryCard title="Workout"         count={summaries.WORKOUT} icon={<Dumbbell size={24} className="text-orange-500" />}  bg="bg-orange-50/50 border-orange-100"  />
                <SummaryCard title="Mental Wellness" count={summaries.MENTAL}  icon={<Brain size={24} className="text-purple-500" />}     bg="bg-purple-50/50 border-purple-100"  />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Tips Board */}
                <div className="lg:col-span-2">
                    <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
                        {['ALL', 'DIET', 'WORKOUT', 'MENTAL'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >{tab}</button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-12 flex justify-center text-blue-500">
                                <Loader2 size={32} className="animate-spin" />
                            </div>
                        ) : filteredTips.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm">
                                <div className="text-gray-400 mb-2">🍃</div>
                                <h3 className="text-lg font-medium text-gray-700">No tips found.</h3>
                                <p className="text-gray-500 text-sm">Check back later for personalized insights.</p>
                            </div>
                        ) : (
                            filteredTips.map(tip => (
                                <div key={tip._id} onClick={() => setSelectedTip(tip)}
                                    className="bg-white/70 backdrop-blur-md border border-white shadow-sm hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:bg-white/90 flex flex-col h-full"
                                >
                                    {tip.image_url && (
                                        <div className="w-full h-32 mb-4 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
                                            <img src={tip.image_url} alt={tip.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
                                        <div className="flex gap-2 items-center">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase ${
                                                tip.category === 'DIET'    ? 'bg-emerald-100/80 text-emerald-700' :
                                                tip.category === 'WORKOUT' ? 'bg-orange-100/80 text-orange-700'  :
                                                                              'bg-purple-100/80 text-purple-700'
                                            }`}>{tip.category}</span>
                                            {tip.source === 'EXTERNAL' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50 font-bold uppercase shadow-sm">
                                                    Global
                                                </span>
                                            )}
                                        </div>
                                        {tip.recommended_time && (
                                            <span className="flex items-center gap-1 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Clock size={12} /> {tip.recommended_time}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{tip.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed flex-1">{tip.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Timeline */}
                <div className="lg:col-span-1">
                    <div className="bg-white/60 backdrop-blur-xl border border-white shadow-lg rounded-3xl p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <CalendarPlus size={20} className="text-blue-500" /> Daily Habit Timeline
                        </h2>
                        {loading ? (
                            <div className="flex justify-center p-6 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
                        ) : timelineTips.length === 0 ? (
                            <div className="text-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100 text-gray-400 text-sm">
                                No scheduled tips yet. Add a tip with a time to see it here.
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-blue-100 ml-3 space-y-6">
                                {timelineTips.map((tip, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-blue-400 shadow-sm" />
                                        <div className="text-xs font-mono text-blue-500 font-semibold mb-1">{tip.recommended_time}</div>
                                        <div className="bg-white/80 border border-gray-100 rounded-xl p-3 shadow-sm">
                                            <h4 className="font-semibold text-gray-800 text-sm">{tip.title}</h4>
                                            <span className="text-xs text-gray-500 mt-1 inline-block bg-gray-50 px-2 py-0.5 rounded">{tip.target_type} Target</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedTip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-transform scale-100 flex flex-col max-h-[90vh]">
                        {selectedTip.image_url && (
                            <div className="w-full h-48 shrink-0 bg-gray-100 relative">
                                <img src={selectedTip.image_url} alt={selectedTip.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                <button onClick={() => setSelectedTip(null)} className="absolute top-4 right-4 text-white hover:text-gray-200 bg-black/30 rounded-full w-8 h-8 flex items-center justify-center shadow-sm backdrop-blur-sm">&times;</button>
                            </div>
                        )}
                        <div className={`p-6 border-b shrink-0 ${!selectedTip.image_url ? (
                            selectedTip.category === 'DIET'    ? 'bg-emerald-50 border-emerald-100' :
                            selectedTip.category === 'WORKOUT' ? 'bg-orange-50 border-orange-100'  :
                                                                  'bg-purple-50 border-purple-100'
                        ) : 'bg-white border-gray-100 pt-5'}`}>
                            {!selectedTip.image_url && (
                                <div className="flex justify-between items-start w-full">
                                    <span className={`text-xs px-3 py-1 bg-white rounded-full font-bold uppercase shadow-sm ${
                                        selectedTip.category === 'DIET'    ? 'text-emerald-600' :
                                        selectedTip.category === 'WORKOUT' ? 'text-orange-600'  : 'text-purple-600'
                                    }`}>{selectedTip.category}</span>
                                    <button onClick={() => setSelectedTip(null)} className="text-gray-400 hover:text-gray-600 font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm">&times;</button>
                                </div>
                            )}
                            <h2 className="text-2xl font-bold text-gray-900 mt-3 leading-tight tracking-tight">{selectedTip.title}</h2>
                            <div className="flex gap-2 mt-3">
                                <span className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">Difficulty: {selectedTip.difficulty_level}</span>
                                <span className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">Target: {selectedTip.target_type}</span>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto no-scrollbar">
                            <p className="text-gray-700 leading-relaxed text-sm mb-6 whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">{selectedTip.description}</p>
                            <button onClick={() => handleAddToSchedule(selectedTip)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <CalendarPlus size={18} /> Add to Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for summary cards
function SummaryCard({ title, count, icon, bg }) {
    return (
        <div className={`p-5 rounded-2xl border backdrop-blur-md shadow-sm transition-transform hover:-translate-y-1 duration-300 ${bg}`}>
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">{title}</p>
                    <div className="text-3xl font-extrabold text-gray-800">{count}</div>
                </div>
                <div className="p-3 bg-white/80 rounded-xl shadow-sm">{icon}</div>
            </div>
        </div>
    );
}

export default function HealthTipsDashboard() {
    return (
        <DashboardErrorBoundary>
            <HealthTipsDashboardInner />
        </DashboardErrorBoundary>
    );
}
