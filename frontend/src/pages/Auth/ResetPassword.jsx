import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { resetPassword as resetPasswordApi } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setError('');
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Password strength requirements
    const hasMinLength = form.password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(form.password);
    const hasNumber = /\d/.test(form.password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(form.password);
    const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasMinLength || !hasLetter || !hasNumber || !hasSymbol) {
            setError('Password must be at least 6 characters and contain letters, numbers, and symbols.');
            return;
        }
        if (!passwordsMatch) {
            setError('Passwords do not match.');
            return;
        }
        try {
            setLoading(true);
            setError('');
            const res = await resetPasswordApi(token, { password: form.password, confirmPassword: form.confirmPassword });
            // Log user in automatically with the returned token
            if (res.data?.user && res.data?.token) {
                login(res.data.user, res.data.token, false);
            }
            setSuccess(true);
            setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    const Requirement = ({ met, label }) => (
        <li className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
            {label}
        </li>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Activity className="h-7 w-7" />
                            <span className="text-2xl font-bold">HealthPredict</span>
                        </div>
                        <p className="text-blue-100 text-sm">Smart Health Risk Predictor</p>
                    </div>

                    <div className="px-8 py-7">
                        {success ? (
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">Password Reset!</h2>
                                <p className="text-sm text-gray-500 mb-2">
                                    Your password has been reset successfully.
                                </p>
                                <p className="text-xs text-gray-400">Redirecting you to the dashboard…</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold text-gray-800 mb-1">Set new password</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Your new password must be different from previously used passwords.
                                </p>

                                {error && (
                                    <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                id="reset-password-new"
                                                name="password"
                                                type={showPw ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                                required
                                                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(!showPw)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Password requirements */}
                                        {form.password.length > 0 && (
                                            <ul className="mt-2 space-y-1 pl-1">
                                                <Requirement met={hasMinLength} label="At least 6 characters" />
                                                <Requirement met={hasLetter} label="Contains a letter" />
                                                <Requirement met={hasNumber} label="Contains a number" />
                                                <Requirement met={hasSymbol} label="Contains a symbol" />
                                            </ul>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                id="reset-password-confirm"
                                                name="confirmPassword"
                                                type={showConfirmPw ? 'text' : 'password'}
                                                value={form.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                                required
                                                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPw(!showConfirmPw)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {form.confirmPassword.length > 0 && (
                                            <p className={`mt-1.5 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                                                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        id="reset-password-btn"
                                        disabled={loading}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-sm mt-2"
                                    >
                                        {loading
                                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting…</>
                                            : 'Reset Password'
                                        }
                                    </button>
                                </form>

                                <p className="text-center text-sm text-gray-500 mt-6">
                                    <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                        Back to Sign In
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
