
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion';
import {
    AcademicCapIcon, BookOpenIcon, BrainCircuitIcon, ChatBubbleIcon,
    DocumentDuplicateIcon, GavelIcon, LightBulbIcon, QuestIcon, RectangleStackIcon,
    RocketLaunchIcon, VideoCameraIcon, BeakerIcon, ExamPredictorIcon, LearningPathIcon,
    SparklesIcon, ArrowRightIcon, MicrophoneIcon
} from '../components/icons';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { QuizQuestion, ChatMessage, Flashcard, SmartSummary, MindMapNode, Subject } from '../types';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
import { Chat } from '@google/genai';
import QuizComponent from '../components/app/QuizComponent';
import FlashcardComponent from '../components/app/FlashcardComponent';
import SmartSummaryComponent from '../components/app/SmartSummaryComponent';
import MindMap from '../components/app/MindMap';
import MarkdownRenderer from '../components/common/MarkdownRenderer';

interface Tool {
    path: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    requiresContent: boolean;
    color: string; 
}

const toolCategories: { name: string; tools: Tool[] }[] = [
    {
        name: 'Neural Core',
        tools: [
            { path: '/app', icon: ChatBubbleIcon, title: 'Neural Chat', description: 'High-fidelity cognitive processing of your notes.', requiresContent: true, color: 'text-cyan-400' },
            { path: '/app', icon: LightBulbIcon, title: 'Diagnostic Quiz', description: 'Adaptive testing of your neural pathways.', requiresContent: true, color: 'text-yellow-400' },
            { path: '/app', icon: DocumentDuplicateIcon, title: 'Smart Summary', description: 'Synthesis of core concepts and formulae.', requiresContent: true, color: 'text-emerald-400' },
            { path: '/app', icon: RectangleStackIcon, title: 'Flashcards', description: 'Rapid active recall training.', requiresContent: true, color: 'text-pink-400' },
            { path: '/mind-map', icon: BrainCircuitIcon, title: 'Neural Map', description: '3D conceptual visualization of knowledge nodes.', requiresContent: true, color: 'text-violet-400' },
        ]
    },
    {
        name: 'Reality Simulations',
        tools: [
            { path: '/digital-lab', icon: BeakerIcon, title: 'Digital Lab 3D', description: 'Hyper-realistic science simulations.', requiresContent: false, color: 'text-blue-400' },
            { path: '/visual-explanation', icon: VideoCameraIcon, title: 'Visual Narrator', description: 'Synthetic video generation from text.', requiresContent: true, color: 'text-rose-400' },
            { path: '/live-debate', icon: GavelIcon, title: 'Arena of Logic', description: 'Real-time argumentation against AI.', requiresContent: true, color: 'text-orange-400' },
            { path: '/chapter-conquest', icon: QuestIcon, title: 'Chapter Odyssey', description: 'RPG-tier mastery of subject material.', requiresContent: true, color: 'text-amber-400' },
        ]
    }
];

