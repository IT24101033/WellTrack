import React, { useState, useEffect, useCallback } from 'react';
import {
    Bell, Pill, Calendar, Heart, Settings, Trash2, Check,
    Sun, Moon, Star, X, CreditCard, Lock, Loader, UploadCloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import GooglePayButton from '@google-pay/button-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification as deleteNotifApi,
    clearAllNotifications as clearAllNotifApi,
    sendTestNotification,
} from '../../services/notificationService';

/* ─── constants ─────────────────────────────────────────────── */
const TYPE_ICON = { appointment: Calendar, medication: Pill, wellness: Heart, system: Bell };
const TYPE_COLOR = { appointment: '#3B82F6', medication: '#8B5CF6', wellness: '#10B981', system: '#F59E0B' };

const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
};

/* ─── Toggle ─────────────────────────────────────────────────── */
function Toggle({ value, onChange }) {
    return (
        <button
            onClick={() => onChange(!value)}
            style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: value ? 'linear-gradient(135deg,#3B82F6,#10B981)' : 'rgba(148,163,184,0.3)', position: 'relative', transition: 'background .3s', flexShrink: 0 }}
            aria-pressed={value}
        >
            <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
        </button>
    );
}

/* ─── Notification card ──────────────────────────────────────── */
function NotifCard({ n, dark, t, onRead, onDelete }) {
    const [open, setOpen] = useState(false);
    const TypeIcon = TYPE_ICON[n.type] || Bell;
    const color = TYPE_COLOR[n.type] || '#3B82F6';
    const unread = n.status === 'unread';

    return (
        <div
            style={{
                background: t.card, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid ' + t.border, borderRadius: 16,
                borderLeft: unread ? '4px solid ' + color : '4px solid transparent',
                boxShadow: unread ? '0 0 18px ' + color + '33, 0 4px 16px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.1)',
                padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
                transition: 'transform .2s', position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TypeIcon size={18} style={{ color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{n.title}</span>
                    <span style={{ fontSize: 11, color: t.sub, whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                </div>
                <p style={{ margin: '4px 0 8px', color: t.sub, fontSize: 13, lineHeight: 1.5 }}>{n.message}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: unread ? color + '22' : t.input, color: unread ? color : t.sub, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {unread ? '● Unread' : 'Read'}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: color + '15', color }}>{n.type}</span>
                </div>
            </div>
            <div style={{ position: 'relative' }}>
                <button onClick={e => { e.stopPropagation(); setOpen(!open); }} style={{ background: 'none', border: 'none', color: t.sub, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, fontSize: 18, lineHeight: 1 }}>···</button>
                {open && (
                    <div style={{ position: 'absolute', right: 0, top: 30, zIndex: 200, background: dark ? '#1E293B' : '#fff', border: '1px solid ' + t.border, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', overflow: 'hidden', minWidth: 150 }}>
                        {unread && (
                            <button onClick={() => { onRead(n._id); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
                                <Check size={13} /> Mark as Read
                            </button>
                        )}
                        <button onClick={() => { onDelete(n._id); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Plan pricing card ──────────────────────────────────────── */
function PlanCard({ plan, t, currentPlan, onSelectPlan }) {
    const current = currentPlan === plan;
    const recommended = plan === 'Premium';
    const isFree = plan === 'Free';
    return (
        <div
            style={{
                background: t.card, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid ' + (recommended ? '#3B82F6' : t.border), borderRadius: 20,
                boxShadow: recommended ? '0 0 30px rgba(59,130,246,0.25), 0 8px 32px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.1)',
                padding: 28, flex: 1, minWidth: 200, position: 'relative', transition: 'transform .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
            {recommended && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#3B82F6,#10B981)', borderRadius: 20, padding: '3px 14px', fontSize: 11, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    RECOMMENDED
                </div>
            )}
            <div style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 4 }}>{plan}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#3B82F6', marginBottom: 16 }}>
                {PLAN_PRICES[plan]}<span style={{ fontSize: 13, color: t.sub, fontWeight: 400 }}>/mo</span>
            </div>
            <div style={{ marginBottom: 20 }}>
                {PLAN_FEATURES[plan].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: t.sub, fontSize: 13 }}>
                        <Check size={13} style={{ color: '#10B981', flexShrink: 0 }} />{f}
                    </div>
                ))}
            </div>
            <button
                onClick={() => {
                    if (current) return;
                    if (isFree) {
                        // Directly trigger downgrade
                        onSelectPlan('Free_Direct');
                    } else {
                        onSelectPlan(plan);
                    }
                }}
                disabled={current}
                style={{
                    width: '100%', padding: '10px 0', borderRadius: 12, border: 'none',
                    cursor: current ? 'default' : 'pointer',
                    background: current ? t.border : isFree ? t.border : 'linear-gradient(135deg,#3B82F6,#10B981)',
                    color: current ? t.sub : isFree ? t.text : '#fff', fontWeight: 700, fontSize: 13,
                    transition: 'opacity .2s',
                }}
            >
                {current ? 'Current Plan' : isFree ? 'Downgrade to Free' : 'Get ' + plan}
            </button>
        </div>
    );
}

/* ─── Preference row ─────────────────────────────────────────── */
function PrefRow({ label, field, prefs, setPrefs, t }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid ' + t.border }}>
            <span style={{ color: t.text, fontSize: 14 }}>{label}</span>
            <Toggle value={prefs[field] ?? false} onChange={v => setPrefs(p => ({ ...p, [field]: v }))} />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
export default function Notifications() {
    const { token } = useAuth();
    const { isDark: dark, toggleTheme } = useTheme();
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [filter, setFilter] = useState('all');

    const [notifs, setNotifs] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const [subscription, setSubscription] = useState(null);

    const [prefs, setPrefs] = useState(null);
    const [prefsTmp, setPrefsTmp] = useState(null);
    const [prefSaving, setPrefSaving] = useState(false);
    const [prefMsg, setPrefMsg] = useState('');

    /* payment gateway */
    const [payPlan, setPayPlan] = useState(null); // null = closed, 'Premium'/'Pro' = open

    /* test feature */
    const [testEmail, setTestEmail] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [testMsg, setTestMsg] = useState('');

    /* ── theme ── */
    const t = dark ? {
        bg: '#0F172A', card: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)',
        text: '#F1F5F9', sub: '#94A3B8', input: 'rgba(255,255,255,0.07)',
    } : {
        bg: '#F0F4F8', card: 'rgba(255,255,255,0.80)', border: 'rgba(0,0,0,0.08)',
        text: '#0F172A', sub: '#475569', input: 'rgba(0,0,0,0.05)',
    };
    const glass = { background: t.card, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid ' + t.border, borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' };

    /* ── fetch ── */
    const loadNotifs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (['read', 'unread'].includes(filter)) params.status = filter;
            if (['appointment', 'medication', 'wellness', 'system'].includes(filter)) params.type = filter;
            const res = await fetchNotifications(params);
            if (res.data.success) {
                setNotifs(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (_e) { /* silent */ }
        setLoading(false);
    }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadSub = useCallback(async () => {
        try {
            const r = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/subscription', {
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            });
            const d = await r.json();
            if (d.success) setSubscription(d.subscription);
        } catch (_e) { /* silent */ }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadPrefs = useCallback(async () => {
        try {
            const r = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/preferences', {
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            });
            const d = await r.json();
            if (d.success) { setPrefs(d.preferences); setPrefsTmp(d.preferences); }
        } catch (_e) { /* silent */ }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { loadNotifs(); }, [loadNotifs]);
    useEffect(() => { loadSub(); }, [loadSub]);
    useEffect(() => { loadPrefs(); }, [loadPrefs]);

    /* ── actions ── */
    const markRead = async (id) => {
        await markNotificationRead(id);
        setNotifs(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
        setUnreadCount(c => Math.max(0, c - 1));
    };
    const deleteOne = async (id) => {
        await deleteNotifApi(id);
        setNotifs(prev => prev.filter(n => n._id !== id));
    };
    const markAllRead = async () => {
        await markAllNotificationsRead();
        setNotifs(prev => prev.map(n => ({ ...n, status: 'read' })));
        setUnreadCount(0);
    };
    const clearAll = async () => {
        await clearAllNotifApi();
        setNotifs([]);
        setUnreadCount(0);
    };

    const cancelPlan = async () => {
        const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const hdrs = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
        const r = await fetch(BASE + '/subscription', { method: 'DELETE', headers: hdrs });
        const d = await r.json();
        if (d.success) setSubscription(d.subscription);
    };

    /* called after payment success */
    const upgradePlan = async (planName, paymentData = {}) => {
        const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        let body;
        let headers = { Authorization: 'Bearer ' + token };

        if (paymentData.method === 'receipt' && paymentData.file) {
            body = new FormData();
            body.append('planName', planName);
            body.append('paymentMethod', 'receipt');
            body.append('receipt', paymentData.file);
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({ 
                planName, 
                paymentMethod: paymentData.method || 'card' 
            });
        }

        const r = await fetch(BASE + '/subscription', { method: 'PUT', headers, body });
        const d = await r.json();
        if (d.success) {
            setSubscription(d.subscription);
            return true;
        }
        return false;
    };

    const savePrefs = async () => {
        setPrefSaving(true);
        const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const hdrs = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
        const body = { ...prefsTmp };
        delete body._id; delete body.userId; delete body.__v;
        const r = await fetch(BASE + '/preferences', { method: 'PUT', headers: hdrs, body: JSON.stringify(body) });
        const d = await r.json();
        if (d.success) { setPrefs(d.preferences); setPrefMsg('Preferences saved!'); }
        else setPrefMsg('Failed to save.');
        setPrefSaving(false);
        setTimeout(() => setPrefMsg(''), 2500);
    };

    const handleTestFeature = async () => {
        if (!testEmail && !testPhone) {
            setTestMsg('Please provide at least an email or phone number.');
            setTimeout(() => setTestMsg(''), 3000);
            return;
        }
        setTestLoading(true);
        setTestMsg('');
        try {
            const res = await sendTestNotification({ email: testEmail, phone: testPhone });
            if (res.data.success) {
                setTestMsg(res.data.message);
            } else {
                setTestMsg('Failed to process test.');
            }
        } catch (err) {
            setTestMsg('Error: ' + (err.response?.data?.message || err.message));
        }
        setTestLoading(false);
        setTimeout(() => setTestMsg(''), 5000);
    };

    /* ── render ── */
    return (
        <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: 'Inter, -apple-system, sans-serif', transition: 'background .3s' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg,#3B82F6,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Notifications &amp; Alerts
                        </h1>
                        <p style={{ margin: '4px 0 0', color: t.sub, fontSize: 13 }}>
                            {unreadCount > 0 ? unreadCount + ' unread' : 'All caught up!'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={toggleTheme} style={{ ...glass, padding: '8px 14px', border: '1px solid ' + t.border, cursor: 'pointer', color: t.text, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            {dark ? <Sun size={15} /> : <Moon size={15} />}{dark ? 'Light' : 'Dark'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, color: t.sub }}>Alerts</span>
                            <Toggle value={notifEnabled} onChange={setNotifEnabled} />
                        </div>
                    </div>
                </div>

                {/* Filter bar */}
                <div style={{ ...glass, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                    <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: t.input, border: '1px solid ' + t.border, borderRadius: 10, padding: '7px 12px', color: t.text, fontSize: 13, cursor: 'pointer', outline: 'none', flex: 1, minWidth: 140 }}>
                        <option value="all">All Notifications</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="system">System Alerts</option>
                        <option value="medication">Medication</option>
                        <option value="appointment">Appointments</option>
                        <option value="wellness">Wellness Tips</option>
                    </select>
                    <button onClick={markAllRead} style={{ background: 'rgba(59,130,246,0.15)', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#3B82F6', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Mark All Read</button>
                    <button onClick={clearAll} style={{ background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#EF4444', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
                </div>

                {/* Notification list */}
                <section style={{ marginBottom: 40 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: t.sub }}>Loading…</div>
                    ) : notifs.length === 0 ? (
                        <div style={{ ...glass, padding: 60, textAlign: 'center', color: t.sub }}>
                            <Bell size={44} style={{ margin: '0 auto 12px', display: 'block', color: t.sub }} />
                            No notifications found
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {notifs.map(n => (
                                <NotifCard key={n._id} n={n} dark={dark} t={t} onRead={markRead} onDelete={deleteOne} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Preferences */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: t.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Settings size={18} /> Notification Preferences
                    </h2>
                    <div style={{ ...glass, padding: '8px 22px 22px' }}>
                        {prefsTmp && (
                            <>
                                <PrefRow label="📧 Email Notifications" field="emailNotifications" prefs={prefsTmp} setPrefs={setPrefsTmp} t={t} />
                                <PrefRow label="📱 SMS Alerts" field="smsAlerts" prefs={prefsTmp} setPrefs={setPrefsTmp} t={t} />
                                <PrefRow label="🔔 Push Notifications" field="pushNotifications" prefs={prefsTmp} setPrefs={setPrefsTmp} t={t} />
                                <PrefRow label="🤖 AI Risk Alert Notifications" field="aiRiskAlerts" prefs={prefsTmp} setPrefs={setPrefsTmp} t={t} />
                                <PrefRow label="📊 Weekly Health Summary" field="weeklyHealthSummary" prefs={prefsTmp} setPrefs={setPrefsTmp} t={t} />
                                <PrefRow label="💊 Medication Reminders" field="medicationReminders" prefs={prefsTmp} setPrefs={setPrefsTmp} t={t} />
                            </>
                        )}
                        <div style={{ display: 'flex', gap: 10, marginTop: 22, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button onClick={savePrefs} disabled={prefSaving} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#10B981)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                {prefSaving ? 'Saving…' : 'Save Preferences'}
                            </button>
                            <button onClick={() => { setPrefsTmp(prefs); setPrefMsg(''); }} style={{ padding: '10px 24px', borderRadius: 12, border: '1px solid ' + t.border, background: 'none', color: t.text, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                Reset
                            </button>
                            {prefMsg && <span style={{ fontSize: 12, color: prefMsg.includes('!') ? '#10B981' : '#EF4444' }}>{prefMsg}</span>}
                        </div>
                    </div>
                </section>

                {/* Test Feature */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: t.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bell size={18} /> Test Feature
                    </h2>
                    <div style={{ ...glass, padding: '22px' }}>
                        <p style={{ margin: '0 0 16px', color: t.sub, fontSize: 13 }}>
                            Use this section to test the Email (Nodemailer) and SMS (Twilio) configurations. Provide your email and phone number, then click Test Feature.
                        </p>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label style={{ fontSize: 13, color: t.sub, marginBottom: 6, display: 'block' }}>Email Address</label>
                                <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="example@gmail.com" style={{ width: '100%', background: t.input, border: '1px solid ' + t.border, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label style={{ fontSize: 13, color: t.sub, marginBottom: 6, display: 'block' }}>Phone Number</label>
                                <input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="+1234567890" style={{ width: '100%', background: t.input, border: '1px solid ' + t.border, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={handleTestFeature} disabled={testLoading} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#10B981)', color: '#fff', fontWeight: 700, cursor: testLoading ? 'default' : 'pointer', fontSize: 13, opacity: testLoading ? 0.7 : 1 }}>
                                {testLoading ? 'Sending...' : 'Test Feature'}
                            </button>
                            {testMsg && <span style={{ fontSize: 13, color: testMsg.includes('Failed') || testMsg.includes('Error') ? '#EF4444' : '#10B981' }}>{testMsg}</span>}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
