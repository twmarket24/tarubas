import React, { useState } from 'react';
import { CameraCapture } from './CameraCapture';
import { analyzeImages } from '../services/geminiService';
import { InventoryItem } from '../types';

interface ScannerViewProps {
    onSave: (item: Omit<InventoryItem, 'id'>) => void;
    user: any;
    userProfile: any;
    onError: (msg: string) => void;
    onSuccess: (msg: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onSave, user, userProfile, onError, onSuccess }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [captureMode, setCaptureMode] = useState<'name' | 'date'>('name');
    const [images, setImages] = useState<{ name: string | null; date: string | null }>({ name: null, date: null });
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<{ name: string; date: string; qty: number } | null>(null);

    const handleCapture = (base64: string) => {
        if (captureMode === 'name') {
            setImages(prev => ({ ...prev, name: base64 }));
            setCaptureMode('date');
            onSuccess("Product name captured! Now capture expiry date.");
        } else {
            setImages(prev => ({ ...prev, date: base64 }));
            setIsCameraActive(false);
            onSuccess("Date captured! Ready to analyze.");
        }
    };

    const handleAnalyze = async () => {
        if (!images.name || !images.date) return;
        setAnalyzing(true);
        try {
            const res = await analyzeImages(
                [images.name, images.date], 
                "Analyze the two images. Image 1 shows the product name/label. Image 2 shows the expiry date."
            );
            setResult({
                name: res.productName,
                date: res.expiryDate,
                qty: 1
            });
            onSuccess("Analysis complete! Review and save.");
        } catch (e: any) {
            onError(e.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = () => {
        if (!result) return;
        onSave({
            name: result.name,
            expiryDate: result.date,
            quantity: result.qty,
            addedDate: new Date().toISOString().split('T')[0],
            source: 'AI',
            userId: user.uid,
            username: userProfile.username
        });
        handleReset();
    };

    const handleReset = () => {
        setImages({ name: null, date: null });
        setResult(null);
        setCaptureMode('name');
        setIsCameraActive(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Dual-Shot AI Scan</h2>
            <p className="text-sm text-gray-500">Capture the item name, then the expiry date for precision scanning.</p>

            {!isCameraActive && !result && (
                <button 
                    onClick={() => { setIsCameraActive(true); setCaptureMode('name'); }}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all"
                >
                    Start Camera
                </button>
            )}

            <CameraCapture 
                isActive={isCameraActive} 
                onCapture={handleCapture} 
                onClose={() => setIsCameraActive(false)} 
            />

            {!isCameraActive && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h3 className="text-base font-semibold text-gray-700">1. Product Name</h3>
                        <div className="min-h-[120px] bg-gray-50 border-2 border-dashed border-emerald-300 rounded-xl flex justify-center items-center overflow-hidden">
                            {images.name ? (
                                <img src={`data:image/jpeg;base64,${images.name}`} alt="Name" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-gray-400 text-sm">Capture Name</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-base font-semibold text-gray-700">2. Expiry Date</h3>
                        <div className="min-h-[120px] bg-gray-50 border-2 border-dashed border-emerald-300 rounded-xl flex justify-center items-center overflow-hidden">
                            {images.date ? (
                                <img src={`data:image/jpeg;base64,${images.date}`} alt="Date" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-gray-400 text-sm">Capture Date</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!result && (
                <div className="flex space-x-4 pt-2">
                    <button onClick={handleReset} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm">
                        Reset All
                    </button>
                    <button 
                        onClick={handleAnalyze} 
                        disabled={!images.name || !images.date || analyzing}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-green-700 transition-colors text-sm shadow-md shadow-green-200/50 flex justify-center items-center"
                    >
                        {analyzing ? (
                            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : null}
                        {analyzing ? "Analyzing..." : `Analyze Both`}
                    </button>
                </div>
            )}

            {result && (
                <div className="p-4 border border-green-400 rounded-2xl bg-green-50 space-y-3 shadow-inner animate-fade-in-up">
                    <h3 className="text-lg font-bold text-green-700">AI Detected Result:</h3>
                    <input 
                        type="text" 
                        value={result.name}
                        onChange={(e) => setResult({...result, name: e.target.value})}
                        className="w-full p-2 border border-green-200 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                    <input 
                        type="date" 
                        value={result.date}
                        onChange={(e) => setResult({...result, date: e.target.value})}
                        className="w-full p-2 border border-green-200 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-600">Qty:</span>
                        <button onClick={() => setResult({...result, qty: Math.max(1, result.qty - 1)})} className="p-1 bg-red-100 rounded-lg text-red-600 font-bold w-10 hover:bg-red-200">-</button>
                        <span className="flex-1 text-center font-bold text-lg">{result.qty}</span>
                        <button onClick={() => setResult({...result, qty: result.qty + 1})} className="p-1 bg-green-100 rounded-lg text-green-600 font-bold w-10 hover:bg-green-200">+</button>
                    </div>
                    <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-md">
                        Save to Inventory
                    </button>
                </div>
            )}
        </div>
    );
};
