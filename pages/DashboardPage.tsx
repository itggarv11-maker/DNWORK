import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import {
    AcademicCapIcon, BookOpenIcon, BrainCircuitIcon, CalendarIcon, ChatBubbleIcon, ChatBubbleLeftRightIcon,
    ClipboardIcon, DocumentDuplicateIcon, GavelIcon, LightBulbIcon, MicrophoneIcon, QuestIcon, RectangleStackIcon,
    RocketLaunchIcon, VideoCameraIcon,
    AILabAssistantIcon, HistoricalChatIcon, PoetryProseIcon, ConceptAnalogyIcon, EthicalDilemmaIcon,
    WhatIfHistoryIcon, ExamPredictorIcon, RealWorldIcon, LearningPathIcon
} from '../components/icons';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { QuizQuestion, ChatMessage, Flashcard, SmartSummary, QuizDifficulty, Subject } from '../types';
import * as geminiService from '../services/geminiService';
import { Chat } from '@google/genai';
import QuizComponent from '../components/app/QuizComponent';
import FlashcardComponent from '../components/app/FlashcardComponent';
import MathRenderer from '../components/common/MathRenderer';
import SmartSummaryComponent from '../components/app/SmartSummaryComponent';
import { saveWorkToHistory } from '../utils/history';

interface Tool {
    path: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    requiresContent: boolean;
    subjects?: Subject[];
}

const toolCategories: { name: string; tools: Tool[] }[] = [
    {
        name: 'Core Study Tools',
        tools: [
            { path: '/app', icon: ChatBubbleIcon, title: 'AI Chat', description: 'Ask questions and get instant answers about your notes.', requiresContent: true },
            { path: '/app', icon: LightBulbIcon, title: 'Generate Quiz', description: 'Test your knowledge with custom quizzes.', requiresContent: true },
            { path: '/app', icon: DocumentDuplicateIcon, title: 'Smart Summary', description: 'Get concepts, analogies & exam tips from your text.', requiresContent: true },
            { path: '/app', icon: RectangleStackIcon, title: 'Flashcards', description: 'Create flippable cards for quick revision.', requiresContent: true },
            { path: '/mind-map', icon: BrainCircuitIcon, title: 'Mind Map', description: 'Visualize the core concepts from your text.', requiresContent: true },
        ]
    },
    {
        name: 'Advanced Learning',
        tools: [
            { path: '/visual-explanation', icon: VideoCameraIcon, title: 'Visual Explanation', description: 'Generate a narrated video summary of your content.', requiresContent: true },
            { path: '/live-debate', icon: GavelIcon, title: 'Live Debate Arena', description: 'Defend your knowledge in a real-time debate with an AI challenger.', requiresContent: true },
            { path: '/chapter-conquest', icon: QuestIcon, title: 'Chapter Conquest', description: 'Play a 2D adventure game to master your chapter.', requiresContent: true },
            { path: '/poetry-prose-analysis', icon: PoetryProseIcon, title: 'Poetry & Prose Analyst', description: 'Get deep analysis of any literary work.', requiresContent: true, subjects: [Subject.English] },
            { path: '/concept-analogy', icon: ConceptAnalogyIcon, title: 'Concept Analogy Generator', description: 'Understand complex topics with simple analogies.', requiresContent: false },
            { path: '/real-world-applications', icon: RealWorldIcon, title: 'Real-World Applications', description: 'Connect academic concepts to real-life industries.', requiresContent: false },
        ]
    },
    {
        name: 'Exam & Career Prep',
        tools: [
            { path: '/question-paper', icon: BookOpenIcon, title: 'Question Paper Generator', description: 'Create custom exam papers from your notes.', requiresContent: true },
            { path: '/exam-predictor', icon: ExamPredictorIcon, title: 'Exam Paper Predictor', description: 'Get a predicted paper based on your syllabus.', requiresContent: true },
            { path: '/viva', icon: MicrophoneIcon, title: 'Viva Prep', description: 'Practice for oral exams with a live AI examiner.', requiresContent: false },
            { path: '/gemini-live', icon: ChatBubbleLeftRightIcon, title: 'Talk to Teacher', description: 'Have a live voice conversation with your AI tutor.', requiresContent: false },
            { path: '/study-planner', icon: CalendarIcon, title: 'Smart Study Planner', description: 'Get a custom, day-by-day study schedule.', requiresContent: false },
            { path: '/career-guidance', icon: RocketLaunchIcon, title: 'AI Career Guidance', description: 'Discover personalized career paths and roadmaps.', requiresContent: false },
        ]
    },
    {
        name: 'Unique Explorations',
        tools: [
            { path: '/ai-lab-assistant', icon: AILabAssistantIcon, title: 'AI Lab Assistant', description: 'Design experiments, get hypotheses, and safety protocols.', requiresContent: false, subjects: [Subject.Physics, Subject.Chemistry, Subject.Biology, Subject.Science] },
            { path: '/historical-chat', icon: HistoricalChatIcon, title: 'Historical Figure Chat', description: 'Chat with historical figures like Einstein.', requiresContent: false, subjects: [Subject.History, Subject.SST] },
            { path: '/ethical-dilemma', icon: EthicalDilemmaIcon, title: 'Ethical Dilemma Simulator', description: 'Explore complex moral problems and challenge your reasoning.', requiresContent: false },
            { path: '/what-if-history', icon: WhatIfHistoryIcon, title: '"What If?" History Explorer', description: 'Explore alternate historical scenarios.', requiresContent: false, subjects: [Subject.History, Subject.SST] },
            { path: '/personalized-learning-path', icon: LearningPathIcon, title: 'Personalized Learning Path', description: 'Get a custom study plan based on your weak points.', requiresContent: false },
        ]
    }
];


