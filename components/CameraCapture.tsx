import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
    isActive: boolean;
    onCapture: (base64: string) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ isActive, onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const startCamera = async () => {
            if (isActive) {
                try {
                    currentStream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'environment' } 
                    });
                    setStream(currentStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = currentStream;
                    }
                } catch (err: any) {
                    console.error("Camera Error", err);
                    setError("Could not access camera. Please allow permissions.");
                }
            } else {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isActive]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                const base64 = dataUrl.split(',')[1];
                onCapture(base64);
            }
        }
    };

    if (!isActive) return null;

    return (
        <div className="w-full space-y-4">
            {error ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-xl text-center text-sm font-semibold">
                    {error}
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-inner">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}
            
            <div className="flex justify-center space-x-4">
                 <button 
                    onClick={handleCapture}
                    disabled={!!error}
                    className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Capture
                </button>
                <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors"
                >
                    Stop
                </button>
            </div>
        </div>
    );
};
