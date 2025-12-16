import React from 'react';
import { TabType } from '../types';

interface NavigationProps {
    currentTab: TabType;
    onSwitch: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSwitch }) => {
    const tabs: { id: TabType; label: string }[] = [
        { id: 'scanner', label: 'Dual Scan' },
        { id: 'quick', label: 'Quick Scan' },
        { id: 'manual', label: 'Manual' },
        { id: 'inventory', label: 'Inventory' },
        { id: 'account', label: 'Account' }
    ];

    return (
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-8 shadow-inner overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSwitch(tab.id)}
                    className={`flex-shrink-0 flex-1 py-2 px-3 text-center text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out whitespace-nowrap ${
                        currentTab === tab.id 
                        ? 'bg-white text-emerald-600 shadow-md transform scale-100' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