type ActiveTool = 'chat' | 'quiz' | 'summary' | 'flashcards' | 'mindmap' | 'none';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { extractedText, subject, classLevel, sessionId } = useContent();
    const { userName } = useAuth();

    const [activeTool, setActiveTool] = useState<ActiveTool>('none');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState('Initializing...');
    const [error, setError] = useState<string | null>(null);

    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [smartSummary, setSmartSummary] = useState<SmartSummary | null>(null);
    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatActivityId, setChatActivityId] = useState<string | null>(null);
    const [userMessage, setUserMessage] = useState('');
    
    const [showQuizSettings, setShowQuizSettings] = useState(false);
    const [quizQuestionCount, setQuizQuestionCount] = useState<number>(5);

    const handleToolClick = (tool: Tool) => {
        if (tool.requiresContent && !extractedText) {
            navigate('/new-session');
            return;
        }
        if (tool.title === 'Neural Chat') handleToolSelection('chat');
        else if (tool.title === 'Diagnostic Quiz') handleToolSelection('quiz');
        else if (tool.title === 'Smart Summary') handleToolSelection('summary');
        else if (tool.title === 'Flashcards') handleToolSelection('flashcards');
        else if (tool.title === 'Neural Map') handleToolSelection('mindmap');
        else navigate(tool.path);
    };

    const handleToolSelection = async (tool: ActiveTool) => {
        setError(null);
        if (tool === 'quiz') {
            setShowQuizSettings(true);
            return;
        }
        
        setIsLoading(true);
        setActiveTool(tool);
        
        try {
            switch(tool) {
                case 'chat':
                    if (!chatSession) {
                        const context = await userService.getStudentContext();
                        const session = geminiService.createChatSession(subject!, classLevel, extractedText, context);
                        setChatSession(session);
                        const initialMsg: ChatMessage = { role: 'model', text: `Neural Link Active. Ready for analysis. Session: ${sessionId?.substring(0,8)}` };
                        setChatHistory([initialMsg]);
                        const id = await userService.saveActivity('chat', `Chat: ${subject}`, subject!, [initialMsg], {}, sessionId);
                        if (id) setChatActivityId(id);
                    }
                    break;
                case 'summary':
                    setLoadingMessage('Synthesizing Summary...');
                    const sRes = await geminiService.generateSmartSummary(subject!, classLevel, extractedText);
                    setSmartSummary(sRes);
                    await userService.saveActivity('summary', sRes.title, subject!, sRes, {}, sessionId);
                    break;
                case 'flashcards':
                    setLoadingMessage('Generating Flashcards...');
                    const fRes = await geminiService.generateFlashcards(extractedText);
                    setFlashcards(fRes);
                    await userService.saveActivity('flashcards', `Flashcards: ${subject}`, subject!, fRes, {}, sessionId);
                    break;
                case 'mindmap':
                    setLoadingMessage('Mapping Connections...');
                    const mRes = await geminiService.generateMindMapFromText(extractedText, classLevel);
                    setMindMapData(mRes);
                    await userService.saveActivity('mindmap', `Mindmap: ${mRes.term}`, subject!, mRes, {}, sessionId);
                    break;
            }
        } catch (e: any) { 
            setError(e.message || "Connection error."); 
            setActiveTool('none');
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleGenerateQuiz = async () => {
        setIsLoading(true);
        setShowQuizSettings(false);
        setActiveTool('quiz');
        setLoadingMessage('Building Quiz...');
        try {
            const res = await geminiService.generateQuiz(subject!, classLevel, extractedText, quizQuestionCount, 'Medium', 'mcq');
            if (!res || res.length === 0) throw new Error("Synthesis failed.");
            setQuiz(res);
        } catch (e: any) {
            setError(e.message);
            setActiveTool('none');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAbort = () => {
        setActiveTool('none');
        setQuiz(null);
        setFlashcards(null);
        setSmartSummary(null);
        setMindMapData(null);
        setChatSession(null);
        setError(null);
    };

    return (
        <div className="max-w-[1600px] mx-auto px-6 space-y-12 pb-32">
            {activeTool === 'none' ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-10">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">STUBRO <span className="text-violet-500">HQ</span></h1>
                            <p className="text-slate-500 font-mono-tech mt-2 tracking-widest uppercase">NODE: {userName} | SESSION: {sessionId?.substring(0,8)}</p>
                        </motion.div>
                        <Link to="/new-session">
                            <Button size="lg" className="h-16 px-10 !bg-violet-600 shadow-xl">NEW NEURAL SESSION</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...toolCategories[0].tools, ...toolCategories[1].tools].map(tool => (
                            <motion.div key={tool.title} whileHover={{ y: -5 }} onClick={() => handleToolClick(tool)} className="cursor-pointer h-full">
                                <Card variant="glass" className="h-full !p-8 hover:border-violet-500/50 group">
                                    <div className={`w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon className="w-8 h-8"/></div>
                                    <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
                                    <p className="text-slate-500 text-sm">{tool.description}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <Button onClick={handleAbort} variant="ghost" className="opacity-60 hover:opacity-100 font-black uppercase text-[10px] tracking-widest">&larr; ABORT MODULE & RETURN TO HQ</Button>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTool} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {isLoading ? (
                                <div className="py-40 flex flex-col items-center gap-6 animate-in fade-in duration-700">
                                    <Spinner className="w-20 h-20" colorClass="bg-violet-500"/>
                                    <div className="text-center">
                                        <p className="text-3xl font-black uppercase tracking-tighter text-white">{loadingMessage}</p>
                                        <p className="text-slate-500 font-mono-tech text-[10px] uppercase mt-2 tracking-[0.4em]">Calibrating Neural core</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <Card variant="dark" className="!p-20 text-center border-red-500/20 max-w-2xl mx-auto">
                                    <p className="text-red-500 font-bold uppercase tracking-widest text-sm mb-4">{error}</p>
                                    <Button onClick={handleAbort} variant="secondary">Reset</Button>
                                </Card>
                            ) : (
                                <>
                                    {activeTool === 'chat' && (
                                        <Card variant="dark" className="h-[75vh] flex flex-col border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                                            <div className="flex-grow p-8 space-y-6 overflow-y-auto bg-slate-950/30">
                                                {chatHistory.map((msg, i) => (
                                                    <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-violet-600/20 border border-violet-500/30 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                                                            <MarkdownRenderer content={msg.text} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                if (!userMessage.trim() || !chatSession) return;
                                                const msg = userMessage;
                                                setUserMessage('');
                                                const updated = [...chatHistory, { role: 'user', text: msg } as ChatMessage];
                                                setChatHistory(updated);
                                                const stream = await geminiService.sendMessageStream(chatSession, msg);
                                                let response = '';
                                                const historyWithSlot = [...updated, { role: 'model', text: '' } as ChatMessage];
                                                setChatHistory(historyWithSlot);
                                                for await (const chunk of stream) {
                                                    response += chunk.text;
                                                    setChatHistory(prev => {
                                                        const h = [...prev];
                                                        h[h.length - 1].text = response;
                                                        return h;
                                                    });
                                                }
                                                if (chatActivityId) await userService.updateActivity(chatActivityId, [...updated, { role: 'model', text: response }]);
                                            }} className="p-6 bg-slate-900 border-t border-white/5 flex gap-4">
                                                <input value={userMessage} onChange={e => setUserMessage(e.target.value)} placeholder="QUERY..." className="flex-grow bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-mono text-xs" />
                                                <Button type="submit" className="w-14 h-14 !p-0"><RocketLaunchIcon/></Button>
                                            </form>
                                        </Card>
                                    )}
                                    {activeTool === 'summary' && smartSummary && <SmartSummaryComponent summary={smartSummary} />}
                                    {activeTool === 'quiz' && quiz && <QuizComponent questions={quiz} sourceText={extractedText} subject={subject!} />}
                                    {activeTool === 'flashcards' && flashcards && <FlashcardComponent flashcards={flashcards} />}
                                    {activeTool === 'mindmap' && mindMapData && <MindMap data={mindMapData} />}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {showQuizSettings && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                     <Card variant="dark" className="max-w-md w-full !p-10 border-slate-700 shadow-2xl">
                         <h3 className="text-2xl font-black text-white text-center mb-8 uppercase">Module Config</h3>
                         <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Neural Depth</label>
                                    <span className="text-violet-400 font-mono-tech font-bold">{quizQuestionCount}</span>
                                </div>
                                <input type="range" min="1" max="15" value={quizQuestionCount} onChange={e => setQuizQuestionCount(parseInt(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                            </div>
                            <div className="flex gap-4">
                                <Button onClick={() => setShowQuizSettings(false)} variant="ghost" className="flex-1">ABORT</Button>
                                <Button onClick={handleGenerateQuiz} className="flex-[2] h-14">INITIALIZE</Button>
                            </div>
                         </div>
                     </Card>
                 </div>
            )}
        </div>
    );
};

export default DashboardPage;
