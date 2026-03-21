import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast.jsx
 * Usage: import { useToast, ToastContainer } from './ui/Toast'
 *
 * const { toast } = useToast();
 * toast.success('Saved!');
 * toast.error('Something went wrong.');
 */

let _dispatch = null;

export function useToast() {
    const toast = {
        success: (msg) => _dispatch?.({ type: 'success', msg }),
        error: (msg) => _dispatch?.({ type: 'error', msg }),
        info: (msg) => _dispatch?.({ type: 'info', msg }),
        warning: (msg) => _dispatch?.({ type: 'warning', msg }),
    };
    return { toast };
}

const ICONS = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const BG = {
    success: 'border-l-green-500 bg-white',
    error: 'border-l-red-500   bg-white',
    warning: 'border-l-yellow-500 bg-white',
    info: 'border-l-blue-500  bg-white',
};

let _id = 0;

export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        _dispatch = ({ type, msg }) => {
            const id = ++_id;
            setToasts((prev) => [...prev, { id, type, msg }]);
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
        };
        return () => { _dispatch = null; };
    }, []);

    const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg animate-slide-in ${BG[t.type]}`}
                >
                    {ICONS[t.type]}
                    <p className="flex-1 text-sm text-gray-700">{t.msg}</p>
                    <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 mt-0.5">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
