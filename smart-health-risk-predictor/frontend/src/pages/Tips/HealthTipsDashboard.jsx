import React, { useState, useEffect } from 'react';
import tipService from '../../services/tipService';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Dumbbell, Brain, Loader2, AlertCircle, Clock, CalendarPlus } from 'lucide-react';

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

function HealthTipsDashboardInner() {
    const { user } = useAuth();
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [selectedTip, setSelectedTip] = useState(null);

    useEffect(() => {
        fetchTips();
    }, [user]);

    const fetchTips = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch personalized tips (Student View)
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

    // Group tips with a recommended_time for the timeline
    const timelineTips = tips
        .filter(t => t.recommended_time)
        .sort((a, b) => a.recommended_time.localeCompare(b.recommended_time));

    // Count summaries (based on fetched personalized tips instead of ALL active tips)
    const summaries = {
        DIET: tips.filter(t => t.category === 'DIET').length,
        WORKOUT: tips.filter(t => t.category === 'WORKOUT').length,
        MENTAL: tips.filter(t => t.category === 'MENTAL').length
    };

    const handleAddToSchedule = (tip) => {
        // In a full implementation, this would call scheduleService to add an actual reminder
        alert(`Added "${tip.title}" to your schedule at ${tip.recommended_time || 'anytime'}`);
        setSelectedTip(null);
    };

    return (
        <div className="p-6 min-h-screen text-gray-800" style={{ background: 'var(--bg-primary, #f3f6fc)' }}>
            {/* Header */}
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Health Dashboard</h1>
                <p className="text-gray-500 mt-2">Personalized insights based on your recent activity, sleep, and stress data.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-red-50 text-red-700 border border-red-100 shadow-sm">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard
                    title="Diet Plan"
                    count={summaries.DIET}
                    icon={<Utensils size={24} className="text-emerald-500" />}
                    bg="bg-emerald-50/50 border-emerald-100"
                />
                <SummaryCard
                    title="Workout"
                    count={summaries.WORKOUT}
                    icon={<Dumbbell size={24} className="text-orange-500" />}
                    bg="bg-orange-50/50 border-orange-100"
                />
                <SummaryCard
                    title="Mental Wellness"
                    count={summaries.MENTAL}
                    icon={<Brain size={24} className="text-purple-500" />}
                    bg="bg-purple-50/50 border-purple-100"
                />
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Side: Tips Board */}
                <div className="lg:col-span-2">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
                        {['ALL', 'DIET', 'WORKOUT', 'MENTAL'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
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
                            filteredTips.map((tip) => (
                                <div
                                    key={tip._id}
                                    onClick={() => setSelectedTip(tip)}
                                    className="bg-white/70 backdrop-blur-md border border-white shadow-sm hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:bg-white/90"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase ${tip.category === 'DIET' ? 'bg-emerald-100/80 text-emerald-700' :
                                            tip.category === 'WORKOUT' ? 'bg-orange-100/80 text-orange-700' :
                                                'bg-purple-100/80 text-purple-700'
                                            }`}>
                                            {tip.category}
                                        </span>
                                        {tip.recommended_time && (
                                            <span className="flex items-center gap-1 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-md">
                                                <Clock size={12} /> {tip.recommended_time}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-800 leading-snug mb-2">{tip.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-2">{tip.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Timeline */}
                <div className="lg:col-span-1">
                    <div className="bg-white/60 backdrop-blur-xl border border-white shadow-lg rounded-3xl p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <CalendarPlus size={20} className="text-blue-500" />
                            Daily Habit Timeline
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-transform scale-100">
                        <div className={`p-6 border-b ${selectedTip.category === 'DIET' ? 'bg-emerald-50 border-emerald-100' :
                            selectedTip.category === 'WORKOUT' ? 'bg-orange-50 border-orange-100' :
                                'bg-purple-50 border-purple-100'
                            }`}
                        >
                            <div className="flex justify-between items-start w-full">
                                <span className={`text-xs px-3 py-1 bg-white rounded-full font-bold uppercase shadow-sm ${selectedTip.category === 'DIET' ? 'text-emerald-600' :
                                    selectedTip.category === 'WORKOUT' ? 'text-orange-600' :
                                        'text-purple-600'
                                    }`}
                                >
                                    {selectedTip.category}
                                </span>
                                <button onClick={() => setSelectedTip(null)} className="text-gray-400 hover:text-gray-600 font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm">&times;</button>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mt-4 leading-tight">{selectedTip.title}</h2>
                            <div className="flex gap-2 mt-3">
                                <span className="text-xs text-gray-500 font-medium bg-white/60 px-2.5 py-1 rounded-md">Difficulty: {selectedTip.difficulty_level}</span>
                                <span className="text-xs text-gray-500 font-medium bg-white/60 px-2.5 py-1 rounded-md">Target: {selectedTip.target_type}</span>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 leading-relaxed text-sm mb-6 whitespace-pre-line">
                                {selectedTip.description}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAddToSchedule(selectedTip)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <CalendarPlus size={18} /> Add to Schedule
                                </button>
                            </div>
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
                <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                    {icon}
                </div>
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
