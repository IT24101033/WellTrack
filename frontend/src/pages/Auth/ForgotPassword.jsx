import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Activity, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { forgotPassword as forgotPasswordApi } from '../../services/authService';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        try {
            setLoading(true);
            setError('');
            await forgotPasswordApi({ email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">Check your email</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    We've sent a password reset link to <span className="font-medium text-gray-700">{email}</span>. 
                                    The link will expire in 10 minutes.
                                </p>
                                <p className="text-xs text-gray-400 mb-6">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Sign In
                                </Link>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold text-gray-800 mb-1">Reset your password</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Enter your email and we'll send you a link to reset your password.
                                </p>

                                {error && (
                                    <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Email address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                id="forgot-password-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => { setError(''); setEmail(e.target.value); }}
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        id="send-reset-link-btn"
                                        disabled={loading}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        {loading
                                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                                            : 'Send Reset Link'
                                        }
                                    </button>
                                </form>

                                <p className="text-center text-sm text-gray-500 mt-6">
                                    Remember your password?{' '}
                                    <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                        Sign in
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
