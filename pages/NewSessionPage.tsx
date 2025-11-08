
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
    // Global Content State
    const { 
        setSubject: setGlobalSubject, 
        setClassLevel: setGlobalClassLevel, 
        startBackgroundSearch,
        startSessionWithContent
    } = useContent();
    
    // Local Page State for content input
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [contentSource, setContentSource] = useState<ContentSource>('paste');
    const [pastedText, setPastedText] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [chapterInfo, setChapterInfo] = useState('');
    const [chapterDetails, setChapterDetails] = useState('');
    const [localSourceText, setLocalSourceText] = useState('');
    
    // UI State
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [error, setError] = useState<React.ReactNode | null>(null);

    
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
        setLocalSourceText(''); 
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
            setError('Failed to process file. It might be corrupted or in an unsupported format.');
            setFileName('');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleYoutubeFetch = async () => {
        if(!youtubeUrl) {
            setError("Please enter a YouTube URL.");
            return;
        }
        setError(null);
        setLocalSourceText('');
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

    const handleChapterSearch = () => {
        if (!chapterInfo || !subject) {
            setError("Please select a subject and enter a chapter name.");
            return;
        }
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
        let currentText = '';
        if (contentSource === 'paste') currentText = pastedText;
        else currentText = localSourceText;

        if (!subject || currentText.trim().length < 100) {
            setError("Please select a subject and provide sufficient content (at least 100 characters).");
            return;
        }
        
        setError(null);
        setGlobalSubject(subject);
        setGlobalClassLevel(classLevel);
        startSessionWithContent(currentText);
        navigate('/app');
    };

    return (
        <Card variant="light" className="!p-4 md:!p-8">
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-800">Start a New Study Session</h1>
                    <p className="text-gray-600">Provide your study material to unlock content-aware AI tools.</p>
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
                        <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map(({ name, icon: Icon }) => (
                                <button
                                    key={name}
                                    onClick={() => setSubject(name)}
                                    className={`flex-auto flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 text-sm interactive-3d ${subject === name ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20' : 'bg-white/50 text-slate-700 hover:bg-white/80 border-slate-300 hover:border-violet-400'}`}
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
                    <div className="flex flex-wrap sm:flex-nowrap space-x-1 rounded-t-lg bg-slate-100 p-1 w-full">
                        {(['paste', 'file', 'youtube', 'search'] as ContentSource[]).map(source => (
                            <button
                                key={source}
                                onClick={() => handleSourceChange(source)}
                                className={`flex items-center gap-2 w-full justify-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${contentSource === source ? 'bg-white text-violet-600 shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
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
                                 <Button onClick={handleChapterSearch} disabled={!chapterInfo || !subject} variant="secondary">
                                     Search & Start Session
                                 </Button>
                            </div>
                        }
                    </div>
                </div>

                 {/* Demo Chapters */}
                <div className="text-center pt-2">
                    <p className="text-sm font-medium text-slate-600 mb-3">Or, try a demo chapter:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {demoChapters.map(demo => (
                            <Button key={demo.id} onClick={() => handleDemoChapterLoad(demo.id)} variant="outline" size="sm">
                                {demo.title}
                            </Button>
                        ))}
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-center font-medium py-2">{error}</p>}
                
                <div className="text-center pt-4 flex items-center justify-center gap-4">
                    <Button onClick={handleStartSession} disabled={isLoading || !subject || (contentSource !== 'search' && !pastedText && !localSourceText)} size="lg">
                        {isLoading ? <><Spinner/> {loadingMessage}</> : 'Start Session with My Content'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default NewSessionPage;
