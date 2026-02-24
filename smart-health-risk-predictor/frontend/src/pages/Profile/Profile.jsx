import { useState, useEffect, useRef } from 'react';
import { User, Mail, Hash, Weight, Ruler, Calendar, Camera, Lock, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword, deleteProfile } from '../../services/userService';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500';

export default function Profile() {
    const { user: authUser, updateUser, logout } = useAuth();
    const { toast } = useToast();
    const fileRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [preview, setPreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [form, setForm] = useState({ fullName: '', age: '', gender: '', height: '', weight: '', universityId: '' });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwError, setPwError] = useState('');
    const [pwSaving, setPwSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await getProfile();
                const u = res.data.user;
                setProfile(u);
                setForm({
                    fullName: u.fullName || '',
                    age: u.age || '',
                    gender: u.gender || '',
                    height: u.height || '',
                    weight: u.weight || '',
                    universityId: u.universityId || '',
                });
            } catch {
                toast.error('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const bmi = form.weight && form.height
        ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
        : null;

    const bmiLabel = bmi
        ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
        : null;
    const bmiColor = bmi
        ? bmi < 18.5 ? 'text-blue-600' : bmi < 25 ? 'text-green-600' : bmi < 30 ? 'text-yellow-600' : 'text-red-600'
        : '';

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (imageFile) fd.append('profileImage', imageFile);
            const res = await updateProfile(fd);
            setProfile(res.data.user);
            updateUser({ ...authUser, ...res.data.user });
            toast.success('Profile updated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwError('');
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError('New passwords do not match.');
            return;
        }
        try {
            setPwSaving(true);
            await changePassword(pwForm);
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success('Password changed successfully!');
        } catch (err) {
            setPwError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setPwSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!confirm('Deactivate your account? You will be logged out.')) return;
        try {
            await deleteProfile();
            toast.success('Account deactivated.');
            logout();
        } catch {
            toast.error('Failed to deactivate account.');
        }
    };

    if (loading) return <Spinner fullScreen />;

    const avatarSrc = preview
        || (profile?.profileImage ? `${API_BASE}${profile.profileImage}` : null);
    const initials = profile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your personal information and account settings</p>
            </div>

            {/* Profile Card Top */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                    {avatarSrc
                        ? <img src={avatarSrc} alt="Avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100 shadow" />
                        : <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-100 shadow">{initials}</div>
                    }
                    <button onClick={() => fileRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-700 shadow-md transition">
                        <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                {/* Info */}
                <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{profile?.fullName}</h2>
                    <p className="text-gray-500 text-sm">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${profile?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            <Activity className="w-3 h-3" />
                            {profile?.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${profile?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {profile?.isActive ? '● Active' : '● Inactive'}
                        </span>
                    </div>
                    {bmi && (
                        <p className="text-sm mt-2 text-gray-600">BMI: <span className={`font-bold ${bmiColor}`}>{bmi}</span> <span className="text-gray-400">({bmiLabel})</span></p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
                {[['profile', 'Profile Info'], ['password', 'Password'], ['danger', 'Danger Zone']].map(([key, label]) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === key ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Profile Info Tab ── */}
            {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="number" min="0" max="150" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                            <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                                className={inputClass}>
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Height (cm)</label>
                            <div className="relative">
                                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="number" min="0" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
                            <div className="relative">
                                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="number" min="0" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">University ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.universityId} onChange={e => setForm(p => ({ ...p, universityId: e.target.value }))}
                                    placeholder="e.g. IT24101033"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                        </div>
                        {/* Read-only */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={profile?.email || ''} disabled className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500`} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                            <input value={profile?.role || ''} disabled className={inputClass + ' capitalize'} />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition flex items-center gap-2 shadow-sm">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            )}

            {/* ── Password Tab ── */}
            {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md">
                    <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-600" /> Change Password
                    </h3>
                    {pwError && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
                            <AlertCircle className="w-4 h-4" />{pwError}
                        </div>
                    )}
                    {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
                        <div key={field} className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {['Current Password', 'New Password', 'Confirm New Password'][i]}
                            </label>
                            <input type="password" value={pwForm[field]}
                                onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                                className={inputClass} />
                        </div>
                    ))}
                    <button type="submit" disabled={pwSaving}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition flex items-center gap-2 shadow-sm">
                        {pwSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating…</> : <><Lock className="w-4 h-4" /> Update Password</>}
                    </button>
                </form>
            )}

            {/* ── Danger Zone Tab ── */}
            {activeTab === 'danger' && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
                    <h3 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Danger Zone
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">These actions are irreversible. Please proceed with caution.</p>
                    <div className="border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">Deactivate Account</p>
                            <p className="text-xs text-gray-500 mt-0.5">Your account will be deactivated and you'll be logged out.</p>
                        </div>
                        <button onClick={handleDeactivate}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition shadow-sm shrink-0">
                            Deactivate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
