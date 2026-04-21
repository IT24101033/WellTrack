import React, { useState, useEffect, useCallback } from 'react';
import {
    Bell, Pill, Calendar, Heart, Settings, Trash2, Check,
    Sun, Moon, Star, X, CreditCard, Lock, Loader, UploadCloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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

const PLAN_PRICES = { Free: 'Rs 0', Premium: 'Rs 300', Pro: 'Rs 500' };
const PLAN_AMOUNTS = { Free: 0, Premium: 300, Pro: 500 };
const PLAN_FEATURES = {
    Free: ['Basic notifications', 'Daily health summary'],
    Premium: ['Basic notifications', 'Daily health summary', 'Medication alerts', 'Appointment reminders', 'Weekly reports'],
    Pro: ['Basic notifications', 'Daily health summary', 'Medication alerts', 'Appointment reminders', 'Weekly reports', 'Real-time AI risk alerts', 'Advanced analytics', 'Priority support'],
};

const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
};

/* ─── format card number with spaces ────────────────────────── */
const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };

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

/* ─── Payment Modal ──────────────────────────────────────────── */
function PaymentModal({ plan, onClose, onSuccess }) {
    const [method, setMethod] = useState('card'); // 'card' | 'receipt'
    
    // Card state
    const [name, setName] = useState('');
    const [card, setCard] = useState('');
    const [exp, setExp] = useState('');
    const [cvv, setCvv] = useState('');
    const [flip, setFlip] = useState(false);
    
    // Receipt state
    const [receiptFile, setReceiptFile] = useState(null);
    const [preview, setPreview] = useState(null);
    
    const [status, setStatus] = useState('idle'); // idle | processing | success | error

    const amount = PLAN_AMOUNTS[plan];
    const masked = card ? card.padEnd(19, ' ').replace(/\d(?=.{4})/g, '•') : '•••• •••• •••• ••••';
    const displayName = name || 'CARDHOLDER NAME';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReceiptFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handlePay = async () => {
        if (method === 'card') {
            if (!name || card.replace(/\s/g, '').length < 16 || exp.length < 5 || cvv.length < 3) {
                setStatus('error'); return;
            }
        } else {
            if (!receiptFile) {
                setStatus('error'); return;
            }
        }

        setStatus('processing');
        if (method === 'card') {
            // simulate 2.4 s payment delay
            await new Promise(r => setTimeout(r, 2400));
        }

        const ok = await onSuccess(plan, { 
            method, 
            file: method === 'receipt' ? receiptFile : null 
        });

        if (ok) {
            setStatus('success');
            await new Promise(r => setTimeout(r, 1600));
            onClose();
        } else {
            setStatus('error');
        }
    };

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, width: '100%', maxWidth: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#1B2B4B)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 2 }}>Upgrade to</div>
                        <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg,#3B82F6,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{plan} Plan</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9' }}>Rs {amount.toFixed(0)}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>per month</div>
                    </div>
                </div>

                {/* Method Tabs */}
                <div style={{ display: 'flex', padding: '16px 24px 0', gap: 12 }}>
                    <button onClick={() => setMethod('card')} style={{ flex: 1, padding: '10px 0', background: method === 'card' ? 'rgba(59,130,246,0.15)' : 'transparent', border: '1px solid ' + (method === 'card' ? '#3B82F6' : 'rgba(255,255,255,0.1)'), borderRadius: 10, color: method === 'card' ? '#3B82F6' : '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}>
                        <CreditCard size={15} /> Card (Demo)
                    </button>
                    <button onClick={() => setMethod('receipt')} style={{ flex: 1, padding: '10px 0', background: method === 'receipt' ? 'rgba(16,185,129,0.15)' : 'transparent', border: '1px solid ' + (method === 'receipt' ? '#10B981' : 'rgba(255,255,255,0.1)'), borderRadius: 10, color: method === 'receipt' ? '#10B981' : '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}>
                        <UploadCloud size={15} /> Bank Transfer
                    </button>
                </div>

                {/* Content */}
                {method === 'card' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 24px 0' }}>
                            <div
                                style={{
                                    width: 320, height: 185, borderRadius: 18, position: 'relative', cursor: 'pointer',
                                    background: flip
                                        ? 'linear-gradient(135deg,#1E293B,#374151)'
                                        : 'linear-gradient(135deg,#1E3A6E,#2563EB,#7C3AED)',
                                    boxShadow: '0 20px 60px rgba(37,99,235,0.4)',
                                    transition: 'transform .6s',
                                    transform: flip ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    transformStyle: 'preserve-3d',
                                    fontFamily: 'monospace',
                                }}
                                onClick={() => setFlip(!flip)}
                            >
                                {/* Front */}
                                <div style={{ position: 'absolute', inset: 0, padding: 22, backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <CreditCard size={32} style={{ color: 'rgba(255,255,255,0.8)' }} />
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif' }}>HealthPay</div>
                                    </div>
                                    {/* Chip */}
                                    <div style={{ width: 42, height: 32, borderRadius: 6, background: 'linear-gradient(135deg,#D4A843,#F0C040)', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.3)' }} />
                                    <div>
                                        <div style={{ fontSize: 18, letterSpacing: 3, color: '#fff', marginBottom: 14 }}>{masked}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>CARD HOLDER</div>
                                                <div style={{ fontSize: 12, color: '#fff', letterSpacing: 1 }}>{displayName.toUpperCase().slice(0, 22)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>EXPIRES</div>
                                                <div style={{ fontSize: 12, color: '#fff' }}>{exp || 'MM/YY'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Back */}
                                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ background: '#1a1a2e', height: 44, margin: '0 0 16px' }} />
                                        <div style={{ margin: '0 22px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 14px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif' }}>CVV</div>
                                            <div style={{ fontSize: 14, color: '#fff', letterSpacing: 4 }}>{cvv ? '•'.repeat(cvv.length) : '•••'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(148,163,184,0.6)', paddingTop: 6 }}>Click card to flip</div>

                        {/* Form */}
                        <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Cardholder */}
                            <div>
                                <label style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, display: 'block' }}>CARDHOLDER NAME</label>
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            {/* Card number */}
                            <div>
                                <label style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, display: 'block' }}>CARD NUMBER</label>
                                <div style={{ position: 'relative' }}>
                                    <input value={card} onChange={e => setCard(fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px 10px 40px', color: '#F1F5F9', fontSize: 14, outline: 'none', letterSpacing: 2, boxSizing: 'border-box' }} />
                                    <CreditCard size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                                </div>
                            </div>

                            {/* Expiry + CVV */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, display: 'block' }}>EXPIRY DATE</label>
                                    <input value={exp} onChange={e => setExp(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, display: 'block' }}>CVV</label>
                                    <input
                                        value={cvv}
                                        onChange={e => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
                                        onFocus={() => setFlip(true)} onBlur={() => setFlip(false)}
                                        placeholder="•••" maxLength={4} type="password"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16 }}>
                            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>BANK DETAILS</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#F1F5F9', marginBottom: 4 }}>
                                <span style={{ color: '#94A3B8' }}>Bank</span> <span>HealthyBank Ltd.</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#F1F5F9', marginBottom: 4 }}>
                                <span style={{ color: '#94A3B8' }}>Account</span> <span style={{ fontFamily: 'monospace', letterSpacing: 1 }}>100-200-3000</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#F1F5F9' }}>
                                <span style={{ color: '#94A3B8' }}>Branch</span> <span>Colombo Main</span>
                            </div>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, display: 'block' }}>UPLOAD DEPOSIT SLIP / RECEIPT</label>
                            <label style={{ border: '2px dashed ' + (receiptFile ? '#10B981' : 'rgba(255,255,255,0.15)'), borderRadius: 12, background: 'rgba(255,255,255,0.02)', padding: preview ? 6 : 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                                {preview ? (
                                    <div style={{ position: 'relative', width: '100%', height: 140 }}>
                                        <img src={preview} alt="Receipt Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 20, fontSize: 11, color: '#fff' }}>Change Photo</div>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud size={32} style={{ color: '#94A3B8', marginBottom: 8 }} />
                                        <div style={{ fontSize: 13, color: '#F1F5F9' }}>Click to browse your files</div>
                                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>JPG, PNG or PDF (Max 3MB)</div>
                                    </>
                                )}
                                <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                )}

                {/* Error & Pay Action */}
                <div style={{ padding: '0 24px 24px' }}>
                    {status === 'error' && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#EF4444', marginBottom: 16 }}>
                            {method === 'card' ? 'Please fill in all card details correctly.' : 'Please upload your receipt to proceed.'}
                        </div>
                    )}

                    <button
                        onClick={handlePay}
                        disabled={status === 'processing' || status === 'success'}
                        style={{
                            width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: status === 'processing' || status === 'success' ? 'default' : 'pointer',
                            background: status === 'success' ? 'linear-gradient(135deg,#10B981,#059669)' : (method === 'card' ? 'linear-gradient(135deg,#3B82F6,#7C3AED)' : 'linear-gradient(135deg,#10B981,#059669)'),
                            color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'opacity .2s,background .4s',
                            opacity: status === 'processing' ? 0.85 : 1,
                        }}
                    >
                        {status === 'processing' ? (
                            <><Loader size={17} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing…</>
                        ) : status === 'success' ? (
                            <><Check size={17} /> Upgrade Successful!</>
                        ) : (
                            <><Lock size={15} /> {method === 'card' ? 'Pay' : 'Confirm'} {PLAN_PRICES[plan]}/mo</>
                        )}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 12 }}>
                        <Lock size={10} /> 256-bit SSL encrypted · {method === 'card' ? 'Simulated payment' : 'Secure upload'}
                    </div>
                </div>

                {/* Close */}
                <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={15} />
                </button>
            </div>

            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
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

                {/* Subscription */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: t.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Star size={18} /> Subscription
                    </h2>

                    {subscription && (
                        <div style={{ ...glass, padding: 24, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: t.sub, marginBottom: 2 }}>Current Plan</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg,#3B82F6,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {subscription.planName}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ padding: '3px 12px', borderRadius: 20, background: subscription.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: subscription.status === 'active' ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                                        {subscription.status ? subscription.status.toUpperCase() : ''}
                                    </span>
                                    <div style={{ color: t.sub, fontSize: 11, marginTop: 4 }}>
                                        Expires: {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                                {(subscription.features || []).map(f => (
                                    <span key={f} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: 11 }}>{f}</span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button onClick={() => setPayPlan(subscription.planName === 'Premium' ? 'Pro' : 'Premium')} style={{ padding: '9px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#10B981)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CreditCard size={14} /> Upgrade Plan
                                </button>
                                <button onClick={cancelPlan} style={{ padding: '9px 20px', borderRadius: 12, border: '1px solid #EF4444', background: 'none', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                    Cancel Plan
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pricing cards */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {['Free', 'Premium', 'Pro'].map(p => (
                            <PlanCard 
                                key={p} plan={p} t={t} currentPlan={subscription ? subscription.planName : ''} 
                                onSelectPlan={(selected) => {
                                    if (selected === 'Free_Direct') {
                                        upgradePlan('Free');
                                    } else {
                                        setPayPlan(selected);
                                    }
                                }} 
                            />
                        ))}
                    </div>
                </section>

            </div>

            {/* Payment modal */}
            {payPlan && (
                <PaymentModal
                    plan={payPlan}
                    onClose={() => setPayPlan(null)}
                    onSuccess={upgradePlan}
                />
            )}
        </div>
    );
}
