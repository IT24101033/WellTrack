import React, { useState } from 'react';
import { Send, Bell, Loader2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminBroadcasts() {
    const { token } = useAuth();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        setSending(true);
        setResult(null);

        try {
            const res = await fetch(`${BASE_URL}/notifications/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title, message, type: 'system' })
            });

            const data = await res.json();
            if (data.success) {
                setResult({ success: true, message: data.message });
                setTitle('');
                setMessage('');
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (err) {
            setResult({ success: false, message: 'Server error sending broadcast' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                    <Bell className="w-6 h-6 text-blue-500" /> System Broadcasts
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Send a global system notification to all students. If enabled, this will also trigger Twilio SMS and Nodemailer emails automatically.
                </p>
            </div>

            <div className="glass-card p-6">
                <form onSubmit={handleBroadcast} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Target Audience</label>
                        <div className="glass-input flex items-center opacity-70 cursor-not-allowed bg-black/5 dark:bg-white/5">
                            All Active Students
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Message Title</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. Server Maintenance, New Feature Alert"
                            className="glass-input w-full" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Broadcast Content</label>
                        <textarea 
                            required
                            rows={4} 
                            placeholder="Type the message you want to broadcast..."
                            className="glass-input w-full resize-y" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-blue-500">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs">
                            <strong>Note:</strong> Sending a broadcast might take a few seconds as the system processes Emails and SMS messages for all active users based on their personal preferences.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={sending || !title || !message}
                            className="glass-btn flex items-center justify-center gap-2 w-full py-3"
                        >
                            {sending ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Broadcasting...</>
                            ) : (
                                <><Send className="w-5 h-5" /> Send Global Broadcast</>
                            )}
                        </button>
                    </div>

                    {result && (
                        <div className={`mt-4 p-3 rounded-xl text-sm font-semibold border ${result.success ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                            {result.message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
