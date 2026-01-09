
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
import { useContent } from '../contexts/ContentContext';
import { VisualExplanationScene, ClassLevel, Subject } from '../types';
import { CLASS_LEVELS, SUBJECTS } from '../constants';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import VisualPlayer from '../components/app/VisualPlayer';
import { CheckCircleIcon, XCircleIcon, VideoCameraIcon } from '../components/icons';

type PageState = 'setup' | 'generating' | 'error';
type TopicStatus = 'pending' | 'generating' | 'complete' | 'error';
type SetupMode = 'content' | 'topic';
type Language = 'en-IN' | 'en-US' | 'en-GB' | 'hi';

interface TopicState {
  title: string;
  content: string;
  status: TopicStatus;
  errorMessage?: string;
}

const VisualExplanationPage: React.FC = () => {
    const { extractedText: globalExtractedText, classLevel: globalClassLevel, subject: globalSubject, hasSessionStarted } = useContent();
    const navigate = useNavigate();

    // Setup State
    const [pageState, setPageState] = useState<PageState>('setup');
    const [setupMode, setSetupMode] = useState<SetupMode>(hasSessionStarted && globalExtractedText ? 'content' : 'topic');
    const [customTopic, setCustomTopic] = useState('');
    const [classLevel, setClassLevel] = useState<ClassLevel>(globalClassLevel || 'Class 10');
    const [subject, setSubject] = useState<Subject | null>(globalSubject);
    const [language, setLanguage] = useState<Language>('en-IN');
    const [sourceText, setSourceText] = useState(globalExtractedText);

    // Generation State
    const [topics, setTopics] = useState<TopicState[]>([]);
    const [allScenes, setAllScenes] = useState<VisualExplanationScene[]>([]);
    const [topicSceneStarts, setTopicSceneStarts] = useState<number[]>([]);
    const [summaryVideoScenes, setSummaryVideoScenes] = useState<VisualExplanationScene[]>([]);
    const [summaryStatus, setSummaryStatus] = useState<TopicStatus>('pending');
    
    const [jumpToScene, setJumpToScene] = useState<number | undefined>(undefined);
    const [currentPlayingTopicIndex, setCurrentPlayingTopicIndex] = useState(0);
    const [error, setError] = useState<React.ReactNode | null>(null);

    const isGenerating = useRef(false);
    
    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link> for unlimited access.</span>
            : message);
        setPageState('error');
        isGenerating.current = false;
    };

    const handleStartGeneration = async () => {
        setPageState('generating');
        isGenerating.current = true;
        let textToProcess = sourceText;

        if (setupMode === 'topic') {
            if (!customTopic || !subject || !classLevel) {
                handleApiError(new Error("Please provide a topic, subject, and class level."));
                return;
            }
            try {
                const fetchedContent = await geminiService.fetchChapterContent(classLevel, subject, customTopic, '');
                setSourceText(fetchedContent);
                textToProcess = fetchedContent;
            } catch (err) {
                handleApiError(err);
                return;
            }
        }
        
        if (!textToProcess) {
             handleApiError(new Error("No content available to generate video."));
             return;
        }

        try {
            const topicData = await geminiService.breakdownTextIntoTopics(textToProcess);
            if(topicData.length === 0){
                handleApiError(new Error("Could not break down the content into topics. The text may be too short or unstructured."));
                return;
            }
            const initialTopicStates: TopicState[] = topicData.map(t => ({ ...t, status: 'pending' }));
            setTopics(initialTopicStates);
        } catch (err) {
            handleApiError(err);
        }
    };
    
    // This effect runs the generation pipeline once topics are set
    useEffect(() => {
        if (topics.length === 0 || !isGenerating.current) return;

        const processQueue = async () => {
            let currentScenes: VisualExplanationScene[] = [];
            let sceneStartIndices: number[] = [];

            for (let i = 0; i < topics.length; i++) {
                setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'generating' } : t));
                try {
                    const newScenes = await geminiService.generateScenesForTopic(topics[i].content, language, classLevel);
                    sceneStartIndices.push(currentScenes.length);
                    currentScenes = [...currentScenes, ...newScenes];
                    setAllScenes([...currentScenes]);
                    setTopicSceneStarts([...sceneStartIndices]);
                    setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'complete' } : t));
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'error', errorMessage } : t));
                }
            }
            
            // Generate final summary video
            setSummaryStatus('generating');
            try {
                 const summaryScenes = await geminiService.generateFullChapterSummaryVideo(sourceText, language, classLevel);
                 setSummaryVideoScenes(summaryScenes);
                 setSummaryStatus('complete');
            } catch (err) {
                 console.error("Failed to generate final summary video:", err);
                 setSummaryStatus('error');
            }

            // FIX: Reordered arguments for saveActivity call to match (type, topic, subject, data) signature in services/userService.ts
            if (currentScenes.length > 0) {
                userService.saveActivity('visual_explanation', customTopic || "Visual Explanation", subject || 'General', {
                    scenes: currentScenes,
                    summaryScenes: summaryVideoScenes
                });
            }

            isGenerating.current = false;
        };
        processQueue();
    }, [topics, sourceText, language, classLevel, customTopic, subject, summaryVideoScenes]);

    const handleTopicSelect = (index: number) => {
        if (topics[index].status !== 'complete' || topicSceneStarts[index] === undefined) return;
        setJumpToScene(topicSceneStarts[index]);
    };
    
    const handleSummarySelect = () => {
        if (summaryStatus !== 'complete') return;
        const totalTopicScenes = allScenes.length;
        setJumpToScene(totalTopicScenes);
    };

    const handleSceneChange = (sceneIndex: number) => {
        // Find which topic this scene belongs to
        let topicIdx = topicSceneStarts.findIndex((start, i) => {
            const end = topicSceneStarts[i+1] || allScenes.length;
            return sceneIndex >= start && sceneIndex < end;
        });

        if (topicIdx === -1 && sceneIndex >= allScenes.length) {
            // It's a summary scene
            setCurrentPlayingTopicIndex(topics.length);
        } else if (topicIdx !== -1) {
            setCurrentPlayingTopicIndex(topicIdx);
        }
    };

    const renderSetup = () => (
        <Card variant="light" className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <VideoCameraIcon className="w-16 h-16 mx-auto text-violet-600" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">Visual Explanation</h1>
                <p className="mt-2 text-slate-600">Generate a narrated video from your notes or any topic.</p>
            </div>
            
             <div className="flex space-x-1 rounded-t-lg bg-slate-100 p-1 w-full mb-4">
                <button disabled={!hasSessionStarted || !globalExtractedText} onClick={() => setSetupMode('content')} className={`flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${setupMode === 'content' ? 'bg-white text-violet-600 shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}>Use Loaded Content</button>
                <button onClick={() => setSetupMode('topic')} className={`flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${setupMode === 'topic' ? 'bg-white text-violet-600 shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}>Generate from Topic</button>
            </div>

            <div className="space-y-4">
                {setupMode === 'topic' && (
                    <>
                        <div>
                            <label htmlFor="customTopic" className="block text-sm font-medium text-slate-700">Topic</label>
                            <input type="text" id="customTopic" value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="e.g., 'Newton's Laws of Motion'" className="mt-1 block w-full p-2 bg-white/60 border border-slate-400 rounded-md"/>
                        </div>
                        <div>
                             <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
                             <select id="subject" value={subject || ''} onChange={(e) => setSubject(e.target.value as Subject)} className="mt-1 block w-full p-2 bg-white/60 border border-slate-400 rounded-md">
                                 <option value="" disabled>-- Select a Subject --</option>
                                 {SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                             </select>
                         </div>
                    </>
                )}
                 <div>
                    <label htmlFor="classLevel" className="block text-sm font-medium text-slate-700">Class Level</label>
                    <select id="classLevel" value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="mt-1 block w-full p-2 bg-white/60 border border-slate-400 rounded-md">
                        {CLASS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="language" className="block text-sm font-medium text-slate-700">Narration Language</label>
                    <select id="language" value={language} onChange={e => setLanguage(e.target.value as Language)} className="mt-1 block w-full p-2 bg-white/60 border border-slate-400 rounded-md">
                        <option value="en-IN">English (India)</option>
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="hi">Hinglish</option>
                    </select>
                </div>
                <div className="text-center pt-4">
                    <Button onClick={handleStartGeneration} size="lg">Generate Video</Button>
                </div>
            </div>
        </Card>
    );

    const TopicStatusIcon: React.FC<{status: TopicStatus}> = ({status}) => {
        switch(status) {
            case 'pending': return <div className="w-5 h-5 flex items-center justify-center"><div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse"></div></div>;
            case 'generating': return <Spinner className="w-5 h-5" />;
            case 'complete': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'error': return <XCircleIcon className="w-5 h-5 text-red-500" />;
            default: return null;
        }
    };

    const renderGenerator = () => (
         <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {allScenes.length > 0 ? (
                        <VisualPlayer
                            scenes={[...allScenes, ...summaryVideoScenes]}
                            language={language}
                            jumpToScene={jumpToScene}
                            onSceneChange={handleSceneChange}
                        />
                    ) : (
                        <div className="aspect-video bg-slate-800 rounded-xl flex flex-col items-center justify-center text-white p-4">
                            <Spinner className="w-12 h-12" />
                            <p className="mt-4 font-semibold">Generating your video...</p>
                            <p className="text-sm text-slate-300">The first scene will appear here shortly.</p>
                        </div>
                    )}
                </div>
                <Card variant="light" className="h-full">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Video Playlist</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {topics.map((topic, index) => (
                             <button
                                key={index}
                                onClick={() => handleTopicSelect(index)}
                                disabled={topic.status !== 'complete'}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${currentPlayingTopicIndex === index ? 'bg-violet-100 border-violet-300' : 'bg-white/50 border-slate-300'} disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:bg-slate-200/50`}
                            >
                                <TopicStatusIcon status={topic.status} />
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-700">{topic.title}</p>
                                    {topic.status === 'error' && <p className="text-xs text-red-600">{topic.errorMessage}</p>}
                                </div>
                            </button>
                        ))}
                        <button
                            onClick={handleSummarySelect}
                            disabled={summaryStatus !== 'complete'}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all font-bold ${currentPlayingTopicIndex === topics.length ? 'bg-violet-200 border-violet-400' : 'bg-violet-100/70 border-violet-200'} disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:bg-violet-200/50`}
                        >
                             <TopicStatusIcon status={summaryStatus} />
                             <p className="flex-grow text-violet-800">Full Chapter Summary Video</p>
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
    
    if (pageState === 'error') {
        return (
             <Card variant="light" className="max-w-lg mx-auto text-center">
                <h2 className="text-xl font-bold text-red-600">An Error Occurred</h2>
                <p className="text-slate-600 mt-2">{error}</p>
                <Button onClick={() => setPageState('setup')} className="mt-4">Try Again</Button>
            </Card>
        );
    }

    return pageState === 'setup' ? renderSetup() : renderGenerator();
};

export default VisualExplanationPage;
