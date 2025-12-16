import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AccountViewProps {
    user: any;
    profile: UserProfile;
    onSaveProfile: (p: UserProfile) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ user, profile, onSaveProfile }) => {
    const [username, setUsername] = useState(profile.username);

    useEffect(() => {
        setUsername(profile.username);
    }, [profile]);

    const handleSave = () => {
        if (username.trim()) {
            onSaveProfile({ username });
        }
    };

    const isAdmin = username.toLowerCase() === 'jylrd23';

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>

            <div className="text-sm font-mono text-gray-600 p-3 bg-gray-100 rounded-xl shadow-inner flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <span>Firebase User ID:</span>
                <span className="font-bold text-emerald-600 text-xs sm:text-sm break-all mt-1 sm:mt-0">{user.uid}</span>
            </div>

            {isAdmin && (
                <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-xl shadow-md">
                    <p className="font-extrabold text-lg text-yellow-800 flex items-center">
                        <svg className="w-6 h-6 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        ADMIN STATUS: ACTIVE
                    </p>
                    <p className="text-sm text-yellow-700">Access granted for username <span className="font-bold">jylrd23</span>.</p>
                </div>
            )}

            <div className="space-y-4 p-5 border border-gray-200 rounded-2xl shadow-xl bg-white">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SET YOUR DISPLAY USERNAME</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" 
                        placeholder="Enter your desired username" 
                    />
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all active:scale-95"
                >
                    Save Profile
                </button>

                <p className="text-center text-sm font-semibold text-gray-600 pt-2">
                    Current Username: {profile.username}
                </p>
            </div>
        </div>
    );
};
