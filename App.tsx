import React, { useEffect, useState } from 'react';
import { Toast } from './components/Toast';
import { Navigation } from './components/Navigation';
import { ScannerView } from './components/ScannerView';
import { QuickScanView } from './components/QuickScanView';
import { ManualEntryView } from './components/ManualEntryView';
import { InventoryView } from './components/InventoryView';
import { AccountView } from './components/AccountView';
import { 
    signIn, 
    subscribeToAuth, 
    subscribeToInventory, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    getUserProfile, 
    saveUserProfile,
    isUsingLocalStorage
} from './services/firebase';
import { InventoryItem, TabType, ToastMessage, UserProfile } from './types';

function App() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile>({ username: 'Guest' });
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [currentTab, setCurrentTab] = useState<TabType>('scanner');
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Auth
    useEffect(() => {
        const init = async () => {
            try {
                await signIn();
            } catch (error) {
                console.error("Auth init failed, will use fallback if available", error);
            }
        };
        init();

        const unsubscribe = subscribeToAuth((u) => {
            setUser(u);
            if (u) {
                getUserProfile(u.uid).then(setProfile);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Inventory Sync
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToInventory(user.uid, setInventory);
        return () => unsubscribe();
    }, [user]);

    const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
        setToast({ id: Date.now().toString(), message, type });
    };

    const handleAddItem = async (item: Omit<InventoryItem, 'id'>) => {
        if (!user) {
            showToast("System initializing...", 'warning');
            return;
        }
        try {
            await addInventoryItem(user.uid, item);
            showToast("Successfully Added Kupal", 'success');
        } catch (e) {
            console.error(e);
            showToast("Failed to save item.", 'error');
        }
    };

    const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
        if (!user) return;
        try {
            await updateInventoryItem(user.uid, id, updates);
            showToast("Item updated.", 'info');
        } catch (e) {
            showToast("Failed to update item.", 'error');
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!user) return;
        try {
            await deleteInventoryItem(user.uid, id);
            showToast("Item deleted.", 'success');
        } catch (e) {
            showToast("Failed to delete item.", 'error');
        }
    };

    const handleImport = async (items: any[]) => {
        if (!user) return;
        let successCount = 0;
        for (const item of items) {
            if (item.name && item.expiryDate) {
                try {
                    await addInventoryItem(user.uid, {
                        ...item,
                        quantity: Number(item.quantity) || 1,
                        addedDate: new Date().toISOString().split('T')[0],
                        source: 'IMPORTED',
                        userId: user.uid,
                        username: profile.username
                    });
                    successCount++;
                } catch (e) { console.error(e); }
            }
        }
        showToast(`Imported ${successCount} items.`, 'success');
    };

    const handleSaveProfile = async (p: UserProfile) => {
        if (!user) return;
        await saveUserProfile(user.uid, p);
        setProfile(p);
        showToast(`Profile saved as ${p.username}`, 'success');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-emerald-600 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-gray-600 font-semibold">Starting Engine...</p>
                </div>
            </div>
        );
    }

    const isLocal = isUsingLocalStorage();

    return (
        <div className="max-w-2xl w-full mx-auto p-4 md:p-6 bg-white rounded-[2rem] shadow-2xl border border-gray-100 my-4 md:my-10 transition-transform duration-300">
            <h1 className="text-3xl font-extrabold text-emerald-700 mb-6 text-center tracking-tight">TARUBASKIBAS</h1>
            
            {isLocal && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl mb-4 text-center text-sm flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span><strong>Local Database Active:</strong> Items are saved to this device (Free Mode).</span>
                </div>
            )}

            <Navigation currentTab={currentTab} onSwitch={setCurrentTab} />

            <div className="min-h-[400px]">
                {currentTab === 'scanner' && (
                    <ScannerView 
                        onSave={handleAddItem} 
                        user={user} 
                        userProfile={profile} 
                        onError={(msg) => showToast(msg, 'error')}
                        onSuccess={(msg) => showToast(msg, 'success')}
                    />
                )}
                {currentTab === 'quick' && (
                    <QuickScanView 
                        onSave={handleAddItem} 
                        user={user} 
                        userProfile={profile}
                        onError={(msg) => showToast(msg, 'error')}
                        onSuccess={(msg) => showToast(msg, 'success')}
                    />
                )}
                {currentTab === 'manual' && (
                    <ManualEntryView 
                        onSave={handleAddItem} 
                        user={user} 
                        userProfile={profile} 
                        onToast={showToast}
                    />
                )}
                {currentTab === 'inventory' && (
                    <InventoryView 
                        items={inventory} 
                        onUpdate={handleUpdateItem} 
                        onDelete={handleDeleteItem} 
                        onImport={handleImport}
                    />
                )}
                {currentTab === 'account' && (
                    <AccountView 
                        user={user} 
                        profile={profile} 
                        onSaveProfile={handleSaveProfile} 
                    />
                )}
            </div>

            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}

export default App;