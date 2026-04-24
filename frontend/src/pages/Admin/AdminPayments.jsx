import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Loader2, Search, AlertCircle, Calendar, Mail, User, CreditCard } from 'lucide-react';
import { getPendingSubscriptions, verifySubscription } from '../../services/subscriptionService';

export default function AdminPayments() {
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [search, setSearch] = useState('');
    const [viewImage, setViewImage] = useState(null);

    useEffect(() => {
        loadSubs();
    }, []);

    const loadSubs = async () => {
        try {
            const res = await getPendingSubscriptions();
            if (res.data?.success) setSubs(res.data.subscriptions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return;
        setProcessing(id);
        try {
            const res = await verifySubscription(id, action);
            if (res.data?.success) {
                setSubs(prev => prev.filter(s => s._id !== id));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setProcessing(null);
        }
    };

    const filtered = subs.filter(s => 
        s.userId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.userId?.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Payment Verification</h1>
                    <p className="text-sm text-gray-500">Review and approve bank slip uploads for manual upgrades.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        className="glass-input pl-10 h-10 text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <CreditCard className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No pending payments found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filtered.map((s) => (
                        <div key={s._id} className="glass-card p-5 flex flex-col sm:flex-row gap-5 hover:border-blue-200 transition-colors">
                            {/* Receipt Thumbnail */}
                            <div 
                                className="w-full sm:w-32 h-32 rounded-xl bg-gray-100 flex-shrink-0 relative overflow-hidden group cursor-pointer"
                                onClick={() => setViewImage(`http://localhost:5001${s.receiptUrl}`)}
                            >
                                <img 
                                    src={`http://localhost:5001${s.receiptUrl}`} 
                                    alt="slip" 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=Slip+Not+Found'; }}
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-800">{s.userId?.fullName || 'Unknown User'}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                s.planName === 'Pro' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {s.planName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Mail className="w-3.5 h-3.5" /> {s.userId?.email}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-800 italic">LKR {s.planName === 'Pro' ? '500' : '300'}</p>
                                        <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 mt-1">
                                            <Calendar className="w-3 h-3" /> {new Date(s.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAction(s._id, 'approve')}
                                        disabled={!!processing}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 disabled:opacity-50"
                                    >
                                        {processing === s._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(s._id, 'reject')}
                                        disabled={!!processing}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {viewImage && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in" onClick={() => setViewImage(null)}>
                    <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full">
                        <X className="w-8 h-8" />
                    </button>
                    <img 
                        src={viewImage} 
                        alt="full receipt" 
                        className="max-w-full max-h-[85vh] rounded-lg shadow-2xl animate-scale-in" 
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="mt-6 flex gap-4">
                         <p className="text-white/60 text-sm">Review the bank reference name and amount before approving.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
