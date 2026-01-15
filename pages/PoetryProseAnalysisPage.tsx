import React, { useState } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import Card from '../components/common/Card';
import { PoetryProseIcon } from '../components/icons/PoetryProseIcon';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { useContent } from '../contexts/ContentContext';
import * as geminiService from '../services/geminiService';
import { LiteraryAnalysis } from '../types';
import { saveWorkToHistory } from '../utils/history';

const PoetryProseAnalysisPage: React.FC = () => {
    const navigate = useNavigate();
    const { extractedText, subject } = useContent();

    const [textToAnalyze, setTextToAnalyze] = useState(extractedText);
    const [analysis, setAnalysis] = useState<LiteraryAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    
     const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleAnalyze = async () => {
        if (textToAnalyze.trim().length < 50) {
            setError('Please provide at least 50 characters of text to analyze.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await geminiService.analyzeLiteraryText(textToAnalyze);
            setAnalysis(result);
            saveWorkToHistory({
                type: 'Literary Analysis',
                title: `Analysis of "${result.title}"`,
                data: result,
                subject: subject || undefined
            });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => (
         <Card variant="light" className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <PoetryProseIcon className="w-16 h-16 mx-auto text-violet-600" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">Poetry & Prose Analyst</h1>
                <p className="mt-2 text-slate-600">Get deep analysis of any literary work, including themes, literary devices, and character motivations.</p>
            </div>
             <div className="space-y-4">
                <textarea
                    value={textToAnalyze}
                    onChange={(e) => setTextToAnalyze(e.target.value)}
                    placeholder="Paste a poem, story, or chapter here..."
                    className="w-full h-60 p-3 bg-white/80 border border-slate-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                />
                {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                <div className="text-center">
                    <Button onClick={handleAnalyze} size="lg" disabled={isLoading}>
                        {isLoading ? <Spinner colorClass="bg-white" /> : 'Analyze Text'}
                    </Button>
                </div>
            </div>
        </Card>
    );

    const renderAnalysis = () => (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800">Analysis of "{analysis?.title}"</h1>
                {analysis?.author && <p className="text-lg text-slate-600 mt-1">by {analysis.author}</p>}
            </div>
            <Card variant="light">
                <h2 className="text-xl font-bold text-slate-700 mb-2">Summary</h2>
                <p className="text-slate-600">{analysis?.overallSummary}</p>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
                <Card variant="light">
                    <h2 className="text-xl font-bold text-slate-700 mb-3">Major Themes</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                        {analysis?.themes.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Card>
                 <Card variant="light">
                    <h2 className="text-xl font-bold text-slate-700 mb-3">Literary Devices</h2>
                    <div className="space-y-2 text-sm">
                        {analysis?.literaryDevices.map((item, i) => (
                            <div key={i}>
                                <p className="font-semibold text-violet-700">{item.device}:</p>
                                <p className="text-slate-600 italic">"{item.example}"</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            {analysis?.characterAnalysis && analysis.characterAnalysis.length > 0 && (
                 <Card variant="light">
                    <h2 className="text-xl font-bold text-slate-700 mb-3">Character Analysis</h2>
                    <div className="space-y-4">
                        {analysis.characterAnalysis.map((item, i) => (
                            <div key={i}>
                                <h3 className="font-bold text-slate-800">{item.character}</h3>
                                <p className="text-slate-600 text-sm">{item.analysis}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
            <div className="text-center">
                <Button onClick={() => setAnalysis(null)} variant="outline">Analyze Another Text</Button>
            </div>
        </div>
    );
    
    return isLoading ? (
        <div className="flex justify-center items-center py-10">
            <Spinner className="w-12 h-12" colorClass="bg-violet-600" />
        </div>
    ) : analysis ? renderAnalysis() : renderForm();
};

export default PoetryProseAnalysisPage;