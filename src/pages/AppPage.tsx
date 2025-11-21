
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import { Subject, QuizQuestion, ChatMessage, ClassLevel, Flashcard, MindMapNode, QuizDifficulty, SmartSummary } from '../types';
import { SUBJECTS, CLASS_LEVELS } from '../constants';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';
import { Chat } from '@google/genai';
import QuizComponent from '../components/app/QuizComponent';
import SmartSummaryComponent from '../components/app/SmartSummaryComponent';
import FlashcardComponent from '../components/app/FlashcardComponent';
import MindMap from '../components/app/MindMap';
import { 
    UploadIcon, YouTubeIcon, ClipboardIcon, SearchIcon, ChatBubbleIcon, DocumentTextIcon, 
    LightBulbIcon, RectangleStackIcon, BrainCircuitIcon, DocumentDuplicateIcon, 
    ChatBubbleLeftRightIcon, VideoCameraIcon, GavelIcon, QuestIcon, RocketLaunchIcon,
    BookOpenIcon, ExamPredictorIcon, MicrophoneIcon, AILabAssistantIcon, HistoricalChatIcon, LearningPathIcon
} from '../components/icons';
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { useContent } from '../contexts/ContentContext';
import { motion } from 'https://esm.sh/framer-motion';

// Required for pdf.js to work
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

type ActiveTool = 'chat' | 'quiz' | 'summary' | 'flashcards' | 'mindmap' | 'none';
type ContentSource = 'paste' | 'file' | 'youtube' | 'search';
type QuestionTypeFilter = 'mcq' | 'written' | 'both';

interface Tool {
    path: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    requiresContent: boolean;
    subjects?: Subject[];
    color: string;
}

// New component to handle markdown and math rendering in chat
const MessageContent: React.FC<{ text: string }> = ({ text }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (contentRef.current && window.renderMathInElement) {
            window.renderMathInElement(contentRef.current, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    }, [text]);

    return <div ref={contentRef} className="prose prose-sm max-w-none prose-invert text-slate-200" dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />;
};

