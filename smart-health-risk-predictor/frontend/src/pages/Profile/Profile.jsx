import React, { useState, useRef } from 'react';
import { User, Lock, AlertTriangle, Camera, Save, Eye, EyeOff, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/userService';

const TABS = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const GInput = ({ label, icon: Icon, type = 'text', ...props }) => {
    const [show, setShow] = useState(false);
    const isPass = type === 'password';
    return (
        <div>
            <label className="text-xs font-semibold mb-1.5 block flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                {Icon && <Icon className="w-3.5 h-3.5" />} {label}
            </label>
            <div className="relative">
                <input
                    type={isPass && show ? 'text' : type}
                    className="glass-input"
                    style={{ paddingRight: isPass ? '2.5rem' : '1rem' }}
                    {...props}
                />
                {isPass && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}>
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const calcBMI = (h, w) => h && w ? (w / ((h / 100) ** 2)).toFixed(1) : '—';
const bmiLabel = b => {
    const v = parseFloat(b);
    if (isNaN(v)) return { label: '—', color: 'var(--text-muted)' };
    if (v < 18.5) return { label: 'Underweight', color: '#3b82f6' };
    if (v < 25) return { label: 'Normal', color: '#10b981' };
    if (v < 30) return { label: 'Overweight', color: '#f59e0b' };
    return { label: 'Obese', color: '#ef4444' };
};

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [tab, setTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [savedMessage, setSavedMessage] = useState('Profile updated successfully!');
    const [passError, setPassError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState('');
    const fileRef = useRef();

    const [form, setForm] = useState({
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        username: user?.username ?? '',
        height: user?.height ?? '',
        weight: user?.weight ?? '',
        bloodGroup: user?.bloodGroup ?? '',
        dob: user?.dob ?? '',
        gender: user?.gender ?? '',
        bio: user?.bio ?? '',
        avatarSrc: user?.profileImage ?? null,
    });
    const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setP = (k, v) => setPassForm(f => ({ ...f, [k]: v }));

    const bmi = calcBMI(form.height, form.weight);
    const bmiInfo = bmiLabel(bmi);

    const handleImageChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setF('avatarSrc', ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1200));
        updateUser?.({ ...user, ...form });
        setSavedMessage('Profile updated successfully!');
        setSaving(false); setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handlePasswordUpdate = async () => {
        setSaving(true);
        setPassError('');
        try {
            await changePassword({
                currentPassword: passForm.current,
                newPassword: passForm.next,
                confirmPassword: passForm.confirm
            });
            setSavedMessage('Password updated successfully!');
            setPassForm({ current: '', next: '', confirm: '' });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setPassError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    const initials = form.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
            {/* Profile hero card */}
            <div className="glass-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative flex-shrink-0">
                    {form.avatarSrc ? (
                        <img src={form.avatarSrc} alt="avatar"
                            className="w-20 h-20 rounded-2xl object-cover ring-2"
                            style={{ ringColor: 'var(--accent-blue)' }} />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {initials}
                        </div>
                    )}
                    <button onClick={() => fileRef.current.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                        style={{ background: '#3b82f6' }}>
                        <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{form.fullName || 'Your Name'}</h1>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{form.email || 'your@email.com'}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        <span className="text-xs px-3 py-1 rounded-full capitalize font-medium"
                            style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>{user?.role || 'student'}</span>
                        <span className="text-xs px-3 py-1 rounded-full font-bold"
                            style={{ background: `${bmiInfo.color}15`, color: bmiInfo.color }}>
                            BMI {bmi} · {bmiInfo.label}
                        </span>
                    </div>
                </div>
                {/* BMI mini card */}
                <div className="glass-sm p-3 text-center min-w-[90px]">
                    <div className="flex items-center justify-center mb-1">
                        <Shield className="w-5 h-5" style={{ color: bmiInfo.color }} />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: bmiInfo.color }}>{bmi}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>BMI</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200"
                            style={{
                                background: active ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'var(--glass-bg)',
                                color: active ? 'white' : 'var(--text-muted)',
                                border: '1px solid var(--glass-border)',
                                boxShadow: active ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                            }}>
                            <Icon className="w-3.5 h-3.5" /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Success banner */}
            {saved && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-scale-in"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{savedMessage}</span>
                </div>
            )}

            {/* Tab content */}
            {tab === 'profile' && (
                <div className="glass-card p-6 space-y-4 animate-scale-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <GInput label="Full Name" icon={User} value={form.fullName} onChange={e => setF('fullName', e.target.value)} placeholder="Jane Doe" />
                        <GInput label="Username" value={form.username} onChange={e => setF('username', e.target.value)} placeholder="janedoe" />
                        <GInput label="Email" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="jane@example.com" />
                        <GInput label="Phone" type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+94 77 XXX XXXX" />
                        <GInput label="Date of Birth" type="date" value={form.dob} onChange={e => setF('dob', e.target.value)} />
                        <div>
                            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Gender</label>
                            <select className="glass-input" value={form.gender} onChange={e => setF('gender', e.target.value)}>
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <GInput label="Height (cm)" type="number" value={form.height} onChange={e => setF('height', e.target.value)} placeholder="175" />
                        <GInput label="Weight (kg)" type="number" value={form.weight} onChange={e => setF('weight', e.target.value)} placeholder="70" />
                        <GInput label="Blood Group" value={form.bloodGroup} onChange={e => setF('bloodGroup', e.target.value)} placeholder="A+" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Bio</label>
                        <textarea rows={3} className="glass-input resize-none" placeholder="Short bio…"
                            value={form.bio} onChange={e => setF('bio', e.target.value)} />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSave} disabled={saving}
                            className="glass-btn px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-70">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </div>
            )}

            {tab === 'password' && (
                <div className="glass-card p-6 space-y-4 animate-scale-in">
                    <GInput label="Current Password" icon={Lock} type="password" value={passForm.current} onChange={e => setP('current', e.target.value)} placeholder="Current password" />
                    <GInput label="New Password" type="password" value={passForm.next} onChange={e => setP('next', e.target.value)} placeholder="Min. 8 characters" />
                    <GInput label="Confirm New Password" type="password" value={passForm.confirm} onChange={e => setP('confirm', e.target.value)} placeholder="Repeat new password" />
                    {passForm.next && passForm.confirm && passForm.next !== passForm.confirm && (
                        <p className="text-xs text-red-400">Passwords do not match</p>
                    )}
                    {passError && (
                        <p className="text-xs text-red-400">{passError}</p>
                    )}
                    <div className="flex justify-end">
                        <button className="glass-btn px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-70"
                            onClick={handlePasswordUpdate}
                            disabled={!passForm.current || !passForm.next || passForm.next !== passForm.confirm || saving}>
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : <><Lock className="w-4 h-4" /> Update Password</>}
                        </button>
                    </div>
                </div>
            )}

            {tab === 'danger' && (
                <div className="glass-card p-6 space-y-4 animate-scale-in"
                    style={{ border: '1px solid rgba(239,68,68,0.25)', boxShadow: 'var(--glass-shadow), 0 0 30px rgba(239,68,68,0.1)' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Danger Zone</h2>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Permanently deactivate your account. All data will be deleted and this action <strong>cannot be undone</strong>.
                    </p>
                    <div>
                        <label className="text-xs font-semibold mb-1.5 block text-red-400">
                            Type your username to confirm: <strong>{form.username || user?.username}</strong>
                        </label>
                        <input className="glass-input" placeholder="Enter your username"
                            value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)}
                            style={{ borderColor: confirmDelete ? (confirmDelete === (form.username || user?.username) ? 'rgba(239,68,68,0.5)' : '') : '' }} />
                    </div>
                    <button
                        disabled={confirmDelete !== (form.username || user?.username)}
                        className="w-full py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' }}>
                        Deactivate Account Permanently
                    </button>
                </div>
            )}
        </div>
    );
}
