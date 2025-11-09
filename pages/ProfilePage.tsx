import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { QuizHistoryItem, WorkHistoryItem } from '../types';
import { AcademicCapIcon, CalendarDaysIcon, CheckBadgeIcon, DocumentTextIcon } from '../components/icons';
import { getWorkHistory } from '../utils/history';

const ProfilePage: React.FC = () => {
  const { currentUser, userName } = useAuth();
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([]);
  const [level, setLevel] = useState(1);
  const [levelName, setLevelName] = useState('Novice Learner');
  const [customApiKey, setCustomApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const storedQuizHistory: QuizHistoryItem[] = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    setQuizHistory(storedQuizHistory);
    
    const storedWorkHistory = getWorkHistory();
    setWorkHistory(storedWorkHistory);

    const activitiesCount = storedQuizHistory.length + storedWorkHistory.length;
    const calculatedLevel = 1 + Math.floor(activitiesCount / 5);
    setLevel(calculatedLevel);

    const levelNames = ['Novice Learner', 'Curious Student', 'Skilled Scholar', 'Prodigy', 'Wise Master'];
    setLevelName(levelNames[Math.min(calculatedLevel - 1, levelNames.length - 1)]);

    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
        setCustomApiKey(savedKey);
    }
  }, []);
  
  const handleSaveKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('user_gemini_api_key', customApiKey.trim());
    } else {
      localStorage.removeItem('user_gemini_api_key');
    }
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 3000); // Hide message after 3s
  };

  const handleClearKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setCustomApiKey('');
    alert('Custom API key cleared. The application will now use the default key if available.');
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Your Profile</h1>
        <p className="mt-2 text-slate-600">Track your progress and review your creations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card variant="light" className="lg:col-span-1 text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-4">Your Stats</h2>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                <AcademicCapIcon className="w-14 h-14 text-white"/>
            </div>
            <p className="text-lg font-semibold text-slate-800 break-all">{userName || currentUser?.email}</p>
            <div className="mt-4 bg-violet-100 text-violet-700 font-bold py-1 px-4 rounded-full border border-violet-200">
              Level {level}: {levelName}
            </div>
             <p className="text-sm text-slate-500 mt-2">{quizHistory.length + workHistory.length} total activities</p>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card variant="light">
              <h2 className="text-xl font-bold text-slate-700 mb-4">My Saved Work</h2>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {workHistory.length > 0 ? (
                      workHistory.map((item) => (
                          <div key={item.id} className="p-4 bg-white/50 rounded-lg flex items-center justify-between gap-4 border border-slate-300">
                              <div className="flex items-center gap-4 overflow-hidden">
                                 <div className="flex-shrink-0 bg-slate-200 p-2 rounded-lg">
                                    <DocumentTextIcon className="w-6 h-6 text-slate-500"/>
                                 </div>
                                 <div className="overflow-hidden">
                                     <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                                     <p className="text-sm text-slate-500">{item.type} &bull; {new Date(item.date).toLocaleDateString()}</p>
                                 </div>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-8">
                          <DocumentTextIcon className="w-12 h-12 mx-auto text-slate-400"/>
                          <p className="mt-2 text-slate-600">You haven't created anything yet.</p>
                          <p className="text-sm text-slate-500">Generated content like mind maps and papers will appear here.</p>
                      </div>
                  )}
              </div>
          </Card>
           <Card variant="light">
              <h2 className="text-xl font-bold text-slate-700 mb-4">Quiz History</h2>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {quizHistory.length > 0 ? (
                      quizHistory.map((item, index) => (
                          <div key={index} className="p-4 bg-white/50 rounded-lg flex items-center justify-between gap-4 border border-slate-300">
                              <div className="flex items-center gap-4">
                                 <div className="flex-shrink-0 bg-slate-200 p-2 rounded-lg">
                                    <CalendarDaysIcon className="w-6 h-6 text-slate-500"/>
                                 </div>
                                 <div>
                                     <p className="font-semibold text-slate-800">{item.subject} Quiz</p>
                                     <p className="text-sm text-slate-500">{item.date}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-lg text-violet-600">{item.score}</p>
                                  <p className="text-xs text-slate-500">Score</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-8">
                          <CheckBadgeIcon className="w-12 h-12 mx-auto text-slate-400"/>
                          <p className="mt-2 text-slate-600">You haven't taken any quizzes yet.</p>
                      </div>
                  )}
              </div>
          </Card>
        </div>
      </div>

      <Card variant="light">
        <h2 className="text-xl font-bold text-slate-700 mb-4">Advanced Settings</h2>
        <div className="space-y-4">
            <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-slate-700">Custom Gemini API Key</label>
                <p className="text-xs text-slate-500 mb-2">
                    Optionally, provide your own Gemini API key. This will be stored in your browser's local storage and will bypass the token system.
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        id="api-key"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        className="w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm"
                    />
                    <Button onClick={handleSaveKey}>Save</Button>
                    <Button onClick={handleClearKey} variant="outline">Clear</Button>
                </div>
                 {isKeySaved && <p className="text-sm text-green-600 mt-2 font-semibold">API Key settings updated successfully!</p>}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