const AppPage: React.FC = () => {
    const navigate = useNavigate();
    const { 
        extractedText,
        subject, setSubject, 
        classLevel, setClassLevel, 
        resetContent, 
        searchStatus, startBackgroundSearch, setPostSearchAction,
        hasSessionStarted, startSessionWithContent
    } = useContent();
    
    const [contentSource, setContentSource] = useState<ContentSource>('paste');
    const [pastedText, setPastedText] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [chapterInfo, setChapterInfo] = useState('');
    const [chapterDetails, setChapterDetails] = useState('');
    const [localSourceText, setLocalSourceText] = useState('');
    
    const [activeTool, setActiveTool] = useState<ActiveTool>('none');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [error, setError] = useState<React.ReactNode | null>(null);

    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [smartSummary, setSmartSummary] = useState<SmartSummary | null>(null);
    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [userMessage, setUserMessage] = useState('');

    const [showQuizSettings, setShowQuizSettings] = useState(false);
    const [quizQuestionCount, setQuizQuestionCount] = useState<number>(5);
    const [quizDifficulty, setQuizDifficulty] = useState<QuizDifficulty>('Medium');
    const [quizQuestionType, setQuizQuestionType] = useState<QuestionTypeFilter>('both');

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Save Chat on Unmount/Exit
    useEffect(() => {
        return () => {
            if (activeTool === 'chat' && chatHistory.length > 2) {
                userService.saveActivity('chat', `Chat Session: ${subject}`, subject!, chatHistory);
            }
        };
    }, [activeTool, chatHistory, subject]);
    
    const handleApiError = (err: unknown) => {
        if (err instanceof Error) {
            if (err.message.includes("Insufficient tokens")) {
                setError(
                    <span>
                        You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link> for unlimited access.
                    </span>
                );
            } else {
                setError(err.message);
            }
        } else {
            setError("An unknown error occurred.");
        }
        setIsLoading(false);
    };

    const handleSourceChange = (newSource: ContentSource) => {
        setContentSource(newSource);
        setError(null);
        setLocalSourceText('');
        setFileName('');
        setChapterInfo('');
        setChapterDetails('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setIsLoading(true);
        setFileName(file.name);
        setLoadingMessage('Reading file...');
        try {
            let text = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => item.str).join(' ');
                }
            } else if (file.type.includes('wordprocessingml')) { 
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else { 
                text = await file.text();
            }
            setLocalSourceText(text);
        } catch (err) {
            setError('Failed to process file.');
            setFileName('');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleYoutubeFetch = async () => {
        if(!youtubeUrl) { setError("Please enter a YouTube URL."); return; }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Analyzing video content...');
        try {
            const text = await geminiService.fetchYouTubeTranscript(youtubeUrl);
            setLocalSourceText(text);
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChapterSearch = async () => {
        if (!chapterInfo || !subject) { setError("Select subject and enter chapter name."); return; }
        setError(null);
        const searchFn = () => geminiService.fetchChapterContent(classLevel, subject!, chapterInfo, chapterDetails);
        startBackgroundSearch(searchFn);
    };

    const handleStartSession = () => {
        let currentText = contentSource === 'paste' ? pastedText : localSourceText;
        if (!subject || currentText.trim().length < 100) { setError("Select subject and provide content."); return; }
        setError(null);
        startSessionWithContent(currentText);
    };

    const handleToolSelection = async (tool: ActiveTool, path?: string) => {
        if (path) { navigate(path); return; }
        
        setActiveTool(tool);
        setError(null);
        
        if (tool === 'quiz') { setShowQuizSettings(true); return; }
        
        setIsLoading(true);
        try {
            switch(tool) {
                case 'chat':
                    if (!chatSession) {
                        setLoadingMessage('Accessing your study history...');
                        // 1. Fetch Context from Firestore
                        const studentContext = await userService.getStudentContext();
                        
                        setLoadingMessage('Initializing AI session...');
                        // 2. Create session with Context
                        const session = geminiService.createChatSession(subject!, classLevel, extractedText, studentContext);
                        
                        setChatSession(session);
                        setChatHistory([{ role: 'model', text: `Hi! I've reviewed your progress. I know what you're good at and where we need to focus. Ask me anything about **${subject}**!` }]);
                    }
                    break;
                case 'summary':
                    if (!smartSummary) {
                        setLoadingMessage('Creating your Smart Summary...');
                        const generatedSummary = await geminiService.generateSmartSummary(subject!, classLevel, extractedText);
                        setSmartSummary(generatedSummary);
                    }
                    break;
                case 'flashcards':
                    if (!flashcards) {
                        setLoadingMessage('Generating cards...');
                        const generatedFlashcards = await geminiService.generateFlashcards(extractedText);
                        setFlashcards(generatedFlashcards);
                    }
                    break;
                case 'mindmap':
                    if (!mindMapData) {
                        setLoadingMessage('Mapping concepts...');
                        const data = await geminiService.generateMindMapFromText(extractedText, classLevel);
                        setMindMapData(data);
                    }
                    break;
            }
        } catch (e) { handleApiError(e) } finally { setIsLoading(false); }
    };
    
    const handleGenerateQuiz = async () => {
        if (!subject) return;
        setShowQuizSettings(false);
        setIsLoading(true);
        setLoadingMessage('Creating quiz...');
        try {
            const generatedQuiz = await geminiService.generateQuiz(subject, classLevel, extractedText, quizQuestionCount, quizDifficulty, quizQuestionType);
            setQuiz(generatedQuiz);
        } catch (e) { handleApiError(e); } finally { setIsLoading(false); }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userMessage.trim() || !chatSession || isLoading) return;
        const newUserMessage: ChatMessage = { role: 'user', text: userMessage };
        setChatHistory(prev => [...prev, newUserMessage]);
        setUserMessage('');
        setIsLoading(true);
        try {
            const stream = await geminiService.sendMessageStream(chatSession, userMessage);
            let modelResponse = '';
            setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setChatHistory(prev => { const newHistory = [...prev]; newHistory[newHistory.length - 1].text = modelResponse; return newHistory; });
            }
        } catch (e) { handleApiError(e); setChatHistory(prev => prev.slice(0, -1)); } finally { setIsLoading(false); }
    };

    const handleGoBackToTools = () => { setActiveTool('none'); setQuiz(null); setError(null); };

    const renderContentInput = () => (
        <Card variant="light" className="!p-4 md:!p-8">
            <div className="space-y-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Let's Get Started</h2>
                    <p className="text-gray-600">First, tell us what you're studying.</p>
                </div>
                 {/* Step 1: Class & Subject */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-lg font-semibold text-slate-700 block mb-3">1. Select Your Class</label>
                        <select
                            value={classLevel}
                            onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                            className="w-full p-3 bg-white/60 border border-slate-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition text-slate-900"
                        >
                            {CLASS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-lg font-semibold text-slate-700 block mb-3">2. Select a Subject</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {SUBJECTS.map(({ name, icon: Icon }) => (
                                <button
                                    key={name}
                                    onClick={() => setSubject(name)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 text-sm interactive-3d ${subject === name ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20' : 'bg-white/50 text-slate-700 hover:bg-white/80 border-slate-300 hover:border-violet-400'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step 2: Content */}
                <div>
                    <label className="text-lg font-semibold text-slate-700 block mb-3">3. Provide Your Content</label>
                    <div className="flex space-x-1 rounded-t-lg bg-slate-100 p-1 w-full md:w-auto">
                        {(['paste', 'file', 'youtube', 'search'] as ContentSource[]).map(source => (
                            <button
                                key={source}
                                onClick={() => handleSourceChange(source)}
                                className={`flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${contentSource === source ? 'bg-white text-violet-600 shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
                            >
                                {source === 'paste' && <ClipboardIcon className="w-5 h-5" />}
                                {source === 'file' && <UploadIcon className="w-5 h-5" />}
                                {source === 'youtube' && <YouTubeIcon className="w-5 h-5" />}
                                {source === 'search' && <SearchIcon className="w-5 h-5" />}
                                <span className="capitalize">{source}</span>
                            </button>
                        ))}
                    </div>
                    <div className="bg-white/60 p-4 rounded-b-lg border-x border-b border-slate-300">
                        {contentSource === 'paste' &&
                            <textarea
                                value={pastedText}
                                onChange={(e) => setPastedText(e.target.value)}
                                placeholder="Paste your notes, a chapter, or any text here..."
                                className="w-full h-40 p-3 bg-white/80 border border-slate-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition text-slate-900 placeholder:text-slate-500"
                            />
                        }
                        {contentSource === 'file' &&
                            <div className="w-full h-40 p-3 border-2 bg-slate-200/50 rounded-lg flex flex-col items-center justify-center border-dashed border-slate-400">
                                <UploadIcon className="w-10 h-10 text-slate-500 mb-2"/>
                                <input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" className="hidden"/>
                                <label htmlFor="file-upload" className="text-violet-600 font-semibold cursor-pointer hover:underline">
                                    {fileName || "Choose a PDF, DOCX, or TXT file"}
                                </label>
                                <p className="text-xs text-slate-500 mt-1">{fileName ? `(File ready to be processed)` : `(Your file will be processed in the browser)`}</p>
                            </div>
                        }
                        {contentSource === 'youtube' &&
                            <div className="w-full h-40 p-3 rounded-lg flex flex-col justify-center gap-3">
                                <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full p-2 bg-white/80 border border-slate-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition text-slate-900 placeholder:text-slate-500"
                                />
                                <Button onClick={handleYoutubeFetch} disabled={isLoading} variant="secondary">
                                    {isLoading && loadingMessage.includes('Analyzing') ? <Spinner /> : 'Analyze Video'}
                                </Button>
                                {localSourceText && !isLoading && <p className="text-sm text-green-600 text-center font-semibold">Video content loaded successfully!</p>}
                            </div>
                        }
                        {contentSource === 'search' &&
                            <div className="w-full h-40 p-3 rounded-lg flex flex-col justify-center gap-3">
                                <input
                                    type="text"
                                    value={chapterInfo}
                                    onChange={e => setChapterInfo(e.target.value)}
                                    placeholder="Chapter name or number (e.g., 'Cell' or 'Ch 1')"
                                    className="w-full p-2 bg-white/80 border border-slate-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition text-slate-900 placeholder:text-slate-500"
                                />
                                <input
                                    type="text"
                                    value={chapterDetails}
                                    onChange={e => setChapterDetails(e.target.value)}
                                    placeholder="Optional details (e.g., NCERT, CBSE, author)"
                                     className="w-full p-2 bg-white/80 border border-slate-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition text-slate-900 placeholder:text-slate-500"
                                />
                                 <Button onClick={handleChapterSearch} disabled={searchStatus === 'searching' || !chapterInfo || !subject} variant="secondary">
                                     {searchStatus === 'searching' ? <Spinner /> : 'Find Chapter Content'}
                                 </Button>
                            </div>
                        }
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-center font-medium py-2">{error}</p>}
                
                <div className="text-center pt-4 flex items-center justify-center gap-4">
                    <Button onClick={handleStartSession} disabled={isLoading || searchStatus === 'searching' || !subject || (contentSource !== 'search' && !pastedText && !localSourceText)} size="lg">
                        {isLoading ? <><Spinner/> {loadingMessage}</> : 'Go to Dashboard'}
                    </Button>
                </div>
            </div>
        </Card>
    );

    const renderQuizSettings = () => (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <Card variant="dark" className="max-w-md w-full animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-6 text-white text-center">Configure Quiz</h3>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="question-count" className="block text-sm font-medium text-slate-300 mb-2">Number of Questions</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="1" 
                                max="15" 
                                value={quizQuestionCount} 
                                onChange={(e) => setQuizQuestionCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                            <span className="text-white font-bold w-8 text-center">{quizQuestionCount}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Question Types</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['mcq', 'written', 'both'] as QuestionTypeFilter[]).map((type) => (
                                <button
                                key={type}
                                type="button"
                                onClick={() => setQuizQuestionType(type)}
                                className={`py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all border
                                ${quizQuestionType === type ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <Button variant="ghost" onClick={() => { setShowQuizSettings(false); setActiveTool('none');}}>Cancel</Button>
                        <Button variant="primary" onClick={handleGenerateQuiz}>Start Quiz</Button>
                    </div>
                </div>
            </Card>
         </div>
    );

    const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => (
        <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
        >
            <Card
                onClick={() => {
                    if (tool.title === 'AI Chat') handleToolSelection('chat');
                    else if (tool.title === 'Generate Quiz') handleToolSelection('quiz');
                    else if (tool.title === 'Smart Summary') handleToolSelection('summary');
                    else if (tool.title === 'Flashcards') handleToolSelection('flashcards');
                    else if (tool.title === 'Mind Map') handleToolSelection('mindmap');
                    else navigate(tool.path);
                }}
                variant="glass"
                className="text-left !p-5 h-full flex flex-col relative overflow-hidden group border-slate-700/50 hover:border-violet-500/50 transition-colors duration-300 cursor-pointer"
            >
                <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                
                <div className="flex items-start gap-4 relative z-10">
                    <div className={`flex-shrink-0 mt-1 rounded-xl h-12 w-12 flex items-center justify-center bg-slate-800 border border-slate-700 ${tool.color}`}>
                        <tool.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">{tool.title}</h3>
                        <p className="mt-1 text-slate-400 text-xs leading-relaxed">{tool.description}</p>
                    </div>
                </div>
                {tool.requiresContent && (
                    <div className="mt-auto pt-3 flex justify-end">
                         <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">Content</span>
                    </div>
                )}
            </Card>
        </motion.div>
    );

    const renderDashboard = () => {
        const toolCategories: { name: string; tools: Tool[] }[] = [
            {
                name: 'Core Engine',
                tools: [
                    { path: '/app', icon: ChatBubbleIcon, title: 'AI Chat', description: 'Deep dive into your notes with an intelligent assistant.', requiresContent: true, color: 'text-cyan-400' },
                    { path: '/app', icon: LightBulbIcon, title: 'Generate Quiz', description: 'Test your mastery with adaptive quizzes.', requiresContent: true, color: 'text-yellow-400' },
                    { path: '/app', icon: DocumentDuplicateIcon, title: 'Smart Summary', description: 'Extract concepts & exam tips instantly.', requiresContent: true, color: 'text-emerald-400' },
                    { path: '/app', icon: RectangleStackIcon, title: 'Flashcards', description: 'Active recall made effortless.', requiresContent: true, color: 'text-pink-400' },
                    { path: '/mind-map', icon: BrainCircuitIcon, title: 'Mind Map', description: 'Visualize connections in a neural network style.', requiresContent: true, color: 'text-violet-400' },
                ]
            },
            {
                name: 'Advanced Simulations',
                tools: [
                    { path: '/visual-explanation', icon: VideoCameraIcon, title: 'Visual Explanation', description: 'Turn text into narrated AI videos.', requiresContent: true, color: 'text-rose-400' },
                    { path: '/live-debate', icon: GavelIcon, title: 'Debate Arena', description: 'Challenge an AI opponent in real-time.', requiresContent: true, color: 'text-orange-400' },
                    { path: '/chapter-conquest', icon: QuestIcon, title: 'Chapter Conquest', description: 'Gamify your notes into an RPG adventure.', requiresContent: true, color: 'text-amber-400' },
                ]
            },
            {
                name: 'Exam & Future',
                tools: [
                    { path: '/question-paper', icon: BookOpenIcon, title: 'Paper Generator', description: 'Create and grade custom exam papers.', requiresContent: true, color: 'text-indigo-400' },
                    { path: '/exam-predictor', icon: ExamPredictorIcon, title: 'Exam Predictor', description: 'AI predicts probable exam questions.', requiresContent: true, color: 'text-purple-400' },
                    { path: '/viva', icon: MicrophoneIcon, title: 'Viva Prep', description: 'Practice oral exams with a voice AI.', requiresContent: false, color: 'text-teal-400' },
                    { path: '/gemini-live', icon: ChatBubbleLeftRightIcon, title: 'Live Tutor', description: 'Voice conversation with an expert tutor.', requiresContent: false, color: 'text-sky-400' },
                ]
            },
            {
                name: 'Exploration Lab',
                tools: [
                    { path: '/ai-lab-assistant', icon: AILabAssistantIcon, title: 'Lab Assistant', description: 'Design experiments and safety protocols.', requiresContent: false, subjects: [Subject.Physics, Subject.Chemistry, Subject.Biology, Subject.Science], color: 'text-cyan-400' },
                    { path: '/historical-chat', icon: HistoricalChatIcon, title: 'History Chat', description: 'Talk to legends from the past.', requiresContent: false, subjects: [Subject.History, Subject.SST], color: 'text-amber-600' },
                    { path: '/personalized-learning-path', icon: LearningPathIcon, title: 'Learning Path', description: 'Diagnostic driven study curriculum.', requiresContent: false, color: 'text-emerald-500' },
                ]
            }
        ];

        if (activeTool !== 'none') {
             if (isLoading) return (
                <div className="flex flex-col items-center gap-4 py-20">
                    <Spinner className="w-16 h-16" colorClass="bg-violet-500" />
                    <p className="text-slate-400 animate-pulse text-lg font-medium">{loadingMessage}</p>
                </div>
            );

            return (
                <div className="max-w-5xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                         <Button onClick={handleGoBackToTools} variant="ghost" className="text-slate-400 hover:text-white">
                            &larr; Back to Command Center
                        </Button>
                        <h2 className="text-xl font-bold text-white">{activeTool === 'chat' ? 'AI Assistant' : activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</h2>
                    </div>
                    {error && <p className="text-red-400 bg-red-900/20 border border-red-800 p-4 rounded-lg text-center mb-6">{error}</p>}
                    
                    {activeTool === 'chat' && (
                        <Card variant="dark" className="h-[70vh] flex flex-col border-slate-700">
                            <div className="flex-grow p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && (
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-900/20">
                                            <ChatBubbleIcon className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-2xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-sm'}`}>
                                        <MessageContent text={msg.text} />
                                    </div>
                                    {msg.role === 'user' && (
                                         <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">YOU</span>
                                        </div>
                                    )}
                                </div>))}
                                <div ref={chatContainerRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex gap-3">
                                <input 
                                    type="text" 
                                    value={userMessage} 
                                    onChange={(e) => setUserMessage(e.target.value)} 
                                    placeholder="Ask a question about your content..." 
                                    className="flex-grow bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-slate-500"
                                />
                                <Button type="submit" disabled={isLoading || !userMessage.trim()} className="rounded-xl aspect-square flex items-center justify-center !p-0 w-12">
                                    <RocketLaunchIcon className="w-5 h-5 transform rotate-45" />
                                </Button>
                            </form>
                        </Card>
                    )}
                    {activeTool === 'quiz' && quiz && <QuizComponent questions={quiz} sourceText={extractedText} subject={subject!} />}
                    {activeTool === 'summary' && smartSummary && <SmartSummaryComponent summary={smartSummary} />}
                    {activeTool === 'flashcards' && flashcards && <FlashcardComponent flashcards={flashcards} />}
                    {activeTool === 'mindmap' && mindMapData && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-slate-800">Mind Map of Your Content</h3>
                                <p className="text-gray-600">Interact with the nodes to explore the concepts.</p>
                            </div>
                            <MindMap data={mindMapData} />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-10">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">AI Toolkit</h1>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <Button onClick={resetContent} variant="ghost" size="sm">
                            &larr; Start a New Session
                        </Button>
                    </div>
                </div>

                {/* Tool Grid */}
                <div className="space-y-12">
                {toolCategories.map((category, categoryIdx) => {
                    const filteredTools = category.tools.filter(tool => {
                        if (!subject) return true; 
                        if (!tool.subjects) return true; 
                        return tool.subjects.includes(subject); 
                    });

                    if (filteredTools.length === 0) return null;

                    return (
                        <div key={category.name}>
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-slate-700 tracking-wide uppercase">{category.name}</h2>
                                <div className="h-[1px] flex-grow bg-gradient-to-r from-slate-300 to-transparent"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredTools.map((tool, idx) => (
                                    <ToolCard key={tool.title} tool={tool} />
                                ))}
                            </div>
                        </div>
                    );
                })}
                </div>
                {showQuizSettings && renderQuizSettings()}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {!hasSessionStarted ? renderContentInput() : renderDashboard()}
        </div>
    );
};

export default AppPage;
