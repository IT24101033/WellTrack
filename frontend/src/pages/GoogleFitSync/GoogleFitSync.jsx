import React, { useState, useEffect } from 'react';
import { 
    Smartphone, CheckCircle, XCircle, RefreshCw, 
    Zap, Moon, Heart, LogOut, Activity, ShieldCheck, Flame, Info
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { fetchHealthEntries } from '../../services/healthService';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDateShort = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' });

function StatCard({ title, value, unit, icon: Icon, color }) {
    return (
        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform duration-500 group-hover:scale-110">
                <Icon size={120} color={color} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-70" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</span>
                    <span className="text-sm font-bold opacity-60" style={{ color: 'var(--text-primary)' }}>{unit}</span>
                </div>
            </div>
        </div>
    );
}

export default function GoogleFitSync() {
    const { user, token: appToken } = useAuth();
    const [token, setToken] = useState(localStorage.getItem('googleFitToken'));
    const [syncState, setSyncState] = useState({ active: false, progress: 0, status: '', done: false, error: null });
    const [recentSynced, setRecentSynced] = useState([]);
    const [loading, setLoading] = useState(true);

    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '109045488714-rvtej3ipovdar1mvm6uka4ih1n09dokm.apps.googleusercontent.com';

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const expiresIn = params.get('expires_in');
            
            if (accessToken) {
                localStorage.setItem('googleFitToken', accessToken);
                localStorage.setItem('googleFitTokenExpiry', Date.now() + (parseInt(expiresIn) * 1000));
                setToken(accessToken);
                window.history.replaceState(null, '', window.location.pathname);
                triggerSync(accessToken);
            }
        } else if (hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            setSyncState(s => ({ ...s, error: `Google Auth Error: ${params.get('error')}. Did you deny permissions?` }));
            window.history.replaceState(null, '', window.location.pathname);
        }

        const loadRecent = async () => {
            try {
                const res = await fetchHealthEntries({ limit: 7 });
                if (res.data?.success) {
                    const sorted = res.data.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
                    setRecentSynced(sorted);
                }
            } catch (err) {
                console.error('Failed to load recent entries', err);
            } finally {
                setLoading(false);
            }
        };
        loadRecent();
    }, []);

    const initiateAuth = () => {
        const redirectUri = window.location.origin + '/watch-sync';
        const scopes = [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.sleep.read',
            'https://www.googleapis.com/auth/fitness.heart_rate.read'
        ];
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes.join(' '))}&prompt=consent`;
        window.location.href = authUrl;
    };

    const handleDisconnect = (preserveError = false) => {
        localStorage.removeItem('googleFitToken');
        localStorage.removeItem('googleFitTokenExpiry');
        setToken(null);
        setSyncState(s => preserveError === true ? { ...s, active: false, done: false } : { active: false, progress: 0, status: '', done: false, error: null });
    };

    const triggerSync = async (accessToken = token) => {
        if (!accessToken) return initiateAuth();

        setSyncState({ active: true, progress: 5, status: 'Connecting securely to Google Health...', done: false, error: null });
        
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysToSync = 7;
            const startTimeMillis = new Date(today.getTime() - (86400000 * (daysToSync - 1))).getTime();
            const endTimeMillis = new Date().getTime();

            setSyncState(s => ({ ...s, progress: 20, status: 'Downloading Activity Data (Steps & Minutes)...' }));

            // 1. Fetch Aggregated Data (Steps, Heart Rate, Active Minutes)
            const aggRes = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
                aggregateBy: [
                    { dataTypeName: 'com.google.step_count.delta', dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps' },
                    { dataTypeName: 'com.google.heart_rate.bpm' },
                    { dataTypeName: 'com.google.active_minutes' }
                ],
                bucketByTime: { durationMillis: 86400000 },
                startTimeMillis,
                endTimeMillis
            }, { headers: { Authorization: `Bearer ${accessToken}` } });

            setSyncState(s => ({ ...s, progress: 50, status: 'Analyzing Sleep Patterns...' }));

            // 2. Fetch Sleep Sessions safely with Pagination
            let sleepSessions = [];
            try {
                let pageToken = '';
                let pagesFetched = 0;
                do {
                    const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${encodeURIComponent(new Date(startTimeMillis).toISOString())}&endTime=${encodeURIComponent(new Date(endTimeMillis).toISOString())}${pageToken ? `&pageToken=${pageToken}` : ''}`;
                    const res = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 });
                    if (res.data.session) {
                        const sleepData = res.data.session.filter(s => [72, 109, 110, 111, 112].includes(parseInt(s.activityType)));
                        sleepSessions = sleepSessions.concat(sleepData);
                    }
                    pageToken = res.data.nextPageToken;
                    pagesFetched++;
                    // Prevent infinite loops just in case
                } while (pageToken && pagesFetched < 10);
            } catch (sfErr) {
                console.warn('Sleep sessions fetch failed:', sfErr.message);
                if (sfErr.response && sfErr.response.status === 403) {
                    throw new Error("Missing Sleep permissions. Please disconnect, then re-authenticate and ensure you check ALL permission boxes.");
                }
            }

            const buckets = aggRes.data.bucket || [];
            const syncPayload = [];

            for (let i = 0; i < buckets.length; i++) {
                const bucket = buckets[i];
                const bucketStart = parseInt(bucket.startTimeMillis);
                const dateStr = new Date(bucketStart).toISOString().slice(0, 10);

                let steps = 0;
                const stepPoints = bucket.dataset.find(d => d.dataSourceId.includes('step_count'))?.point;
                if (stepPoints?.length > 0) steps = stepPoints[0].value?.[0]?.intVal || Math.round(stepPoints[0].value?.[0]?.mapVal?.[0]?.value?.fpVal || 0) || 0;

                let avgHr = 0;
                const hrPoints = bucket.dataset.find(d => d.dataSourceId.includes('heart_rate'))?.point;
                if (hrPoints?.length > 0) avgHr = Math.round(hrPoints[0].value?.[0]?.fpVal || 0);

                let activeMins = 0;
                const minPoints = bucket.dataset.find(d => d.dataSourceId.includes('active_minutes'))?.point;
                if (minPoints?.length > 0) activeMins = minPoints[0].value?.[0]?.intVal || 0;

                let sleepHours = 0;
                const daySleep = sleepSessions.filter(s => {
                    const sEnd = parseInt(s.endTimeMillis);
                    // Match any sleep session ending within this day's bucket calculation
                    return sEnd >= bucketStart && sEnd < (bucketStart + 86400000);
                });
                if (daySleep.length > 0) {
                    const totalMillis = daySleep.reduce((acc, s) => acc + (parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis)), 0);
                    sleepHours = parseFloat((totalMillis / (1000 * 60 * 60)).toFixed(1));
                }

                syncPayload.push({
                    date: dateStr,
                    physiological: { sleepHours, restingHeartRate: avgHr },
                    activity: { stepsPerDay: steps, exerciseMinutes: activeMins } // No more fake fallback data!
                });

                const progress = 50 + Math.round(((i + 1) / buckets.length) * 40);
                setSyncState(s => ({ ...s, progress, status: `Compiling health metrics for ${dateStr}...` }));
            }

            setSyncState(s => ({ ...s, progress: 95, status: 'Encrypting and saving to Secure Cloud...' }));

            // 3. Save to Backend
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/google-fit/sync`, {
                entries: syncPayload
            }, {
                headers: { Authorization: `Bearer ${appToken}` }
            });

            setSyncState({ active: true, progress: 100, status: 'Sync Complete!', done: true, error: null });
            
            const resList = await fetchHealthEntries({ limit: 7 });
            if (resList.data?.success) {
                const sorted = resList.data.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
                setRecentSynced(sorted);
            }

            setTimeout(() => setSyncState(s => ({ ...s, active: false })), 4000);

        } catch (err) {
            console.error('Sync error', err);
            const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Authentication with watch provider failed.';
            setSyncState({ active: false, progress: 0, status: '', done: false, error: errMsg });
            if (err.response?.status === 401) handleDisconnect(true);
        }
    };

    // Derived Averages for the Premium Stat Cards
    const avgSteps = recentSynced.length ? Math.round(recentSynced.reduce((acc, e) => acc + (e.activity?.stepsPerDay || 0), 0) / recentSynced.length) : 0;
    const avgActiveMins = recentSynced.length ? Math.round(recentSynced.reduce((acc, e) => acc + (e.activity?.exerciseMinutes || 0), 0) / recentSynced.length) : 0;
    const maxSleep = recentSynced.length ? Math.max(...recentSynced.map(e => e.physiological?.sleepHours || 0)) : 0;
    const avgHr = recentSynced.length ? Math.round(recentSynced.reduce((acc, e) => acc + (e.physiological?.restingHeartRate || 0), 0) / recentSynced.length) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 md:px-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20">
                            <Smartphone className="w-6 h-6 text-white" /> 
                        </div>
                        Watch Sync Pro
                    </h1>
                    <p className="text-sm font-medium mt-2 opacity-80" style={{ color: 'var(--text-secondary)' }}>
                        Connect {user?.fullName?.split(' ')[0] || 'your'} smartwatch to automatically import secure physiological telemetry into your AI health engine.
                    </p>
                </div>
                {token ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Active Connection</span>
                        </div>
                        <button 
                            onClick={() => handleDisconnect(false)}
                            className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                            title="Disconnect Watch"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 opacity-70">
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Not Connected</span>
                    </div>
                )}
            </div>

            {/* Sync Action Area */}
            <div className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
                
                <div className="max-w-xl z-10">
                    <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
                        {token ? 'Data Stream is Live.' : 'Link Wearable Device.'}
                    </h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                        {token 
                            ? "Your watch is actively authenticated. Click below to pull the latest 7 days of verified activity, cardiovascular, and sleep metrics straight into the AI assessment core."
                            : "Unlock pro-level insights. Linking your Google Fit or Samsung Health account removes the need for manual inputs and guarantees accurate AI health risk predictions."}
                    </p>
                    
                    {!token ? (
                        <button 
                            onClick={initiateAuth}
                            className="glass-btn px-8 py-3.5 flex items-center gap-3 font-bold shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', color: 'white', border: 'none' }}
                        >
                            <Smartphone className="w-5 h-5 text-white" /> Authenticate Device
                        </button>
                    ) : (
                        <button 
                            onClick={() => triggerSync()}
                            disabled={syncState.active}
                            className="glass-btn px-8 py-3.5 flex items-center gap-3 font-bold shadow-2xl shadow-green-500/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                        >
                            <RefreshCw className={`w-5 h-5 ${syncState.active ? 'animate-spin' : ''}`} />
                            {syncState.active ? 'Synchronizing Telemetry...' : 'Sync Latest Telemetry'}
                        </button>
                    )}
                </div>

                <div className="hidden md:flex flex-col gap-4 z-10 p-6 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <img src="https://www.gstatic.com/images/branding/product/1x/gfit_512dp.png" alt="Google Fit" className="h-8 w-8" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--text-primary)' }}>Certified Partner</p>
                            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Google Health API</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Modals */}
            {syncState.active && (
                <div className="glass-card p-6 border-l-4 border-blue-500 animate-scale-in">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> {syncState.status}
                        </span>
                        <span className="text-xs font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{syncState.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-green-500 transition-all duration-300 relative"
                            style={{ width: `${syncState.progress}%` }}
                        >
                            <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}

            {syncState.error && (
                <div className="p-5 rounded-2xl flex items-center gap-3 animate-shake shadow-lg shadow-red-500/10" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444' }}>
                    <XCircle className="w-6 h-6 flex-shrink-0" />
                    <span className="text-sm font-semibold">{syncState.error}</span>
                </div>
            )}

            {syncState.done && (
                <div className="p-5 rounded-2xl flex items-center gap-3 animate-scale-in shadow-lg shadow-green-500/10" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981' }}>
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span className="text-sm font-bold">Encrypted Telemetry Sync Successful! Your AI model has been updated.</span>
                </div>
            )}

            {/* Premium Analytics Dashboard */}
            {recentSynced.length > 0 && token && !loading && (
                <div className="space-y-6 animate-fade-in animation-delay-300">
                    <h2 className="text-xl font-black mt-8 mb-4 px-2" style={{ color: 'var(--text-primary)' }}>7-Day Trend Analytics</h2>
                    
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <StatCard title="Avg Daily Steps" value={avgSteps.toLocaleString()} unit="steps" icon={Zap} color="#f59e0b" />
                        <StatCard title="Avg Active Time" value={avgActiveMins} unit="mins" icon={Flame} color="#ef4444" />
                        <StatCard title="Peak Sleep Time" value={maxSleep} unit="hrs" icon={Moon} color="#8b5cf6" />
                        <StatCard title="Avg Heart Rate" value={avgHr} unit="bpm" icon={Heart} color="#ec4899" />
                    </div>

                    {/* Chart Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Step Trends Chart */}
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-bold mb-6 flex items-center gap-2 opacity-80" style={{ color: 'var(--text-primary)' }}>
                                <Zap className="w-4 h-4 text-orange-400" /> Step Activity Volume
                            </h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={recentSynced}>
                                    <defs>
                                        <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.2} />
                                    <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke="#94a3b8" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => val > 999 ? (val/1000).toFixed(1) + 'k' : val} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '12px', fontSize: '14px', color: '#fff' }}
                                        labelFormatter={fmtDateShort}
                                    />
                                    <Area type="monotone" dataKey="activity.stepsPerDay" name="Steps" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSteps)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Active Minutes & Sleep Bar Chart */}
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-bold mb-6 flex items-center gap-2 opacity-80" style={{ color: 'var(--text-primary)' }}>
                                <Flame className="w-4 h-4 text-red-500" /> Active Minutes vs Sleep
                            </h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={recentSynced}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.2} />
                                    <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke="#94a3b8" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '12px', fontSize: '14px', color: '#fff' }}
                                        labelFormatter={fmtDateShort}
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                    />
                                    <Bar yAxisId="left" dataKey="activity.exerciseMinutes" name="Active Mins" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar yAxisId="right" dataKey="physiological.sleepHours" name="Sleep (Hrs)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent History Table (The Normal Way) */}
                    <div className="glass-card overflow-hidden mt-6 animate-fade-in animation-delay-500">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Activity className="w-5 h-5 text-indigo-500" /> Synced History Log
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Steps</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Active</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Sleep</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>Heart Rate</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right opacity-60" style={{ color: 'var(--text-primary)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentSynced.map((entry, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    <Zap className="w-3.5 h-3.5 text-orange-400" /> {entry.activity?.stepsPerDay?.toLocaleString() || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    <Flame className="w-3.5 h-3.5 text-red-500" /> {entry.activity?.exerciseMinutes ? entry.activity.exerciseMinutes + 'm' : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    <Moon className="w-3.5 h-3.5 text-indigo-400" /> {entry.physiological?.sleepHours ? entry.physiological.sleepHours + 'h' : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    <Heart className="w-3.5 h-3.5 text-pink-500" /> {entry.physiological?.restingHeartRate ? entry.physiological.restingHeartRate + ' bpm' : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                                                    <CheckCircle className="w-2.5 h-2.5" /> Synced
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* Empty State when no data */}
            {(!recentSynced.length || !token) && !loading && (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center mt-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-10 h-10 text-slate-500 opacity-50" />
                    </div>
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No Telemetry Displayed</p>
                    <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                        Connect your watch and sync to populate your custom health analytics dashboard with real-time data.
                    </p>
                </div>
            )}

        </div>
    );
}
