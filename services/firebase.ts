import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    User 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    deleteDoc, 
    updateDoc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    Firestore
} from 'firebase/firestore';
import { InventoryItem, UserProfile } from '../types';

declare global {
    interface Window {
        __firebase_config?: string;
        __initial_auth_token?: string;
        __app_id?: string;
    }
}

// --- CONFIGURATION ---

const getFirebaseConfig = () => {
    if (typeof window !== 'undefined' && window.__firebase_config) {
        try { return JSON.parse(window.__firebase_config); } catch (e) { console.error(e); }
    }
    
    // Check process.env
    try {
        if (typeof process !== 'undefined' && process.env && process.env.FIREBASE_API_KEY) {
            return {
                apiKey: process.env.FIREBASE_API_KEY,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                projectId: process.env.FIREBASE_PROJECT_ID,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.FIREBASE_APP_ID
            };
        }
    } catch (e) {}

    // Return null if no valid config found to trigger Local Mode
    return null; 
};

// --- INITIALIZATION ---

let app: FirebaseApp | undefined;
let auth: any;
let db: Firestore | undefined;
let isLocalMode = false;

const config = getFirebaseConfig();

if (config && config.apiKey && config.apiKey !== "PLACEHOLDER_KEY") {
    try {
        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.warn("Firebase Init Failed. Switching to Local Mode.", error);
        isLocalMode = true;
    }
} else {
    console.log("No valid Firebase Config found. Using Local Storage Mode.");
    isLocalMode = true;
}

const APP_ID = (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'tarubaskibas-v1';

// --- LOCAL STORAGE HELPERS ---
const LOCAL_INV_KEY = 'tarubaskibas_inventory';
const LOCAL_PROFILE_KEY = 'tarubaskibas_profile';
let inventorySubscribers: ((items: InventoryItem[]) => void)[] = [];

// Mock User for Local Mode
const LOCAL_USER = { 
    uid: 'local-guest-user', 
    isAnonymous: true, 
    email: null, 
    displayName: 'Local Guest',
    emailVerified: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'local',
    tenantId: null,
    metadata: {},
    providerData: [],
    refreshToken: '',
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({})
} as unknown as User;

const notifyLocalSubscribers = () => {
    const items = JSON.parse(localStorage.getItem(LOCAL_INV_KEY) || '[]');
    // Sort by expiry
    items.sort((a: InventoryItem, b: InventoryItem) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    inventorySubscribers.forEach(cb => cb(items));
};

export const isUsingLocalStorage = () => isLocalMode;

// --- AUTH SERVICES ---

export const signIn = async () => {
    if (isLocalMode) return; // "Success"
    
    try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase Sign-in failed. Fallback to Local Mode.");
        isLocalMode = true; // Fallback runtime if init worked but auth failed
    }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    if (isLocalMode) {
        // Immediately return mock user
        setTimeout(() => callback(LOCAL_USER), 100);
        return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
        if (!user && isLocalMode) {
            callback(LOCAL_USER);
        } else {
            callback(user);
        }
    });
};

// --- INVENTORY SERVICES ---

export const subscribeToInventory = (userId: string, callback: (items: InventoryItem[]) => void) => {
    if (isLocalMode) {
        inventorySubscribers.push(callback);
        notifyLocalSubscribers(); // Initial data
        return () => {
            inventorySubscribers = inventorySubscribers.filter(cb => cb !== callback);
        };
    }

    if (!db) return () => {};

    const colRef = collection(db, `artifacts/${APP_ID}/users/${userId}/inventory`);
    return onSnapshot(colRef, (snapshot) => {
        const items: InventoryItem[] = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as InventoryItem);
        });
        items.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        callback(items);
    }, (error) => {
        console.error("Firestore sync error, falling back local:", error);
        isLocalMode = true;
        // Try to recover locally? For now just log.
    });
};

export const addInventoryItem = async (userId: string, item: Omit<InventoryItem, 'id'>) => {
    if (isLocalMode) {
        const items = JSON.parse(localStorage.getItem(LOCAL_INV_KEY) || '[]');
        const newItem = { ...item, id: 'local-' + Date.now() + Math.random().toString(36).substr(2, 9) };
        items.push(newItem);
        localStorage.setItem(LOCAL_INV_KEY, JSON.stringify(items));
        notifyLocalSubscribers();
        return { id: newItem.id };
    }

    if (!db) throw new Error("Database not initialized");
    const colRef = collection(db, `artifacts/${APP_ID}/users/${userId}/inventory`);
    return await addDoc(colRef, item);
};

export const updateInventoryItem = async (userId: string, itemId: string, updates: Partial<InventoryItem>) => {
    if (isLocalMode) {
        const items = JSON.parse(localStorage.getItem(LOCAL_INV_KEY) || '[]');
        const index = items.findIndex((i: InventoryItem) => i.id === itemId);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(LOCAL_INV_KEY, JSON.stringify(items));
            notifyLocalSubscribers();
        }
        return;
    }

    if (!db) throw new Error("Database not initialized");
    const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/inventory/${itemId}`);
    return await updateDoc(docRef, updates);
};

export const deleteInventoryItem = async (userId: string, itemId: string) => {
    if (isLocalMode) {
        const items = JSON.parse(localStorage.getItem(LOCAL_INV_KEY) || '[]');
        const newItems = items.filter((i: InventoryItem) => i.id !== itemId);
        localStorage.setItem(LOCAL_INV_KEY, JSON.stringify(newItems));
        notifyLocalSubscribers();
        return;
    }

    if (!db) throw new Error("Database not initialized");
    const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/inventory/${itemId}`);
    return await deleteDoc(docRef);
};

// --- PROFILE SERVICES ---

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    if (isLocalMode) {
        const profileStr = localStorage.getItem(LOCAL_PROFILE_KEY);
        return profileStr ? JSON.parse(profileStr) : { username: 'Guest' };
    }

    if (!db) return { username: 'Guest' };
    const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/profile/data`);
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data() as UserProfile;
        }
    } catch(e) { console.error(e); }
    return { username: 'Guest' };
};

export const saveUserProfile = async (userId: string, profile: UserProfile) => {
    if (isLocalMode) {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify({ ...profile, lastUpdate: new Date().toISOString() }));
        return;
    }

    if (!db) throw new Error("Database not initialized");
    const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/profile/data`);
    return await setDoc(docRef, { ...profile, lastUpdate: new Date().toISOString() });
};