import React, { useState } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import { Subject, ClassLevel } from '../types';
import { SUBJECTS, CLASS_LEVELS } from '../constants';
import * as geminiService from '../services/geminiService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';
import { UploadIcon, YouTubeIcon, ClipboardIcon, SearchIcon, DocumentDuplicateIcon, XMarkIcon } from '../components/icons';
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { useContent } from '../contexts/ContentContext';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion';

// FIXED: Exact version sync
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

type ContentSource = 'paste' | 'file' | 'youtube' | 'search';

const NewSessionPage: React.FC = () => {
    const navigate = useNavigate();
    const { setSubject: setGlobalSubject, setClassLevel: setGlobalClassLevel, startBackgroundSearch, startSessionWithContent } = useContent();
    
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [contentSource, setContentSource] = useState<ContentSource>('paste');
    
    const [pastedText, setPastedText] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [chapterInfo, setChapterInfo] = useState('');
    const [chapterDetails, setChapterDetails] = useState('');
    
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<React.ReactNode | null>(null);

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const processAllFiles = async () => {
        let combinedText = '';
        for (const file of files) {
            setLoadingMessage(`Extracting: ${file.name}...`);
            try {
                if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    // ADVANCED: Using more resilient loading options
                    const loadingTask = pdfjs.getDocument({
                        data: arrayBuffer,
                        useWorkerFetch: false,
                        isEvalSupported: false,
                        disableFontFace: true, // Crucial for notes with custom fonts
                        verbosity: 0
                    });
                    
                    const pdf = await loadingTask.promise;
                    let fileText = '';
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        try {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            const strings = content.items
                                .filter((item: any) => item.str)
                                .map((item: any) => item.str);
                            fileText += strings.join(' ') + ' ';
                        } catch (pageErr) {
                            console.warn(`Skipping page ${i} due to minor corruption.`);
                        }
                    }
                    
                    if (fileText.trim().length < 10) {
                        throw new Error("PDF seems to be empty or contains only scanned images without OCR.");
                    }
                    combinedText += fileText + '\n';
                } else if (file.type.includes('wordprocessingml')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const res = await mammoth.extractRawText({ arrayBuffer });
                    combinedText += res.value + '\n';
                } else {
                    combinedText += await file.text() + '\n';
                }
            } catch (fileErr: any) {
                console.error(`Error processing ${file.name}:`, fileErr);
                throw new Error(`Failed to decode ${file.name}. It might be encrypted or a scanned image. Try converting to text or using OCR.`);
            }
        }
        return combinedText;
    };

    const handleStartSession = async () => {
        if (!subject) return setError("Select a subject module.");
        setIsLoading(true);
        setError(null);
        
        try {
            let finalContent = '';
            if (contentSource === 'paste') {
                finalContent = pastedText;
            } else if (contentSource === 'file') {
                if (files.length === 0) throw new Error("No files selected.");
                finalContent = await processAllFiles();
            } else if (contentSource === 'youtube') {
                if (!youtubeUrl) throw new Error("Enter YouTube URL.");
                setLoadingMessage("Scanning Neural Audio Stream...");
                finalContent = await geminiService.fetchYouTubeTranscript(youtubeUrl);
            } else if (contentSource === 'search') {
                if (!chapterInfo) throw new Error("Enter chapter name.");
                setGlobalSubject(subject);
                setGlobalClassLevel(classLevel);
                const searchFn = () => geminiService.fetchChapterContent(classLevel, subject!, chapterInfo, chapterDetails);
                startBackgroundSearch(searchFn);
                navigate('/app');
                return;
            }

            if (finalContent.trim().length < 50) {
                throw new Error("Source data too short. Provide more academic content.");
            }
            
            setGlobalSubject(subject);
            setGlobalClassLevel(classLevel);
            startSessionWithContent(finalContent);
            navigate('/app');
        } catch (err: any) {
            setError(err.message || "Link unstable. Please retry.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-10 pb-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                    <Card variant="dark" className="!p-6 border-slate-800">
                        <h2 className="text-xs font-black text-violet-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                             <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                             Link Config
                        </h2>
                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Target Grade</label>
                                <select value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all">
                                    {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Subject Module</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SUBJECTS.map(s => (
                                        <button 
                                            key={s.name} 
                                            onClick={() => setSubject(s.name)} 
                                            className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${subject === s.name ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'}`}
                                        >
                                            <s.icon className="w-6 h-6 mb-2" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">{s.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card variant="dark" className="!p-8 border-slate-800 h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-20"></div>
                        
                        <div className="flex flex-wrap gap-2 mb-10 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                            {[
                                { id: 'paste', label: 'Paste', icon: ClipboardIcon },
                                { id: 'file', label: 'PDF/Docs', icon: DocumentDuplicateIcon },
                                { id: 'youtube', label: 'YouTube', icon: YouTubeIcon },
                                { id: 'search', label: 'Book Search', icon: SearchIcon }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setContentSource(tab.id as any)} className={`flex-grow flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-300 ${contentSource === tab.id ? 'bg-slate-800 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-300'}`}>
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-grow min-h-[350px]">
                            <AnimatePresence mode="wait">
                                {contentSource === 'paste' && (
                                    <motion.div key="paste" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                                        <textarea value={pastedText} onChange={e => setPastedText(e.target.value)} placeholder="> Input raw academic text here..." className="w-full h-full min-h-[350px] bg-slate-950/40 p-8 rounded-3xl text-slate-300 font-mono text-sm border border-slate-800 focus:ring-2 focus:ring-violet-500 outline-none resize-none leading-relaxed shadow-inner" />
                                    </motion.div>
                                )}
                                {contentSource === 'file' && (
                                    <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {files.map((f, i) => (
                                                <div key={i} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <DocumentDuplicateIcon className="w-5 h-5 text-violet-400 flex-shrink-0" />
                                                        <span className="text-[10px] font-bold text-slate-300 truncate tracking-tight">{f.name}</span>
                                                    </div>
                                                    <button onClick={() => removeFile(i)} className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <input type="file" multiple onChange={handleFileSelection} className="hidden" id="multi-file-input" accept=".pdf,.txt,.docx"/>
                                            <label htmlFor="multi-file-input" className="p-8 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/40 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group">
                                                <UploadIcon className="w-10 h-10 text-slate-600 group-hover:text-violet-400 mb-4 transition-colors" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Academic Files</span>
                                                <span className="text-[8px] text-slate-600 mt-2">MULTI-PDF & DOCX SUPPORT</span>
                                            </label>
                                        </div>
                                    </motion.div>
                                )}
                                {contentSource === 'youtube' && (
                                    <motion.div key="yt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">YouTube Intel Link</label>
                                            <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-slate-900 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                    </motion.div>
                                )}
                                {contentSource === 'search' && (
                                    <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800 space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Crawl Knowledge Base</label>
                                            <input type="text" value={chapterInfo} onChange={e => setChapterInfo(e.target.value)} placeholder="Chapter Name (e.g. Optics, Mughal Empire)" className="w-full bg-slate-900 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-violet-500" />
                                            <input type="text" value={chapterDetails} onChange={e => setChapterDetails(e.target.value)} placeholder="Context (e.g. Class 11 Physics NCERT)" className="w-full bg-slate-900 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {error && <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">{error}</div>}

                        <div className="mt-10 pt-8 border-t border-slate-800/50">
                             <Button onClick={handleStartSession} disabled={isLoading} className="w-full h-18 !text-lg !font-black !rounded-3xl shadow-[0_20px_50px_rgba(124,58,237,0.2)]">
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <Spinner colorClass="bg-white" />
                                        <span>CALIBRATING NEURAL CORE...</span>
                                    </div>
                                ) : (
                                    'INITIALIZE NEURAL SESSION'
                                )}
                             </Button>
                        </div>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
};

export default NewSessionPage;