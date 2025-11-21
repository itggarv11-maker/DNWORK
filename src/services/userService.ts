
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

/**
 * Recursively cleans an object for Firestore storage.
 * - Removes 'undefined' values (Firestore rejects them).
 * - Converts Dates to timestamps or strings.
 * - Handles nested arrays and objects.
 * - Removes functions or prototypes.
 */
function cleanForFirestore(obj: any): any {
  if (obj === null) return null;
  if (obj === undefined) return null;
  
  // Handle primitive types
  if (typeof obj !== 'object') return obj;
  
  // Handle Dates
  if (obj instanceof Date) return obj.toISOString();
  
  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)).filter(item => item !== null);
  }
  
  // Handle Blobs (Firestore doesn't support raw Blobs well in JSON-like structs, usually better to store Ref or Base64)
  // For this app, we'll just note it exists or skip it to prevent crash.
  if (obj instanceof Blob) return "[Blob Data]"; 

  // Handle Objects
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      // Skip undefined
      if (val === undefined) continue;
      
      // Recursively clean
      const cleanVal = cleanForFirestore(val);
      if (cleanVal !== null) {
        newObj[key] = cleanVal;
      }
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
    if (!db) {
        console.warn("Firestore is not initialized. Cannot save activity.");
        return;
    }
    const user = getUser();
    if (!user) {
        console.warn("No user logged in. Cannot save activity.");
        return;
    }

    // Sanitize data before sending to Firestore to prevent crashes
    const safeData = cleanForFirestore(data);
    const safeAnalysis = cleanForFirestore(analysis);

    const activityData = {
        userId: user.uid,
        type,
        topic: topic || "General",
        subject: subject || "General",
        timestamp: serverTimestamp(),
        data: safeData,
        analysis: safeAnalysis || {}
    };

    try {
        // 1. Save the raw activity log
        const docRef = await addDoc(collection(db, 'users', user.uid, 'history'), activityData);
        console.log(`[UserService] Activity saved. ID: ${docRef.id}`);

        // 2. Update the User's Knowledge Profile if analysis is provided
        if (analysis) {
            await updateKnowledgeProfile(user.uid, topic, safeAnalysis);
        }

        return docRef.id;
    } catch (e: any) {
        console.error("Error adding document: ", e);
        if (e.code === 'failed-precondition' && e.message.includes('index')) {
            console.error("FIRESTORE INDEX MISSING! Click the link in the error message above to create it automatically.");
        }
    }
};

/**
 * Updates the user's "Brain" (Knowledge Profile) based on recent performance.
 */
const updateKnowledgeProfile = async (userId: string, topic: string, analysis: any) => {
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
        if (analysis.strengthsIdentified && Array.isArray(analysis.strengthsIdentified)) {
            // Add new strengths
            currentStrengths = [...new Set([...currentStrengths, ...analysis.strengthsIdentified])];
            // Remove these from weaknesses if they were there
            currentWeaknesses = currentWeaknesses.filter(w => !analysis.strengthsIdentified.includes(w));
        }

        if (analysis.weaknessesIdentified && Array.isArray(analysis.weaknessesIdentified)) {
            // Add new weaknesses
            currentWeaknesses = [...new Set([...currentWeaknesses, ...analysis.weaknessesIdentified])];
            // Remove these from strengths if they were there (regression)
            currentStrengths = currentStrengths.filter(s => !analysis.weaknessesIdentified.includes(s));
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
    } catch (e: any) {
        console.error("Error fetching history", e);
        if (e.code === 'failed-precondition') {
             console.error("MISSING INDEX: Check the console link to create the required Firestore Index.");
        }
        return [];
    }
};
