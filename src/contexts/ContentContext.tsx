
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
  sessionId: string | null;
  
  searchStatus: SearchStatus;
  searchMessage: string;
  postSearchAction: PostSearchAction;
  setPostSearchAction: (action: PostSearchAction) => void;
  
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

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchMessage, setSearchMessage] = useState('');
  const [postSearchAction, setPostSearchAction] = useState<PostSearchAction>(null);

  const [hasSessionStarted, setHasSessionStarted] = useState(false);

  const generateSessionId = () => {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const startBackgroundSearch = async (searchFn: () => Promise<string>) => {
      const newSid = generateSessionId();
      setSessionId(newSid);
      setHasSessionStarted(true);
      setSearchStatus('searching');
      setSearchMessage('Initiating search...');
      try {
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
          }, 3000);
      } catch (err) {
          setSearchStatus('error');
          setSearchMessage(err instanceof Error ? err.message : "Search failed.");
      }
  };
  
  const startSessionWithContent = (text: string) => {
    const newSid = generateSessionId();
    setSessionId(newSid);
    setExtractedText(text);
    setHasSessionStarted(true);
  };

  const resetContent = () => {
    setExtractedText('');
    setSubject(null);
    setSessionId(null);
    setHasSessionStarted(false);
  };

  return (
    <ContentContext.Provider value={{
        extractedText, setExtractedText, subject, setSubject, classLevel, setClassLevel, sessionId,
        searchStatus, searchMessage, postSearchAction, setPostSearchAction, hasSessionStarted,
        startBackgroundSearch, startSessionWithContent, resetContent
    }}>
      {children}
    </ContentContext.Provider>
  );
};
