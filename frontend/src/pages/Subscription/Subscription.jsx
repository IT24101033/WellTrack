import React, { useState, useEffect } from 'react';
import { 
    Check, Sparkles, Shield, Zap, Upload, AlertCircle, 
    Loader2, CheckCircle2, Clock, X, CreditCard, Lock 
} from 'lucide-react';
import GooglePayButton from '@google-pay/button-react';
import { getSubscription, updateSubscription, cancelSubscription } from '../../services/subscriptionService';
import { useAuth } from '../../context/AuthContext';

const PLANS = [
    {
        name: 'Free',
        price: '0',
        description: 'Perfect for getting started with your wellness journey.',
        features: ['Basic notifications', 'Daily health summary', 'Basic analytics'],
        color: 'gray',
    },
    {
        name: 'Plus',
        price: '300',
        description: 'Advanced insights and reminders for better habits.',
        features: ['Medication alerts', 'Appointment reminders', 'Weekly health reports', 'Detailed data history'],
        color: 'blue',
        popular: true
    },
    {
        name: 'Pro',
        price: '500',
        description: 'Elite diagnostics and AI risk prediction for total safety.',
        features: ['Real-time AI risk alerts', 'XGBoost heart analytics', 'Priority doctor export', 'Personalized wellness roadmap'],
        color: 'violet'
    }
];