type ActiveTool = 'chat' | 'quiz' | 'summary' | 'flashcards' | 'none';
type QuestionTypeFilter = 'mcq' | 'written' | 'both';

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

    // Use dangerouslySetInnerHTML to render markdown/HTML from Gemini, then KaTeX runs on it
    return <div ref={contentRef} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />;
};


const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { extractedText, subject, classLevel, hasSessionStarted, resetContent } = useContent();
    const { currentUser, userName } = useAuth();

    useEffect(() => {
        if (!hasSessionStarted) {
            navigate('/new-session');
        }
    }, [hasSessionStarted, navigate]);

    // State for internally-rendered tools
    const [activeTool, setActiveTool] = useState<ActiveTool>('none');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [error, setError] = useState<React.ReactNode | null>(null);

    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [smartSummary, setSmartSummary] = useState<SmartSummary | null>(null);
    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
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

    const handleApiError = (err: unknown) => {
        if (err instanceof Error) {
            setError(err.message.includes("Insufficient tokens")
                ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
                : err.message);
        } else {
            setError("An unknown error occurred.");
        }
        setIsLoading(false);
    };

    const handleToolSelection = async (tool: ActiveTool) => {
        if (!extractedText && tool !== 'none') {
            setError("Please provide content first to use this tool. You can start a new session.");
            return;
        }
        
        setActiveTool(tool);
        setError(null);
        
        if (tool === 'quiz') {
            setShowQuizSettings(true);
            return;
        }
        
        setIsLoading(true);

        try {
            switch(tool) {
                case 'chat':
                    if (!chatSession) {
                        setLoadingMessage('Initializing AI session...');
                        const session = geminiService.createChatSession(subject!, classLevel, extractedText);
                        setChatSession(session);
                        setChatHistory([{ role: 'model', text: `Hi there! I'm ready to help you with ${subject} for ${classLevel}. Ask me anything about your notes.` }]);
                    }
                    break;
                case 'summary':
                    if (!smartSummary) {
                        setLoadingMessage('Creating your Smart Summary...');
                        const generatedSummary = await geminiService.generateSmartSummary(subject!, classLevel, extractedText);
                        setSmartSummary(generatedSummary);
                        saveWorkToHistory({
                            type: 'Smart Summary',
                            title: generatedSummary.title,
                            data: generatedSummary,
                            subject: subject || undefined
                        });
                    }
                    break;
                case 'flashcards':
                    if (!flashcards) {
                        setLoadingMessage('Generating flashcards...');
                        const generatedFlashcards = await geminiService.generateFlashcards(extractedText);
                        setFlashcards(generatedFlashcards);
                        saveWorkToHistory({
                            type: 'Flashcards',
                            title: `Flashcards for ${subject || 'content'}`,
                            data: generatedFlashcards,
                            subject: subject || undefined
                        });
                    }
                    break;
            }
        } catch (e) {
            handleApiError(e)
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateQuiz = async () => {
        if (!subject) return;
        setShowQuizSettings(false);
        setIsLoading(true);
        setLoadingMessage('Generating your quiz...');
        setError(null);
        try {
            const generatedQuiz = await geminiService.generateQuiz(subject, classLevel, extractedText, quizQuestionCount, quizDifficulty, quizQuestionType);
            setQuiz(generatedQuiz);
        } catch (e) {
            handleApiError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userMessage.trim() || !chatSession || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: userMessage };
        setChatHistory(prev => [...prev, newUserMessage]);
        setUserMessage('');
        setIsLoading(true);
        setError(null);
        
        try {
            const stream = await geminiService.sendMessageStream(chatSession, userMessage);
            let modelResponse = '';
            setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = modelResponse;
                    return newHistory;
                });
            }
        } catch (e) {
            handleApiError(e);
            setChatHistory(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleGoBackToTools = () => {
        setActiveTool('none');
        setQuiz(null);
        setError(null);
    };

    const handleToolClick = (tool: Tool) => {
        if (tool.requiresContent && !extractedText) {
            navigate('/new-session');
            return;
        }

        switch (tool.title) {
            case 'AI Chat': handleToolSelection('chat'); break;
            case 'Generate Quiz': handleToolSelection('quiz'); break;
            case 'Smart Summary': handleToolSelection('summary'); break;
            case 'Flashcards': handleToolSelection('flashcards'); break;
            default: navigate(tool.path); break;
        }
    };

    const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => (
        <Card
            onClick={() => handleToolClick(tool)}
            className="text-left !p-5 cursor-pointer bg-slate-800/5 hover:!bg-slate-800/10 !border-slate-800/10 flex flex-col h-full"
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 text-violet-600 bg-white rounded-lg h-12 w-12 flex items-center justify-center border-2 border-slate-200">
                    <tool.icon className="w-7 h-7" />
                </div>
                <div className="flex-grow">
                    <h3 className="text-base font-bold text-slate-800">{tool.title}</h3>
                    <p className="mt-1 text-slate-600 text-xs leading-snug">{tool.description}</p>
                </div>
            </div>
             {tool.requiresContent && <span className="text-xs font-bold text-violet-500 mt-2 ml-auto">REQUIRES CONTENT</span>}
        </Card>
    );
    
    const renderQuizSettings = () => (
         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card variant="light" className="max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-slate-800 text-center">Customize Your Quiz</h3>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="question-count" className="block text-sm font-medium text-slate-700 mb-1">Number of Questions (Max 15)</label>
                        <input type="number" id="question-count" value={quizQuestionCount} onChange={(e) => setQuizQuestionCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))} min="1" max="15" className="mt-1 block w-full px-3 py-2 bg-white/80 border border-slate-400 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Question Types</label>
                        <div className="flex rounded-md shadow-sm">
                            {(['mcq', 'written', 'both'] as QuestionTypeFilter[]).map((type, idx) => (
                                <button key={type} type="button" onClick={() => setQuizQuestionType(type)} className={`py-2 px-4 w-full text-sm font-medium transition-colors border border-slate-300 ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 2 ? 'rounded-r-lg' : ''} ${quizQuestionType === type ? 'bg-violet-600 text-white' : 'bg-white/70'}`}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 pt-2">
                        <Button variant="outline" onClick={() => { setShowQuizSettings(false); setActiveTool('none');}}>Cancel</Button>
                        <Button onClick={handleGenerateQuiz}>Generate Quiz</Button>
                    </div>
                </div>
            </Card>
         </div>
    );
    
    const renderToolUI = () => {
        if (showQuizSettings) return renderQuizSettings();
        if (isLoading) return <div className="flex flex-col items-center gap-4 py-10"><Spinner className="w-12 h-12" colorClass="bg-violet-600" /><p>{loadingMessage}</p></div>;
        
        switch(activeTool) {
            case 'chat':
                return (
                    <Card variant="light"><div className="flex flex-col h-[60vh] bg-white/50 rounded-lg border border-slate-300">
                        <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                            {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <span className="flex-shrink-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-sm">AI</span>}
                                <div className={`max-w-xl p-3 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-100'}`}>
                                    <MessageContent text={msg.text} />
                                </div>
                                {msg.role === 'user' && <span className="flex-shrink-0 w-8 h-8 bg-slate-400 text-white rounded-full flex items-center justify-center font-bold text-sm">You</span>}
                            </div>))}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t bg-slate-100/50 rounded-b-lg flex gap-2">
                            <input type="text" value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="Ask a question..." className="w-full p-2 bg-white border border-slate-300 rounded-lg"/>
                            <Button type="submit" disabled={isLoading || !userMessage.trim()}>Send</Button>
                        </form>
                    </div></Card>
                );
            case 'quiz': return quiz ? <QuizComponent questions={quiz} sourceText={extractedText} subject={subject!} /> : null;
            case 'summary': return smartSummary && <SmartSummaryComponent summary={smartSummary} />;
            case 'flashcards': return flashcards && <FlashcardComponent flashcards={flashcards} />;
            default: return null;
        }
    };

    if (!hasSessionStarted) {
        return <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12" /></div>;
    }

    if (activeTool !== 'none') {
        return (
            <div>
                <div className="text-center mb-8">
                     <Button onClick={handleGoBackToTools} variant="ghost" size="sm">
                        &larr; Back to Dashboard
                    </Button>
                </div>
                {error && <p className="text-red-500 text-center font-medium mb-4">{error}</p>}
                {renderToolUI()}
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <Card variant="light" className="!p-8 bg-gradient-to-br from-violet-50 via-white to-pink-50">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                        Welcome, {userName || currentUser?.email?.split('@')[0] || 'Student'}!
                    </h1>
                     <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                        {extractedText 
                            ? `Your ${subject ? `**${subject}**` : ''} notes for **${classLevel}** are loaded. Choose a tool to begin!`
                            : "No content loaded. Choose a tool that doesn't require content, or start a new session."
                        }
                    </p>
                    <div className="mt-6">
                        <Button onClick={resetContent} size="lg">
                            <AcademicCapIcon className="w-6 h-6"/>
                            Start a New Study Session
                        </Button>
                    </div>
                </div>
            </Card>

            {toolCategories.map(category => {
                const filteredTools = category.tools.filter(tool => {
                    if (!subject) return true; // Show all if no subject is set
                    if (!tool.subjects) return true; // Generic tool, always show
                    return tool.subjects.includes(subject); // Show if subject matches
                });

                if (filteredTools.length === 0) return null;

                return (
                    <div key={category.name}>
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">{category.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredTools.map(tool => <ToolCard key={tool.title} tool={tool} />)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DashboardPage;