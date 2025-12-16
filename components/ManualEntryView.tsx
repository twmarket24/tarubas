import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { parseVoiceDate } from '../utils/dateUtils';

interface ManualEntryProps {
    onSave: (item: Omit<InventoryItem, 'id'>) => void;
    user: any;
    userProfile: any;
    onToast: (msg: string, type: 'info'|'success'|'error') => void;
}

export const ManualEntryView: React.FC<ManualEntryProps> = ({ onSave, user, userProfile, onToast }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [qty, setQty] = useState(1);
    const [isListening, setIsListening] = useState<'name' | 'date' | null>(null);

    const startListening = (field: 'name' | 'date') => {
        if (!('webkitSpeechRecognition' in window)) {
            onToast("Speech recognition not supported.", 'error');
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        setIsListening(field);
        onToast("Listening... Speak clearly.", 'info');

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (field === 'date') {
                try {
                    const parsed = parseVoiceDate(transcript);
                    setDate(parsed);
                    onToast(`Recognized: ${parsed}`, 'success');
                } catch {
                    onToast("Could not parse date.", 'error');
                }
            } else {
                setName(transcript);
                onToast(`Recognized: ${transcript}`, 'success');
            }
            setIsListening(null);
        };

        recognition.onerror = (e: any) => {
            console.error(e);
            onToast("Voice error.", 'error');
            setIsListening(null);
        };

        recognition.onend = () => setIsListening(null);
        recognition.start();
    };

    const handleSave = () => {
        if (!name || !date) {
            onToast("Please fill all fields.", 'error');
            return;
        }

        onSave({
            name,
            expiryDate: date,
            quantity: qty,
            addedDate: new Date().toISOString().split('T')[0],
            source: 'MANUAL',
            userId: user.uid,
            username: userProfile.username
        });

        // Reset
        setName('');
        setDate('');
        setQty(1);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Manual Entry</h2>
            
            <div className="space-y-5 p-5 border border-gray-200 rounded-2xl shadow-xl bg-white">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PRODUCT NAME</label>
                    <div className="flex items-center space-x-2">
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" 
                            placeholder="e.g., Organic Milk"
                        />
                        <button 
                            onClick={() => startListening('name')}
                            className={`p-3 rounded-full transition-colors shadow-sm ${isListening === 'name' ? 'bg-teal-100 text-teal-800 animate-pulse ring-2 ring-teal-500' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3.97-3.32 7.15-7.3 7.15-4.04 0-7.3-3.21-7.3-7.15H3c0 4.65 3.52 8.44 8 9.24V22h2v-2.76c4.48-.8 8-4.59 8-9.24h-1.7z"/></svg>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EXPIRY DATE</label>
                    <div className="flex items-center space-x-2">
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        />
                        <button 
                            onClick={() => startListening('date')}
                            className={`p-3 rounded-full transition-colors shadow-sm ${isListening === 'date' ? 'bg-teal-100 text-teal-800 animate-pulse ring-2 ring-teal-500' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3.97-3.32 7.15-7.3 7.15-4.04 0-7.3-3.21-7.3-7.15H3c0 4.65 3.52 8.44 8 9.24V22h2v-2.76c4.48-.8 8-4.59 8-9.24h-1.7z"/></svg>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">QUANTITY</label>
                    <div className="flex items-center border border-gray-300 rounded-xl p-1 bg-gray-50">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 bg-red-100 rounded-lg text-red-600 font-bold w-12 hover:bg-red-200 transition-colors">-</button>
                        <span className="flex-1 text-center font-bold text-xl text-gray-800">{qty}</span>
                        <button onClick={() => setQty(qty + 1)} className="p-2 bg-green-100 rounded-lg text-green-600 font-bold w-12 hover:bg-green-200 transition-colors">+</button>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 mt-4 shadow-lg shadow-emerald-200/50 transition-all active:scale-95"
                >
                    Add Item to Inventory
                </button>
            </div>
        </div>
    );
};
