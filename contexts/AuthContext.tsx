
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  UserCredential
} from 'https://esm.sh/firebase/auth';
import { auth as firebaseAuth, isFirebaseConfigured, googleProvider } from '../services/firebase';
import { FirebaseUser } from '../types';
import * as userService from '../services/userService';

const INITIAL_TOKENS = 100;

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userName: string | null;
  // FIX: Added isPremium to AuthContextType to resolve property missing error in ProfilePage.tsx
  isPremium: boolean;
  loading: boolean;
  tokens: number | null;
  signup: (email: string, pass: string, name: string) => Promise<UserCredential>;
  login: (email: string, pass: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth error');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  // FIX: Added isPremium state to track user's subscription status.
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<number | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const tokenKey = `userTokens_${user.uid}`;
        const storedTokens = localStorage.getItem(tokenKey);
        
        try {
            const profile = await userService.getUserProfile(user.uid);
            if (profile) {
                setUserName(profile.name);
                // FIX: Set isPremium status from user profile.
                setIsPremium(!!profile.isPremium);
            } else if (user.displayName) {
                setUserName(user.displayName);
                await userService.saveUserProfile(user.uid, { name: user.displayName, classLevel: 'Any' });
            }
        } catch (e) {
            console.error("Profile fetch failed:", e);
        }

        if (storedTokens === null) {
          localStorage.setItem(tokenKey, String(INITIAL_TOKENS));
          setTokens(INITIAL_TOKENS);
        } else {
          setTokens(parseInt(storedTokens, 10));
        }
      } else {
        setTokens(null);
        setUserName(null);
        // FIX: Reset isPremium when user logs out.
        setIsPremium(false);
      }
      setLoading(false);
    });

    const handleTokenChange = (event: any) => setTokens(event.detail.newTokens);
    window.addEventListener('tokenChange', handleTokenChange);

    return () => {
        unsubscribe();
        window.removeEventListener('tokenChange', handleTokenChange);
    };
  }, []);

  const signup = async (email: string, pass: string, name: string): Promise<UserCredential> => {
    const cred = await firebaseAuth ? createUserWithEmailAndPassword(firebaseAuth, email, pass) : Promise.reject('Firebase Auth not available');
    const userCredential = await cred;
    await userService.saveUserProfile(userCredential.user.uid, { name, classLevel: 'Any' });
    return userCredential;
  };

  const login = (email: string, pass: string) => firebaseAuth ? signInWithEmailAndPassword(firebaseAuth, email, pass) : Promise.reject('Firebase Auth not available');
  
  const loginWithGoogle = () => firebaseAuth ? signInWithPopup(firebaseAuth, googleProvider) : Promise.reject('Firebase Auth not available');

  const logout = () => firebaseAuth ? signOut(firebaseAuth) : Promise.resolve();

  return (
    <AuthContext.Provider value={{ currentUser, userName, isPremium, loading, tokens, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
