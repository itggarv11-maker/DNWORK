
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Subject, ClassLevel } from '../types';

export type SearchStatus = 'idle' | 'searching' | 'success' | 'error';
export type PostSearchAction = {
    tool: string;
    navigate: (path: string) => void;
} | null;

interface ContentContextType {
  extractedText: string;
  setExtractedText: (text: string) => void;
  subject: Subject | null;
  setSubject: (subject: Subject | null) => void;
  classLevel: ClassLevel;
  setClassLevel: (level: ClassLevel) => void;
  // FIX: Added sessionId to ContentContextType to resolve property missing error in DashboardPage.tsx
  sessionId: string | null;
  
  // New state for background search
  searchStatus: SearchStatus;
  searchMessage: string;
  postSearchAction: PostSearchAction;
  setPostSearchAction: (action: PostSearchAction) => void;
  
  // New state to manage session lifecycle and fix bugs
  hasSessionStarted: boolean;
  
  startBackgroundSearch: (searchFn: () => Promise<string>) => void;
  startSessionWithContent: (text: string) => void;
  resetContent: () => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
  // FIX: Added sessionId state to keep track of individual study sessions.
  const [sessionId, setSessionId] = useState<string | null>(null);

  // State for background chapter search
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchMessage, setSearchMessage] = useState('');
  const [postSearchAction, setPostSearchAction] = useState<PostSearchAction>(null);

  // Single source of truth for whether the user has started a session
  const [hasSessionStarted, setHasSessionStarted] = useState(false);

  // FIX: Helper to generate a unique session ID.
  const generateSessionId = () => {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const startBackgroundSearch = async (searchFn: () => Promise<string>) => {
      // FIX: Generate and set a new session ID when starting a search.
      const newSid = generateSessionId();
      setSessionId(newSid);
      setHasSessionStarted(true); // User has started their session
      setSearchStatus('searching');
      setSearchMessage('Initiating search...');
      try {
          // Simulate stages of searching for better UX
          setTimeout(() => setSearchMessage('Analyzing search parameters...'), 1000);
          setTimeout(() => setSearchMessage('Searching across web sources... (Est. 90s)'), 5000);
          setTimeout(() => setSearchMessage('Compiling and structuring content...'), 45000);

          const text = await searchFn();
          
          setExtractedText(text);
          setSearchStatus('success');
          setSearchMessage('Chapter content loaded successfully!');

          if (postSearchAction) {
              postSearchAction.navigate(postSearchAction.tool);
          }

          setTimeout(() => {
              setSearchStatus('idle');
              setSearchMessage('');
              setPostSearchAction(null);
          }, 5000); // Hide success message after 5 seconds
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during search.";
          setSearchStatus('error');
          setSearchMessage(errorMessage);
          setPostSearchAction(null); // Clear action on error
           setTimeout(() => {
              setSearchStatus('idle');
              setSearchMessage('');
          }, 8000);
      }
  };
  
  const startSessionWithContent = (text: string) => {
    // FIX: Generate and set a new session ID when starting with provided content.
    const newSid = generateSessionId();
    setSessionId(newSid);
    setExtractedText(text);
    setHasSessionStarted(true);
  };


  const resetContent = () => {
    setExtractedText('');
    setSubject(null);
    setClassLevel('Class 10');
    setSearchStatus('idle');
    setSearchMessage('');
    setPostSearchAction(null);
    setHasSessionStarted(false);
    // FIX: Clear session ID when content is reset.
    setSessionId(null);
  };

  const value = {
    extractedText,
    setExtractedText,
    subject,
    setSubject,
    classLevel,
    setClassLevel,
    sessionId, // FIX: Include sessionId in context value.
    searchStatus,
    searchMessage,
    postSearchAction,
    setPostSearchAction,
    hasSessionStarted,
    startBackgroundSearch,
    startSessionWithContent,
    resetContent
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};
