import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
    toast: ToastMessage | null;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300); // Wait for fade out
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, onClose]);

    if (!toast) return null;

    const bgColor = toast.type === 'error' ? 'bg-red-600' : 
                    toast.type === 'warning' ? 'bg-yellow-500' :
                    toast.type === 'success' ? 'bg-emerald-600' : 'bg-teal-600';

    return (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`px-6 py-3 ${bgColor} text-white rounded-full font-bold shadow-xl text-sm`}>
                {toast.message}
            </div>
        </div>
    );
};
