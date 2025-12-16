import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { getExpiryStatus } from '../utils/dateUtils';

interface InventoryViewProps {
    items: InventoryItem[];
    onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
    onDelete: (id: string) => void;
    onImport: (items: any[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ items, onUpdate, onDelete, onImport }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const totalPages = Math.ceil(items.length / itemsPerPage);
    const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleExport = () => {
        const dataStr = JSON.stringify(items, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tarubaskibas_inventory_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target?.result as string);
                if (Array.isArray(parsed)) {
                    onImport(parsed);
                }
            } catch (err) {
                console.error("Import failed", err);
            }
        };
        reader.readAsText(file);
    };

    const handleQtyChange = (id: string | undefined, currentQty: number, delta: number) => {
        if (!id) return;
        const newQty = currentQty + delta;
        if (newQty <= 0) {
            onDelete(id);
        } else {
            onUpdate(id, { quantity: newQty });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">My Current Inventory</h2>

            <div className="flex justify-between items-center text-sm mb-4 p-3 bg-gray-50 rounded-xl shadow-inner border border-gray-100">
                <div className="flex items-center space-x-2">
                    <label className="font-medium text-gray-700">Items/Page:</label>
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="p-1 border rounded-lg bg-white"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <span className="font-bold text-emerald-600 text-lg">Total: {items.length}</span>
            </div>

            <div className="flex space-x-4 mb-6">
                <button onClick={handleExport} className="flex-1 bg-gray-700 text-white py-2 rounded-xl font-bold hover:bg-gray-800 transition-colors text-sm shadow-md">
                    Export JSON
                </button>
                <label className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm text-center cursor-pointer shadow-md">
                    Import JSON
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
            </div>

            <div className="space-y-4">
                {items.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">Inventory is empty.</p>
                ) : (
                    paginatedItems.map(item => {
                        const status = getExpiryStatus(item.expiryDate);
                        return (
                            <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-xl shadow-sm bg-white transition-all hover:shadow-md ${status.colorClass}`}>
                                <div className="flex-1 min-w-0 mb-2 sm:mb-0 pl-2">
                                    <p className="text-lg font-bold text-gray-800 truncate">{item.name}</p>
                                    <p className="text-sm text-gray-600">
                                        Expires: {item.expiryDate} (<span className={`font-semibold ${status.textColor}`}>{status.label}</span>)
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2 sm:ml-4">
                                    <button onClick={() => handleQtyChange(item.id, item.quantity, -1)} className="p-1 bg-red-100 rounded-lg text-red-600 font-bold w-8 h-8 hover:bg-red-200">-</button>
                                    <span className="text-xl font-extrabold text-emerald-700 w-8 text-center">{item.quantity}</span>
                                    <button onClick={() => handleQtyChange(item.id, item.quantity, 1)} className="p-1 bg-green-100 rounded-lg text-green-600 font-bold w-8 h-8 hover:bg-green-200">+</button>
                                    <button onClick={() => item.id && onDelete(item.id)} className="p-2 ml-4 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage <= 1}
                    className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                    ← Previous
                </button>
                <span className="text-sm font-semibold text-gray-600">Page {currentPage} of {totalPages || 1}</span>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                    Next →
                </button>
            </div>
        </div>
    );
};
