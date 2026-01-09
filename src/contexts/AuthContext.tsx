
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
        let storedTokens = localStorage.getItem(tokenKey);
        
        try {
            const profile = await userService.getUserProfile(user.uid);
            if (profile) {
                setUserName(profile.name);
                setIsPremium(!!profile.isPremium);
            } else if (user.displayName) {
                // Handle Google users who might not have a profile yet
                await userService.saveUserProfile(user.uid, { 
                    name: user.displayName, 
                    classLevel: 'Any' 
                });
                setUserName(user.displayName);
            }
        } catch (e) {}

        if (storedTokens === null) {
          localStorage.setItem(tokenKey, String(INITIAL_TOKENS));
          setTokens(INITIAL_TOKENS);
        } else {
          setTokens(parseInt(storedTokens, 10));
        }
      } else {
        setTokens(null);
        setUserName(null);
        setIsPremium(false);
      }
      setLoading(false);
    });

    const handleTokenChange = (event: CustomEvent) => {
        if (typeof event.detail.newTokens === 'number') setTokens(event.detail.newTokens);
    };
    window.addEventListener('tokenChange', handleTokenChange as EventListener);
    return () => {
        unsubscribe();
        window.removeEventListener('tokenChange', handleTokenChange as EventListener);
    };
  }, []);

  const signup = async (email: string, pass: string, name: string): Promise<UserCredential> => {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    await userService.saveUserProfile(cred.user.uid, { name, classLevel: 'Any' });
    setUserName(name);
    setTokens(INITIAL_TOKENS);
    return cred;
  };

  const login = (email: string, pass: string) => signInWithEmailAndPassword(firebaseAuth, email, pass);

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(firebaseAuth, googleProvider);
    return cred;
  };

  const logout = () => signOut(firebaseAuth);

  return (
    <AuthContext.Provider value={{ currentUser, userName, isPremium, loading, tokens, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
