
import { db, auth } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from 'https://esm.sh/firebase/firestore';
import { UserActivity, KnowledgeProfile } from '../types';

// -- HELPERS --

const getUser = () => {
    const user = auth?.currentUser;
    if (!user) return null;
    return user;
};

// Utility to sanitize objects for Firestore
// - Removes undefined (not null) fields
// - Removes Blob objects (not supported by Firestore directly)
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Blob) return "[Blob omitted]"; 
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  
  const newObj: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val !== undefined) {
      newObj[key] = cleanForFirestore(val);
    }
  }
  return newObj;
}

// -- CORE FUNCTIONS --

/**
 * Stores any activity (Chat session, Quiz result, etc.) into Firestore
 * and triggers an update to the user's Knowledge Profile.
 */
export const saveActivity = async (
    type: UserActivity['type'], 
    topic: string, 
    subject: string, 
    data: any,
    analysis?: UserActivity['analysis']
) => {
    if (!db) return; // Firestore not initialized
    const user = getUser();
    if (!user) return;

    // Sanitize data to prevent Firestore errors with undefined/Blobs
    const safeData = cleanForFirestore(data);
    const safeAnalysis = cleanForFirestore(analysis);

    const activityData: Omit<UserActivity, 'id'> = {
        userId: user.uid,
        type,
        topic,
        subject,
        timestamp: serverTimestamp(),
        data: safeData,
        analysis: safeAnalysis
    };

    try {
        // 1. Save the raw activity log
        const docRef = await addDoc(collection(db, 'users', user.uid, 'history'), activityData);
        console.log("Activity saved with ID: ", docRef.id);

        // 2. Update the User's Knowledge Profile if analysis is provided
        if (safeAnalysis) {
            await updateKnowledgeProfile(user.uid, topic, safeAnalysis);
        }

        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        // We don't throw here to prevent UI crashes if DB fails
    }
};

/**
 * Updates the user's "Brain" (Knowledge Profile) based on recent performance.
 */
const updateKnowledgeProfile = async (userId: string, topic: string, analysis: UserActivity['analysis']) => {
    if (!db || !analysis) return;
    
    const profileRef = doc(db, 'users', userId, 'profile', 'academic');
    
    try {
        const docSnap = await getDoc(profileRef);
        
        let currentWeaknesses: string[] = [];
        let currentStrengths: string[] = [];

        if (docSnap.exists()) {
            const data = docSnap.data() as KnowledgeProfile;
            currentWeaknesses = data.weaknesses || [];
            currentStrengths = data.strengths || [];
        }

        // Logic to merge new weaknesses/strengths
        // Remove solved weaknesses from the weakness list
        if (analysis.strengthsIdentified) {
            currentStrengths = [...new Set([...currentStrengths, ...analysis.strengthsIdentified])];
            currentWeaknesses = currentWeaknesses.filter(w => !analysis.strengthsIdentified?.includes(w));
        }

        // Add new weaknesses
        if (analysis.weaknessesIdentified) {
            currentWeaknesses = [...new Set([...currentWeaknesses, ...analysis.weaknessesIdentified])];
            // Ensure a topic isn't in both lists (weakness takes priority if recently identified)
            currentStrengths = currentStrengths.filter(s => !analysis.weaknessesIdentified?.includes(s));
        }

        const updateData = {
            strengths: currentStrengths,
            weaknesses: currentWeaknesses,
            recentTopics: arrayUnion(topic),
            lastSessionSummary: analysis.aiFeedback || "Keep studying!",
            lastUpdated: serverTimestamp()
        };

        await setDoc(profileRef, updateData, { merge: true });

    } catch (e) {
        console.error("Error updating knowledge profile: ", e);
    }
};

/**
 * Retrieves the user's learning context (Strengths/Weaknesses) to inject into Gemini.
 */
export const getStudentContext = async (): Promise<string> => {
    if (!db || !auth?.currentUser) return "";
    
    try {
        const profileRef = doc(db, 'users', auth.currentUser.uid, 'profile', 'academic');
        const docSnap = await getDoc(profileRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as KnowledgeProfile;
            
            let context = `\n\n**RETRIEVED STUDENT MEMORY:**\n`;
            context += `- **User Name:** ${auth.currentUser.displayName || 'Student'}\n`;
            if (data.weaknesses && data.weaknesses.length > 0) {
                context += `- **Current WEAKNESSES (Focus on these):** ${data.weaknesses.join(', ')}\n`;
            }
            if (data.strengths && data.strengths.length > 0) {
                context += `- **Proven STRENGTHS:** ${data.strengths.join(', ')}\n`;
            }
            if (data.lastSessionSummary) {
                context += `- **Last Session Note:** "${data.lastSessionSummary}"\n`;
            }
            context += `\nUse this memory to personalize your teaching. If they struggled with a topic before, check if they understand it now.`;
            
            return context;
        }
    } catch (e) {
        console.error("Error fetching student context", e);
    }
    
    return "";
};

/**
 * Fetches recent history for the dashboard
 */
export const getRecentHistory = async (limitCount: number = 5) => {
    if (!db || !auth?.currentUser) return [];

    try {
        const q = query(
            collection(db, 'users', auth.currentUser.uid, 'history'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching history", e);
        return [];
    }
};
