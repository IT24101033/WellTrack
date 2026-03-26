import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, Lock, Mail, User, Hash, AlertCircle, CheckCircle, Phone, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { register as registerApi, sendAdminPin as sendPinApi } from '../../services/authService';

const inputClass = 'w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: '', email: '', password: '', confirmPassword: '', role: 'student', phoneNumber: ''
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [showOtp, setShowOtp] = useState(false);
    const [adminPin, setAdminPin] = useState('');

    const handleChange = (e) => {
        setError('');
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Password strength
    const strength = (() => {
        const p = form.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 6) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    })();
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'][strength];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (form.role === 'admin' && !showOtp) {
            if (!form.phoneNumber) {
                setError('Phone number is required for Admin registration.');
                return;
            }
            try {
                setLoading(true);
                await sendPinApi({ email: form.email, phoneNumber: form.phoneNumber });
                setShowOtp(true);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to send PIN.');
            } finally {
                setLoading(false);
            }
            return; // Wait for user to enter OTP
        }

        try {
            setLoading(true);
            const payload = { ...form };
            if (form.role === 'admin') payload.adminPin = adminPin;

            const res = await registerApi(payload);
            login(res.data.user, res.data.token);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-10">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Activity className="h-7 w-7" />
                            <span className="text-2xl font-bold">HealthPredict</span>
                        </div>
                        <p className="text-blue-100 text-sm">Create your account</p>
                    </div>

                    <div className="px-8 py-7">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />{error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="fullName" value={form.fullName} onChange={handleChange}
                                        placeholder="John Doe" className={inputClass} required minLength={2} maxLength={100} />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="email" type="email" value={form.email} onChange={handleChange}
                                        placeholder="you@example.com" autoComplete="email" className={inputClass} required />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select name="role" value={form.role} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none">
                                        <option value="student">Student</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Phone Number (Admin Only) */}
                            {form.role === 'admin' && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange}
                                            placeholder="+1234567890" className={inputClass} required={form.role === 'admin'} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Required to receive the Admin Verification PIN.</p>
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="password" type={showPw ? 'text' : 'password'}
                                        value={form.password} onChange={handleChange} required minLength={6}
                                        placeholder="Min 6 characters"
                                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {form.password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Strength: <span className="font-medium">{strengthLabel}</span></p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="confirmPassword" type={showPw ? 'text' : 'password'}
                                        value={form.confirmPassword} onChange={handleChange} required minLength={6}
                                        placeholder="Re-enter password"
                                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                    {form.confirmPassword && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {form.password === form.confirmPassword
                                                ? <CheckCircle className="w-4 h-4 text-green-500" />
                                                : <AlertCircle className="w-4 h-4 text-red-400" />}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-sm">
                                {loading
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account…</>
                                    : 'Create Account'
                                }
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* OTP Modal Overlay for Admin Registration */}
            {showOtp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-white/20 animate-scale-in">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Enter Verification PIN</h3>
                        <p className="text-sm text-center text-gray-500 mb-6">
                            We've sent a 6-digit PIN to your email and phone number.
                        </p>
                        
                        <input type="text" value={adminPin} onChange={e => { setAdminPin(e.target.value); setError(''); }}
                            placeholder="••••••" maxLength={6}
                            className="w-full text-center text-2xl tracking-widest font-mono py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 outline-none transition" />
                        
                        {error && <p className="text-red-500 text-xs mt-2 text-center text-medium">{error}</p>}

                        <div className="mt-6 flex gap-3">
                            <button onClick={() => { setShowOtp(false); setError(''); }} type="button"
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} type="button" disabled={loading || adminPin.length < 6}
                                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition flex justify-center items-center">
                                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
