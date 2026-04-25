import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, Lock, Mail, User, Hash, AlertCircle, CheckCircle, Phone, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { register as registerApi, sendAdminPin as sendPinApi, googleLogin as googleLoginApi } from '../../services/authService';
import { GoogleLogin } from '@react-oauth/google';

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
    const [googleCredential, setGoogleCredential] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setError('');
        let value = e.target.value;
        if (e.target.name === 'phoneNumber') {
            // Only allow numbers and limit to 10 digits
            value = value.replace(/[^0-9]/g, '').slice(0, 10);
        }
        setForm((prev) => ({ ...prev, [e.target.name]: value }));
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

        const hasLetter = /[a-zA-Z]/.test(form.password);
        const hasNumber = /\d/.test(form.password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(form.password);
        
        if (form.password.length < 6 || !hasLetter || !hasNumber || !hasSymbol) {
            setError('Password must be at least 6 characters and contain letters, numbers, and symbols.');
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
            if (!/^0[0-9]{9}$/.test(form.phoneNumber)) {
                setError('Phone number must be exactly 10 digits starting with 0 (e.g., 0771234567).');
                return;
            }
            try {
                setLoading(true);
                const res = await sendPinApi({ email: form.email, phoneNumber: form.phoneNumber });
                setSuccessMessage(res.data.message);
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

    const handleGoogleSuccess = async (response) => {
        try {
            setLoading(true);
            setError('');
            
            if (form.role === 'admin') {
                if (!form.phoneNumber) {
                    setError('Phone number is required for Admin registration.');
                    setLoading(false);
                    return;
                }
                // Save credential and send PIN
                setGoogleCredential(response.credential);
                // We need to decode the credential to get the email, or just pass it to a helper.
                // For simplicity, I'll use a hack: the backend will need the email to send the PIN.
                // Actually, let's just use the form's email if they filled it, or we'll have to decode the JWT.
                // Let's decode the JWT to get the email.
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                const googleEmail = decoded.email;

                const res = await sendPinApi({ email: googleEmail, phoneNumber: form.phoneNumber });
                setSuccessMessage(res.data.message);
                setShowOtp(true);
                setLoading(false);
            } else {
                const res = await googleLoginApi(response.credential);
                login(res.data.user, res.data.token);
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Google Sign-In failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyGoogleAdmin = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await googleLoginApi(googleCredential, 'admin', adminPin);
            login(res.data.user, res.data.token);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
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
                                            placeholder="0771234567" className={inputClass} required={form.role === 'admin'} />
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

                        <div className="mt-6">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500 font-medium">Or continue with</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google Registration failed.')}
                                    useOneTap
                                    theme="filled_blue"
                                    shape="pill"
                                    width="100%"
                                />
                            </div>
                        </div>

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
                            {successMessage || "We've sent a 6-digit PIN to your email and phone number."}
                        </p>
                        
                        <input type="text" value={adminPin} onChange={e => { setAdminPin(e.target.value); setError(''); }}
                            placeholder="••••••" maxLength={6}
                            className="w-full text-center text-2xl tracking-widest font-mono py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 outline-none transition" />
                        
                        {error && <p className="text-red-500 text-xs mt-2 text-center text-medium">{error}</p>}

                        <div className="mt-6 flex gap-3">
                            <button onClick={() => { setShowOtp(false); setGoogleCredential(null); setError(''); }} type="button"
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={googleCredential ? handleVerifyGoogleAdmin : handleSubmit} type="button" disabled={loading || adminPin.length < 6}
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
