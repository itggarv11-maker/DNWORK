
import React, { useState } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import { Subject, ClassLevel } from '../types';
import { SUBJECTS, CLASS_LEVELS } from '../constants';
import * as geminiService from '../services/geminiService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';
import { UploadIcon } from '../components/icons/UploadIcon';
import { YouTubeIcon } from '../components/icons/YouTubeIcon';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { useContent } from '../contexts/ContentContext';
import { demoChapters } from '../services/demoContent';

// Required for pdf.js to work
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

type ContentSource = 'paste' | 'file' | 'youtube' | 'search';

const NewSessionPage: React.FC = () => {
    const navigate = useNavigate();
    const { 
        setSubject: setGlobalSubject, 
        setClassLevel: setGlobalClassLevel, 
        startBackgroundSearch,
        startSessionWithContent
    } = useContent();
    
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [contentSource, setContentSource] = useState<ContentSource>('paste');
    const [pastedText, setPastedText] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [chapterInfo, setChapterInfo] = useState('');
    const [chapterDetails, setChapterDetails] = useState('');
    const [localSourceText, setLocalSourceText] = useState('');
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [error, setError] = useState<React.ReactNode | null>(null);

    const handleApiError = (err: unknown) => {
        if (err instanceof Error) {
            if (err.message.includes("Insufficient tokens")) {
                setError(<span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-400">upgrade to Premium</Link>.</span>);
            } else {
                setError(err.message);
            }
        } else {
            setError("An unknown error occurred.");
        }
    };

    const handleSourceChange = (newSource: ContentSource) => {
        setContentSource(newSource);
        setError(null);
        setLocalSourceText('');
        setFileName('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setIsLoading(true);
        setFileName(file.name);
        setLoadingMessage('Decoding file...');
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
            setError('Failed to process file. Corrupted or unsupported.');
            setFileName('');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleYoutubeFetch = async () => {
        if(!youtubeUrl) { setError("Please enter a YouTube URL."); return; }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Extracting transcript...');
        try {
            const text = await geminiService.fetchYouTubeTranscript(youtubeUrl);
            setLocalSourceText(text);
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChapterSearch = () => {
        if (!chapterInfo || !subject) { setError("Subject and chapter name required."); return; }
        setError(null);
        setGlobalSubject(subject);
        setGlobalClassLevel(classLevel);
        const searchFn = () => geminiService.fetchChapterContent(classLevel, subject!, chapterInfo, chapterDetails);
        startBackgroundSearch(searchFn);
        navigate('/app');
    };
    
    const handleDemoChapterLoad = (demoId: string) => {
        const demo = demoChapters.find(c => c.id === demoId);
        if (!demo) return;
        setGlobalSubject(demo.subject);
        setGlobalClassLevel(demo.classLevel);
        startSessionWithContent(demo.content);
        navigate('/app');
    };

    const handleStartSession = () => {
        let currentText = contentSource === 'paste' ? pastedText : localSourceText;
        if (!subject || currentText.trim().length < 100) {
            setError("Please select a subject and provide sufficient content (100+ chars).");
            return;
        }
        setGlobalSubject(subject);
        setGlobalClassLevel(classLevel);
        startSessionWithContent(currentText);
        navigate('/app');
    };

    return (
        <div className="max-w-4xl mx-auto pt-8">
            <Card variant="dark" className="!p-8 md:!p-12 border-slate-800">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Initialize Data Stream</h1>
                    <p className="text-slate-400 mt-2 text-lg">Input your study material to activate the AI Neural Core.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Configuration Column */}
                    <div className="md:col-span-4 space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Class Level</label>
                            <select
                                value={classLevel}
                                onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white transition-all"
                            >
                                {CLASS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Target Subject</label>
                            <div className="grid grid-cols-2 gap-2">
                                {SUBJECTS.map(({ name, icon: Icon }) => (
                                    <button
                                        key={name}
                                        onClick={() => setSubject(name)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${subject === name ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/50' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                    >
                                        <Icon className="w-5 h-5 mb-1" />
                                        <span className="text-[10px] font-medium">{name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Input Column */}
                    <div className="md:col-span-8 space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Data Source</label>
                            <div className="flex p-1 bg-slate-900 rounded-xl mb-4 border border-slate-800">
                                {(['paste', 'file', 'youtube', 'search'] as ContentSource[]).map(source => (
                                    <button
                                        key={source}
                                        onClick={() => handleSourceChange(source)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${contentSource === source ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {source === 'paste' && <ClipboardIcon className="w-4 h-4" />}
                                        {source === 'file' && <UploadIcon className="w-4 h-4" />}
                                        {source === 'youtube' && <YouTubeIcon className="w-4 h-4" />}
                                        {source === 'search' && <SearchIcon className="w-4 h-4" />}
                                        <span className="capitalize hidden sm:inline">{source}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-1 min-h-[200px]">
                                {contentSource === 'paste' &&
                                    <textarea
                                        value={pastedText}
                                        onChange={(e) => setPastedText(e.target.value)}
                                        placeholder="> Paste raw text data here..."
                                        className="w-full h-64 p-4 bg-transparent border-none text-slate-300 placeholder-slate-600 focus:ring-0 font-mono text-sm resize-none"
                                    />
                                }
                                {contentSource === 'file' &&
                                    <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/20">
                                        <UploadIcon className="w-12 h-12 text-slate-600 mb-3"/>
                                        <input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" className="hidden"/>
                                        <label htmlFor="file-upload" className="text-violet-400 font-bold cursor-pointer hover:text-violet-300 hover:underline">
                                            {fileName || "Select Document"}
                                        </label>
                                        <p className="text-xs text-slate-500 mt-2">PDF, DOCX, TXT supported</p>
                                    </div>
                                }
                                {contentSource === 'youtube' &&
                                    <div className="w-full h-64 flex flex-col items-center justify-center p-6 space-y-4">
                                        <input
                                            type="url"
                                            value={youtubeUrl}
                                            onChange={e => setYoutubeUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none transition"
                                        />
                                        <Button onClick={handleYoutubeFetch} disabled={isLoading} variant="secondary" className="w-full">
                                            {isLoading ? <Spinner /> : 'Analyze Video Stream'}
                                        </Button>
                                        {localSourceText && !isLoading && <p className="text-green-400 text-xs font-mono">>> Video transcript extracted successfully.</p>}
                                    </div>
                                }
                                {contentSource === 'search' &&
                                    <div className="w-full h-64 flex flex-col justify-center p-6 space-y-4">
                                        <input
                                            type="text"
                                            value={chapterInfo}
                                            onChange={e => setChapterInfo(e.target.value)}
                                            placeholder="Chapter Name / Number"
                                            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none transition"
                                        />
                                        <input
                                            type="text"
                                            value={chapterDetails}
                                            onChange={e => setChapterDetails(e.target.value)}
                                            placeholder="Details (e.g. Board, Author)"
                                            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none transition"
                                        />
                                         <Button onClick={handleChapterSearch} disabled={!chapterInfo || !subject} variant="secondary" className="w-full">
                                             Initiate Deep Search
                                         </Button>
                                    </div>
                                }
                            </div>
                        </div>
                        
                        {error && <p className="text-red-400 bg-red-900/20 border border-red-800/50 p-3 rounded-lg text-center text-sm font-medium">{error}</p>}
                        
                        <div className="pt-2">
                            <Button onClick={handleStartSession} disabled={isLoading || !subject || (contentSource !== 'search' && !pastedText && !localSourceText)} size="lg" className="w-full text-lg font-bold py-4 shadow-lg shadow-violet-900/20">
                                {isLoading ? <><Spinner/> {loadingMessage}</> : 'Upload to Dashboard'}
                            </Button>
                        </div>
                         
                        {/* Demo Shortcut */}
                        <div className="pt-6 border-t border-slate-800 text-center">
                            <p className="text-xs text-slate-600 mb-3 uppercase tracking-widest">Quick Access Demos</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {demoChapters.map(demo => (
                                    <button key={demo.id} onClick={() => handleDemoChapterLoad(demo.id)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-700 transition">
                                        {demo.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default NewSessionPage;
