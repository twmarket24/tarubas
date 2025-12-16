export interface InventoryItem {
    id?: string;
    name: string;
    expiryDate: string;
    quantity: number;
    addedDate: string;
    source: 'AI' | 'MANUAL' | 'QUICK_SCAN' | 'IMPORTED';
    userId: string;
    username: string;
}

export interface UserProfile {
    username: string;
    lastUpdate?: string;
}

export interface AnalysisJob {
    id: number;
    name: string;
    base64: string;
    status: 'queued' | 'processing' | 'success' | 'error';
    productName?: string;
    expiryDate?: string;
    errorMessage?: string;
}

export type TabType = 'scanner' | 'quick' | 'manual' | 'inventory' | 'account';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}
