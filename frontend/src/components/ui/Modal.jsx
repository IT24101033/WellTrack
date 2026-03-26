import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, children, className }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
            <div
                className={cn(
                    "bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                    className
                )}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
