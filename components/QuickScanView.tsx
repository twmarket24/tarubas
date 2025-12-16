import React, { useState } from 'react';
import { CameraCapture } from './CameraCapture';
import { analyzeImages } from '../services/geminiService';
import { InventoryItem, AnalysisJob } from '../types';

interface QuickScanViewProps {
    onSave: (item: Omit<InventoryItem, 'id'>) => void;
    user: any;
    userProfile: any;
    onError: (msg: string) => void;
    onSuccess: (msg: string) => void;
}

export const QuickScanView: React.FC<QuickScanViewProps> = ({ onSave, user, userProfile, onError, onSuccess }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [queue, setQueue] = useState<AnalysisJob[]>([]);
    const [jobCounter, setJobCounter] = useState(0);

    const handleCapture = (base64: string) => {
        const newJob: AnalysisJob = {
            id: jobCounter + 1,
            name: `Job ${jobCounter + 1}`,
            base64,
            status: 'queued'
        };
        setJobCounter(prev => prev + 1);
        const newQueue = [...queue, newJob];
        setQueue(newQueue);
        onSuccess(`Job ${newJob.id} queued.`);
        processQueue(newQueue);
    };

    const processQueue = async (currentQueue: AnalysisJob[]) => {
        const jobIndex = currentQueue.findIndex(j => j.status === 'queued');
        if (jobIndex === -1) return;

        const updatedQueue = [...currentQueue];
        updatedQueue[jobIndex].status = 'processing';
        setQueue(updatedQueue);

        const job = updatedQueue[jobIndex];

        try {
            const res = await analyzeImages(
                [job.base64], 
                "Analyze this image and provide the product name and expiry date."
            );
            
            setQueue(prev => prev.map(j => j.id === job.id ? { 
                ...j, 
                status: 'success', 
                productName: res.productName, 
                expiryDate: res.expiryDate 
            } : j));
            onSuccess(`${job.name} finished!`);
        } catch (e: any) {
            setQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', errorMessage: e.message } : j));
            onError(`${job.name} failed.`);
        } finally {
            // Check for next job
            // Recursion would need updated state, so we rely on effect or just let user capture more
        }
    };

    const handleSaveJob = (id: number) => {
        const job = queue.find(j => j.id === id);
        if (!job || job.status !== 'success' || !job.productName || !job.expiryDate) return;

        onSave({
            name: job.productName,
            expiryDate: job.expiryDate,
            quantity: 1,
            addedDate: new Date().toISOString().split('T')[0],
            source: 'QUICK_SCAN',
            userId: user.uid,
            username: userProfile.username
        });

        setQueue(prev => prev.filter(j => j.id !== id));
    };

    const handleRemoveJob = (id: number) => {
        setQueue(prev => prev.filter(j => j.id !== id));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Quick Single-Shot Scan</h2>
            <p className="text-sm text-gray-500">Capture the item with both name and date visible for one-shot analysis.</p>

            {!isCameraActive && (
                <div className="flex justify-center">
                    <button 
                        onClick={() => setIsCameraActive(true)}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all"
                    >
                        Start Camera
                    </button>
                </div>
            )}

            <CameraCapture 
                isActive={isCameraActive} 
                onCapture={handleCapture} 
                onClose={() => setIsCameraActive(false)} 
            />

            <div className="space-y-3 p-4 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
                <h4 className="font-bold text-gray-600 text-sm mb-2">Scan Queue/Results:</h4>
                {queue.length === 0 && (
                    <p className="text-center text-gray-400 py-4 text-xs">Completed scan jobs will appear here.</p>
                )}
                {queue.map(job => (
                    <div key={job.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                        job.status === 'queued' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        job.status === 'processing' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse' :
                        job.status === 'success' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-red-100 text-red-700 border-red-200'
                    }`}>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                                {job.name}: {job.productName || job.status}
                            </p>
                            {job.expiryDate && <p className="text-xs text-gray-500">Exp: {job.expiryDate}</p>}
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                            {job.status === 'success' && (
                                <button 
                                    onClick={() => handleSaveJob(job.id)}
                                    className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 shadow-sm"
                                >
                                    Save
                                </button>
                            )}
                            <button onClick={() => handleRemoveJob(job.id)} className="text-gray-400 hover:text-red-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
