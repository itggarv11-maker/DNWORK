import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'https://esm.sh/react-router-dom';
import Card from '../components/common/Card';
import { ExamPredictorIcon, DownloadIcon } from '../components/icons';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QuestionPaper } from '../types';
import * as geminiService from '../services/geminiService';
import { useContent } from '../contexts/ContentContext';
import { saveWorkToHistory } from '../utils/history';
import MathRenderer from '../components/common/MathRenderer';

const ExamPredictorPage: React.FC = () => {
    const { extractedText, subject } = useContent();
    const navigate = useNavigate();
    
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [totalMarks, setTotalMarks] = useState(80);
    
    const [paper, setPaper] = useState<QuestionPaper | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const paperRef = useRef<HTMLDivElement>(null);

     const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extractedText) {
            setError('Please start a session with some content first.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setPaper(null);
        try {
            const result = await geminiService.predictExamPaper(extractedText, difficulty, totalMarks, subject);
            setPaper(result);
            saveWorkToHistory({
                type: 'Predicted Exam Paper',
                title: result.title,
                data: result,
                subject: subject || undefined
            });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadPdf = () => {
        if (!paperRef.current) return;
        setIsLoading(true);
        html2canvas(paperRef.current, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasHeight / canvasWidth;
            
            const imgWidth = pdfWidth - 20;
            const imgHeight = imgWidth * ratio;
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft > 0) {
              position = -heightLeft + 10;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
              heightLeft -= (pdfHeight - 20);
            }
            
            pdf.save('predicted-paper.pdf');
            setIsLoading(false);
        });
    };

    if (!extractedText && !isLoading) {
        return (
            <div className="text-center">
                <Card variant="light" className="max-w-xl mx-auto">
                    <h1 className="text-2xl font-bold text-slate-800">No Content Found</h1>
                    <p className="mt-2 text-slate-600">
                        To predict a question paper, you first need to provide some study material.
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => navigate('/new-session')}>
                            Go to New Session to Add Content
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const renderForm = () => (
        <Card variant="light" className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <ExamPredictorIcon className="w-16 h-16 mx-auto text-violet-600" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">Exam Paper Predictor</h1>
                <p className="mt-2 text-slate-600">Our AI will generate a predicted question paper based on your loaded content and selected difficulty.</p>
            </div>
            <div className="p-4 bg-slate-100/50 rounded-lg border border-slate-200 mb-6">
                <p className="text-sm font-semibold text-slate-700">Content Loaded:</p>
                <p className="text-xs text-slate-600 mt-1 italic truncate">{extractedText}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="totalMarks" className="block text-sm font-medium text-slate-700">Total Marks</label>
                        <input type="number" id="totalMarks" value={totalMarks} onChange={(e) => setTotalMarks(parseInt(e.target.value))} className="mt-1 block w-full p-2 bg-white/60 border border-slate-400 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700">Difficulty</label>
                        <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="mt-1 block w-full p-2 bg-white/60 border border-slate-400 rounded-md">
                            <option>Easy</option><option>Medium</option><option>Hard</option>
                        </select>
                    </div>
                </div>
                {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
                <div className="text-center pt-2">
                    <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading ? <Spinner colorClass="bg-white" /> : 'Predict Paper'}
                    </Button>
                </div>
            </form>
        </Card>
    );
    
    const renderPaper = () => (
         <div className="space-y-6">
            <div className="text-center space-y-4">
                <div className="flex justify-center items-center gap-4">
                     <Button onClick={handleDownloadPdf} variant="secondary" disabled={isLoading}>
                        {isLoading ? <Spinner /> : <><DownloadIcon className="w-5 h-5" /> Download as PDF</>}
                    </Button>
                    <Button onClick={() => setPaper(null)} variant="outline">Predict Another Paper</Button>
                </div>
            </div>
            <div ref={paperRef} className="p-8 bg-white text-black rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center">{paper?.title}</h2>
                <div className="flex justify-between my-2 text-sm font-medium">
                    <span>Predicted Paper ({subject})</span>
                    <span>Total Marks: {paper?.totalMarks}</span>
                </div>
                <p className="text-xs italic my-4">{paper?.instructions}</p>
                <hr className="my-4"/>
                <div className="space-y-6">
                    {paper?.questions.map((q, index) => (
                        <div key={index}>
                            <div className="flex justify-between items-start">
                                <div className="font-semibold flex-grow">
                                     <MathRenderer text={`${index + 1}. ${q.question}`} />
                                </div>
                                <span className="font-bold text-sm whitespace-nowrap ml-4">[{q.marks} Marks]</span>
                            </div>
                            {q.questionType === 'mcq' && q.options && (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 pl-4 text-sm">
                                    {q.options.map((opt, i) => <MathRenderer key={i} text={`${String.fromCharCode(97 + i)}) ${opt}`} />)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    
    return isLoading && !paper ? (
        <div className="flex justify-center items-center py-10">
            <Spinner className="w-12 h-12" colorClass="bg-violet-600" />
        </div>
    ) : paper ? renderPaper() : renderForm();
};

export default ExamPredictorPage;