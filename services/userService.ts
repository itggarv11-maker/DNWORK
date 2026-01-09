
import { db, auth } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    query,
    orderBy,
    limit,
    getDocs,
    deleteDoc
} from 'https://esm.sh/firebase/firestore';

const getUser = () => auth?.currentUser;

/**
 * Cleanup function to ensure Firestore only receives plain objects.
 */
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Blob) return "[Media/Binary Data]"; 
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  
  const newObj: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val !== undefined && typeof val !== 'function') {
      newObj[key] = cleanForFirestore(val);
    }
  }
  return newObj;
}

/**
 * Pillar 1: Identity Profile
 */
export const saveUserProfile = async (userId: string, data: { name: string; classLevel: string }) => {
    if (!db) return;
    const profileRef = doc(db, 'users', userId);
    await setDoc(profileRef, { 
        ...data, 
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
    }, { merge: true });
};

export const getUserProfile = async (userId: string) => {
    if (!db) return null;
    const profileRef = doc(db, 'users', userId);
    const snap = await getDoc(profileRef);
    return snap.exists() ? snap.data() : null;
};

/**
 * Pillar 2: Activity Vault
 * Centralized save function for all tools.
 */
export const saveActivity = async (
    type: string, 
    topic: string, 
    subject: string, 
    data: any,
    analysis?: any,
    sessionId?: string | null
) => {
    if (!db) return;
    const user = getUser();
    if (!user) return;

    const activityData = {
        type,
        topic: topic || "Neural Link",
        subject: subject || "General",
        sessionId: sessionId || "standalone",
        timestamp: serverTimestamp(),
        data: cleanForFirestore(data),
        analysis: cleanForFirestore(analysis) || {}
    };

    try {
        const historyRef = collection(db, 'users', user.uid, 'history');
        const docRef = await addDoc(historyRef, activityData);
        
        if (analysis) {
            await updatePersonalIntelligence(user.uid, analysis);
        }
        
        return docRef.id;
    } catch (e) {
        console.error("Cloud Save Failure: ", e);
    }
};

/**
 * Updates an existing activity (Crucial for live sessions like Chat/Viva)
 */
export const updateActivity = async (activityId: string, data: any) => {
    if (!db) return;
    const user = getUser();
    if (!user) return;
    try {
        const docRef = doc(db, 'users', user.uid, 'history', activityId);
        await updateDoc(docRef, { 
            data: cleanForFirestore(data),
            lastUpdated: serverTimestamp()
        });
    } catch (e) {
        console.error("Failed to update cloud node:", e);
    }
};

/**
 * Pillar 3: Personal Intelligence
 */
const updatePersonalIntelligence = async (userId: string, analysis: any) => {
    if (!db || !analysis) return;
    const personalRef = doc(db, 'users', userId, 'personal', 'metrics');
    try {
        const docSnap = await getDoc(personalRef);
        let strengths = docSnap.exists() ? docSnap.data().strengths || [] : [];
        let weaknesses = docSnap.exists() ? docSnap.data().weaknesses || [] : [];

        if (analysis.strengthsIdentified) {
            strengths = [...new Set([...strengths, ...analysis.strengthsIdentified])];
        }
        if (analysis.weaknessesIdentified) {
            weaknesses = [...new Set([...weaknesses, ...analysis.weaknessesIdentified])];
        }

        await setDoc(personalRef, {
            strengths,
            weaknesses,
            lastAIFeedback: analysis.aiFeedback || "Ready for module upgrade.",
            lastUpdated: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error("Intelligence Update Failure: ", e);
    }
};

export const getFullHistory = async () => {
    const user = getUser();
    if (!db || !user) return [];
    try {
        const historyRef = collection(db, 'users', user.uid, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            date: doc.data().timestamp?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
        }));
    } catch (e) { 
        console.error("History sync failed:", e);
        return []; 
    }
};

export const getPersonalMetrics = async () => {
    const user = getUser();
    if (!db || !user) return null;
    try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'personal', 'metrics'));
        return snap.exists() ? snap.data() : null;
    } catch (e) { return null; }
};

export const getStudentContext = async (): Promise<string> => {
    const user = getUser();
    if (!db || !user) return "";
    try {
        const profile = await getUserProfile(user.uid);
        const metrics = await getPersonalMetrics();
        let ctx = `\n[STUDENT DATA]\n- Grade: ${profile?.classLevel || 'N/A'}\n`;
        if (metrics) {
            ctx += `- Strong: ${metrics.strengths?.join(', ') || 'None'}\n`;
            ctx += `- Focus: ${metrics.weaknesses?.join(', ') || 'None'}\n`;
        }
        return ctx;
    } catch (e) { return ""; }
};
