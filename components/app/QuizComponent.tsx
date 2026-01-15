
import React, { useState, useEffect } from 'react';
import { QuizQuestion, Subject } from '../../types';
import * as geminiService from '../../services/geminiService';
import * as userService from '../../services/userService';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Card from '../common/Card';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from '../icons';
import MathRenderer from '../common/MathRenderer';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion';

interface QuizComponentProps {
    questions: QuizQuestion[];
    sourceText: string;
    subject: Subject;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ questions, sourceText, subject }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [writtenAnswer, setWrittenAnswer] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [answeredQuestions, setAnsweredQuestions] = useState<any[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentQ = questions[currentIndex];
    const isMCQType = currentQ?.type === 'mcq';

    const handleCheck = async () => {
        setIsChecking(true);
        setError(null);
        try {
            let result: any = { 
                question: currentQ.question,
                type: currentQ.type,
                explanation: currentQ.explanation
            };

            if (isMCQType) {
                result.userAnswer = selectedOption;
                result.isCorrect = selectedOption === currentQ.correctAnswer;
            } else {
                const feedback = await geminiService.evaluateWrittenAnswer(sourceText, currentQ.question, writtenAnswer);
                result.userAnswer = writtenAnswer;
                result.feedback = feedback;
            }

            setAnsweredQuestions(prev => [...prev, result]);
            setShowFeedback(true);
        } catch (e) {
            setError("Analysis failed. Retrying...");
        } finally {
            setIsChecking(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setWrittenAnswer('');
            setShowFeedback(false);
        } else {
            setIsFinished(true);
            saveResults();
        }
    };

    const saveResults = async () => {
        const score = answeredQuestions.reduce((acc, q) => acc + (q.isCorrect ? 1 : (q.feedback?.marksAwarded || 0)), 0);
        const total = questions.reduce((acc, q) => acc + (q.type === 'mcq' ? 1 : 5), 0);
        const analysis = await geminiService.analyzeStudentPerformance('quiz', { score: `${score}/${total}`, subject });
        await userService.saveActivity('quiz', `Mastery Test: ${subject}`, subject, answeredQuestions, analysis);
    };

    if (isFinished) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in zoom-in duration-500">
                <Card variant="dark" className="text-center !p-12 border-violet-500/30">
                    <h2 className="text-4xl font-black text-white uppercase mb-4 tracking-tighter">Diagnostic Complete</h2>
                    <div className="inline-block px-12 py-8 bg-slate-950 rounded-3xl border border-white/10 shadow-2xl mb-8">
                        <p className="text-6xl font-black text-white">
                            {answeredQuestions.reduce((acc, q) => acc + (q.isCorrect ? 1 : (q.feedback?.marksAwarded || 0)), 0)} 
                            <span className="text-slate-700 text-3xl mx-2">/</span>
                            {questions.reduce((acc, q) => acc + (q.type === 'mcq' ? 1 : 5), 0)}
                        </p>
                    </div>
                    <div className="flex justify-center"><Button onClick={() => window.location.reload()} size="lg">START NEW MODULE</Button></div>
                </Card>
                <div className="space-y-4">
                    {answeredQuestions.map((q, i) => (
                        <Card key={i} variant="glass" className="!p-6 border-slate-800">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-200 text-lg"><MathRenderer text={`${i + 1}. ${q.question}`} /></h4>
                                {q.type === 'mcq' ? (
                                    q.isCorrect ? <CheckCircleIcon className="w-6 h-6 text-green-500"/> : <XCircleIcon className="w-6 h-6 text-red-500"/>
                                ) : (
                                    <span className="text-violet-400 font-black">{q.feedback?.marksAwarded}/5</span>
                                )}
                            </div>
                            <div className="p-4 bg-slate-950/50 rounded-xl text-slate-400 text-sm italic">
                                <MarkdownRenderer content={`**AI Analysis:** ${q.explanation}`} />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <motion.div className="h-full bg-violet-600" animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>

            <Card variant="dark" className="!p-10 border-slate-800 shadow-2xl">
                <div className="mb-10 text-2xl font-bold text-white leading-relaxed">
                    <MathRenderer text={currentQ.question} />
                </div>

                <div className="space-y-4">
                    {isMCQType ? (
                        currentQ.options?.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => !showFeedback && setSelectedOption(opt)}
                                className={`w-full p-6 rounded-2xl text-left border-2 transition-all font-medium ${
                                    selectedOption === opt ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                } ${showFeedback && opt === currentQ.correctAnswer ? '!bg-green-600/20 !border-green-500 !text-white' : ''}`}
                            >
                                <MathRenderer text={opt} />
                            </button>
                        ))
                    ) : (
                        <textarea
                            value={writtenAnswer}
                            onChange={e => setWrittenAnswer(e.target.value)}
                            disabled={showFeedback}
                            placeholder="Type your explanation..."
                            className="w-full h-48 bg-slate-950 border-2 border-slate-800 p-6 rounded-3xl text-white outline-none focus:border-violet-500"
                        />
                    )}
                </div>

                <AnimatePresence>
                    {showFeedback && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                            <h4 className="font-bold text-indigo-400 flex items-center gap-2 mb-2"><LightBulbIcon className="w-4 h-4"/> Neural Logic</h4>
                            <MarkdownRenderer content={currentQ.explanation} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-10 flex justify-end">
                    {!showFeedback ? (
                        <Button onClick={handleCheck} disabled={isChecking || (isMCQType ? !selectedOption : !writtenAnswer.trim())} size="lg" className="px-12 h-16 !rounded-2xl">
                            {isChecking ? <Spinner colorClass="bg-white" /> : 'CHECK ANSWER'}
                        </Button>
                    ) : (
                        <Button onClick={handleNext} size="lg" className="px-12 h-16 !rounded-2xl">
                            {currentIndex < questions.length - 1 ? 'NEXT MODULE' : 'FINISH'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default QuizComponent;
