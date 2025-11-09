import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from 'firebase/auth';
import { auth as firebaseAuth, isFirebaseConfigured } from '../services/firebase';
import { FirebaseUser } from '../types';

const INITIAL_TOKENS = 100;

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userName: string | null;
  loading: boolean;
  tokens: number | null;
  signup: (email: string, pass: string, name: string) => Promise<any>;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const unconfiguredError = () => Promise.reject(new Error("Firebase is not configured. Please add your project credentials in 'services/firebase.ts'."));

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<number | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setLoading(false);
      return;
    }
    
    const authTimeout = setTimeout(() => {
        console.warn("Firebase auth state check timed out after 15 seconds. Assuming no user is logged in.");
        setLoading(false);
    }, 15000);

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      clearTimeout(authTimeout);
      setCurrentUser(user);

      if (user) {
        const tokenKey = `userTokens_${user.uid}`;
        const nameKey = `userName_${user.uid}`;
        const storedTokens = localStorage.getItem(tokenKey);
        const storedName = localStorage.getItem(nameKey);
        setUserName(storedName);

        if (storedTokens === null) {
          localStorage.setItem(tokenKey, String(INITIAL_TOKENS));
          setTokens(INITIAL_TOKENS);
        } else {
          setTokens(parseInt(storedTokens, 10));
        }
      } else {
        setTokens(null);
        setUserName(null);
      }
      
      setLoading(false);
    });

    const handleTokenChange = (event: CustomEvent) => {
        if (typeof event.detail.newTokens === 'number') {
            setTokens(event.detail.newTokens);
        }
    };
    window.addEventListener('tokenChange', handleTokenChange as EventListener);


    return () => {
        unsubscribe();
        clearTimeout(authTimeout);
        window.removeEventListener('tokenChange', handleTokenChange as EventListener);
    };
  }, []);

  const signup = async (email: string, pass: string, name: string): Promise<UserCredential> => {
    if (!isFirebaseConfigured || !firebaseAuth) return unconfiguredError();
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    
    const tokenKey = `userTokens_${userCredential.user.uid}`;
    const nameKey = `userName_${userCredential.user.uid}`;
    
    localStorage.setItem(tokenKey, String(INITIAL_TOKENS));
    localStorage.setItem(nameKey, name);

    setTokens(INITIAL_TOKENS);
    setUserName(name);
    return userCredential;
  };

  const login = (email: string, pass: string) => {
    if (!isFirebaseConfigured || !firebaseAuth) return unconfiguredError();
    return signInWithEmailAndPassword(firebaseAuth, email, pass);
  };
  
  const logout = () => {
    if (!isFirebaseConfigured || !firebaseAuth) return unconfiguredError() as Promise<void>;
    return signOut(firebaseAuth);
  };

  const value = {
    currentUser,
    userName,
    loading,
    tokens,
    signup,
    login,
    logout,
    isFirebaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};