export default function Subscription() {
    const { user } = useAuth();
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Payment States
    const [method, setMethod] = useState('card'); // 'card' | 'receipt' | 'gpay'
    const [file, setFile] = useState(null);
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExp, setCardExp] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadSub();
    }, []);

    const loadSub = async () => {
        try {
            const res = await getSubscription();
            if (res.data?.success) setSub(res.data.subscription);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel your current plan? You will lose access to premium features.')) return;
        setUpdating(true);
        try {
            const res = await cancelSubscription();
            if (res.data?.success) {
                setSub(res.data.subscription);
                alert('Subscription cancelled successfully.');
            }
        } catch (err) {
            alert('Failed to cancel subscription.');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpgradeToFree = async () => {
        setUpdating(true);
        try {
            const res = await updateSubscription({ planName: 'Free', paymentMethod: 'free' });
            if (res.data?.success) {
                setSub(res.data.subscription);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            alert('Failed to downgrade/set Free plan.');
        } finally {
            setUpdating(false);
        }
    };

    // Helper: Card Formatting
    const formatCardNumber = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const formatExp = (v) => { 
        const d = v.replace(/\D/g, '').slice(0, 4); 
        return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; 
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.size > 3 * 1024 * 1024) {
            setError('File size must be under 3MB');
            return;
        }
        setFile(selected);
        setError('');
    };

    const handleSubmitPayment = async (overrideMethod) => {
        const activeMethod = overrideMethod || method;
        setError('');
        
        if (activeMethod === 'receipt' && !file) {
            setError('Please upload a payment slip.');
            return;
        }
        if (activeMethod === 'card' && (!cardName || cardNumber.length < 19 || cardExp.length < 5 || cardCvv.length < 3)) {
            setError('Please fill in valid card details.');
            return;
        }

        setUpdating(true);
        try {
            let res;
            if (activeMethod === 'receipt') {
                const formData = new FormData();
                formData.append('planName', selectedPlan.name);
                formData.append('paymentMethod', 'receipt');
                formData.append('receipt', file);
                res = await updateSubscription(formData);
            } else {
                res = await updateSubscription({
                    planName: selectedPlan.name,
                    paymentMethod: activeMethod
                });
            }

            if (res.data?.success) {
                setSub(res.data.subscription);
                setSuccess(true);
                setSelectedPlan(null);
                setFile(null);
                setCardName(''); setCardNumber(''); setCardExp(''); setCardCvv('');
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const currentPlanName = sub?.planName || 'Free';
    const isPending = sub?.status === 'pending';

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-10">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Choose Your Wellness Level
                </h1>
                <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
                    Unlock clinical-grade AI risk prediction and advanced health management features by upgrading your account.
                </p>
            </div>

            {/* Current Summary */}
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{currentPlanName} Plan</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                sub?.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                                {sub?.status || 'Active'}
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {sub?.endDate ? `Valid until ${new Date(sub.endDate).toLocaleDateString()}` : 'No expiration set'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {currentPlanName !== 'Free' && (
                        <button onClick={handleCancel} disabled={updating}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                            Cancel Plan
                        </button>
                    )}
                </div>
            </div>

            {isPending && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
                    <Clock className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Verification Pending</p>
                        <p className="text-xs opacity-90">An admin is verifying your manual bank transfer for {sub.planName}.</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 animate-scale-in">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Action Successful!</p>
                        <p className="text-xs opacity-90">Your plan has been updated or your receipt was received.</p>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                    const isCurrent = currentPlanName === plan.name;
                    const isPlanPending = isPending && sub?.planName === plan.name;
                    
                    return (
                        <div key={plan.name} className={`glass-card p-8 flex flex-col relative transition-all duration-300 hover:-translate-y-2 ${plan.popular ? 'ring-2 ring-blue-500 shadow-2xl' : ''}`}>
                            {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    Most Popular
                                </span>
                            )}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>LKR {plan.price}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/year</span>
                                </div>
                                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{plan.description}</p>
                            </div>
                            <ul className="flex-1 space-y-3 mb-8">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                disabled={isCurrent || isPlanPending || updating}
                                onClick={() => {
                                    if(plan.name === 'Free') handleUpgradeToFree();
                                    else setSelectedPlan(plan);
                                }}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                                    isCurrent ? 'bg-gray-50 text-gray-400' : 
                                    plan.name === 'Pro' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-[1.02]' :
                                    'bg-blue-600 text-white hover:scale-[1.02]'
                                }`}
                            >
                                {isCurrent ? 'Current Plan' : isPlanPending ? 'Processing...' : plan.name === 'Free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Unified Payment Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 animate-scale-in overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Upgrade to {selectedPlan.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Secure payment · LKR {selectedPlan.price}/year</p>
                            </div>
                            <button onClick={() => setSelectedPlan(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-4 gap-2 bg-gray-50 dark:bg-slate-950/50">
                            {[
                                { id: 'card', label: 'Card', icon: CreditCard },
                                { id: 'receipt', label: 'Transfer', icon: Upload },
                                { id: 'gpay', label: 'GPay', icon: Sparkles }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setMethod(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        method === t.id 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {method === 'card' && (
                                <div className="space-y-6">
                                    {/* Visual Card */}
                                    <div 
                                        className="relative w-full h-48 rounded-2xl transition-all duration-700 preserve-3d cursor-pointer group"
                                        style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        {/* Front */}
                                        <div className="absolute inset-0 backface-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div className="w-12 h-9 bg-yellow-400/80 rounded-md shadow-inner" />
                                                <span className="font-bold italic opacity-70">HEALTHPAY</span>
                                            </div>
                                            <div className="text-xl tracking-widest font-mono">
                                                {cardNumber || '•••• •••• •••• ••••'}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[8px] opacity-60 uppercase mb-1">Card Holder</p>
                                                    <p className="text-sm font-medium tracking-wide uppercase">{cardName || 'YOUR NAME'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] opacity-60 uppercase mb-1">Expires</p>
                                                    <p className="text-sm font-medium">{cardExp || 'MM/YY'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Back */}
                                        <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-xl flex flex-col pt-6" style={{ transform: 'rotateY(180deg)' }}>
                                            <div className="h-10 bg-black w-full opacity-60 mt-4" />
                                            <div className="px-6 mt-6">
                                                <div className="bg-gray-100 rounded p-2 text-right">
                                                    <span className="text-slate-900 font-bold italic tracking-wider">{cardCvv || '•••'}</span>
                                                </div>
                                                <p className="text-[8px] opacity-40 mt-4 text-center leading-relaxed">This card is simulated for security purposes during development.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Cardholder Name</label>
                                            <input 
                                                value={cardName} onChange={e => setCardName(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all font-medium"
                                                placeholder="Enter name on card"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Card Number</label>
                                            <input 
                                                value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all font-mono tracking-widest"
                                                placeholder="0000 0000 0000 0000" maxLength={19}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Expiry Date</label>
                                            <input 
                                                value={cardExp} onChange={e => setCardExp(formatExp(e.target.value))}
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all font-medium"
                                                placeholder="MM/YY" maxLength={5}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">CVV</label>
                                            <input 
                                                type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                onFocus={() => setIsFlipped(true)} onBlur={() => setIsFlipped(false)}
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all font-medium"
                                                placeholder="•••" maxLength={3}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === 'receipt' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-blue-50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wider">Bank Details:</p>
                                        <div className="space-y-1 font-mono text-[11px] text-blue-600 dark:text-blue-300">
                                            <p className="flex justify-between"><span>Bank:</span> <span>Commercial Bank</span></p>
                                            <p className="flex justify-between"><span>Account:</span> <span className="font-bold underline">1234 5678 9012</span></p>
                                            <p className="flex justify-between"><span>Name:</span> <span>WellTrack Solutions</span></p>
                                            <p className="flex justify-between"><span>Amount:</span> <span className="font-bold">LKR {selectedPlan.price}</span></p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Upload Receipt Image</label>
                                        <div 
                                            className="relative h-44 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-900 transition-all overflow-hidden"
                                            onClick={() => document.getElementById('slip-input').click()}
                                        >
                                            {file ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900">
                                                    <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-auto object-contain" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <p className="text-white text-[10px] font-bold">Change Image</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-xs text-gray-500">Tap to upload your bank slip</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG up to 3MB</p>
                                                </>
                                            )}
                                            <input id="slip-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === 'gpay' && (
                                <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-fade-in">
                                    <div className="p-6 bg-gray-50 dark:bg-slate-950 rounded-full">
                                        <Sparkles className="w-10 h-10 text-yellow-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-800 dark:text-white">Quick Google Pay</p>
                                        <p className="text-xs text-gray-500 mt-1 max-w-[240px]">Pay instantly with your saved Google cards. One-click and easy.</p>
                                    </div>
                                    <GooglePayButton
                                        environment="TEST"
                                        paymentRequest={{
                                            apiVersion: 2, apiVersionMinor: 0,
                                            allowedPaymentMethods: [{
                                                type: 'CARD',
                                                parameters: { 
                                                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                                    allowedCardNetworks: ['MASTERCARD', 'VISA'],
                                                },
                                                tokenizationSpecification: {
                                                    type: 'PAYMENT_GATEWAY',
                                                    parameters: { gateway: 'example', gatewayMerchantId: 'exampleGatewayMerchantId' },
                                                },
                                            }],
                                            merchantInfo: { merchantId: '12345678901234567890', merchantName: 'WellTrack' },
                                            transactionInfo: {
                                                totalPriceStatus: 'FINAL', totalPriceLabel: 'Total',
                                                totalPrice: selectedPlan.price.toString(),
                                                currencyCode: 'LKR', countryCode: 'LK',
                                            },
                                        }}
                                        onLoadPaymentData={() => handleSubmitPayment('google_pay')}
                                        buttonColor={user.theme === 'dark' ? 'white' : 'black'}
                                        buttonType="pay"
                                        className="w-full max-w-[300px] h-12"
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-500/5 p-3 rounded-2xl border border-red-100 dark:border-red-500/10 text-xs font-medium animate-shake">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}
                        </div>

                        {/* Action Area */}
                        {method !== 'gpay' && (
                            <div className="p-6 bg-gray-50 dark:bg-slate-950/50 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    onClick={() => handleSubmitPayment()}
                                    disabled={updating}
                                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                                >
                                    {updating ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                    ) : (
                                        <><Lock className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" /> Confirm & Pay LKR {selectedPlan.price}</>
                                    )}
                                </button>
                                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                                    <Lock className="w-3 h-3" /> Encrypted · PCI-DSS Compliant · Bank Level Security
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Add these to your Global CSS or at the end of this file (if using Tailwind/Vanilla)
const style = document.createElement('style');
style.textContent = `
    .preserve-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
    }
    .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
`;
document.head.appendChild(style);

