
import React, { useState, useEffect } from 'react';
import { QuizQuestion, Subject } from '../../types';
import * as geminiService from '../../services/geminiService';
import * as userService from '../../services/userService';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Card from '../common/Card';
import { 
    CheckCircleIcon, XCircleIcon, LightBulbIcon, SpeakerWaveIcon, 
    MicrophoneIcon, StopIcon, CameraIcon 
} from '../icons';
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

    if (!questions || questions.length === 0) {
        return (
            <Card variant="dark" className="text-center !p-20 border-red-500/20">
                <p className="text-red-400 font-black uppercase tracking-widest">Neural Link Error</p>
                <p className="text-slate-500 text-sm mt-2 font-mono">CODE: EMPTY_MODULE</p>
            </Card>
        );
    }

    const currentQ = questions[currentIndex] || questions[0];
    const isMCQType = currentQ.type === 'mcq';

    const handleCheck = async () => {
        setIsChecking(true);
        setError(null);
        try {
            let result: any = { 
                question: currentQ.question,
                type: currentQ.type,
                correctAnswer: currentQ.correctAnswer,
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
            setError("Validation timeout.");
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
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setIsFinished(true);
        const score = answeredQuestions.reduce((acc, q) => {
            if (q.type === 'mcq') return acc + (q.isCorrect ? 1 : 0);
            return acc + (q.feedback?.marksAwarded || 0);
        }, 0);
        const total = questions.reduce((acc, q) => acc + (q.type === 'mcq' ? 1 : 5), 0);
        await userService.saveActivity('quiz', `Diagnostic: ${subject}`, subject, {
            score: `${score}/${total}`,
            details: answeredQuestions,
            timestamp: new Date().toISOString()
        });
    };

    if (isFinished) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 max-w-4xl mx-auto pb-20">
                <Card variant="dark" className="text-center !p-12 border-violet-500/30">
                    <h2 className="text-5xl font-black text-white uppercase mb-2">RESULTS SYNCED</h2>
                    <div className="inline-block px-10 py-6 bg-slate-950 rounded-[2rem] border border-white/10 mb-8 mt-6">
                        <p className="text-5xl font-black text-white">
                            {answeredQuestions.reduce((acc, q) => acc + (q.type === 'mcq' ? (q.isCorrect ? 1 : 0) : (q.feedback?.marksAwarded || 0)), 0)} 
                            <span className="text-slate-700 mx-2">/</span>
                            {questions.reduce((acc, q) => acc + (q.type === 'mcq' ? 1 : 5), 0)}
                        </p>
                    </div>
                    <div className="flex justify-center"><Button onClick={() => window.location.reload()} size="lg">CLOSE</Button></div>
                </Card>

                <div className="space-y-4">
                    {answeredQuestions.map((q, i) => (
                        <Card key={i} variant="glass" className="!p-6 border-slate-800">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-200 text-lg"><MathRenderer text={`${i + 1}. ${q.question}`} /></h4>
                                {q.type === 'mcq' ? (
                                    q.isCorrect ? <CheckCircleIcon className="w-7 h-7 text-green-500"/> : <XCircleIcon className="w-7 h-7 text-red-500"/>
                                ) : (
                                    <span className="text-violet-400 font-black text-xs">{q.feedback?.marksAwarded}/5</span>
                                )}
                            </div>
                            <div className="p-5 bg-slate-950/80 rounded-2xl text-slate-400 text-sm">
                                <MarkdownRenderer content={`**Analysis:** ${q.explanation}`} />
                            </div>
                        </Card>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end px-4">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{subject} Module</h2>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-violet-600" animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>
            </div>

            <Card variant="dark" className="!p-10 border-slate-800 relative overflow-hidden shadow-2xl">
                <div className="mb-12 text-2xl font-bold text-white leading-relaxed">
                    <MathRenderer text={currentQ.question} />
                </div>

                <div className="space-y-4">
                    {isMCQType ? (
                        currentQ.options?.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => !showFeedback && setSelectedOption(opt)}
                                className={`w-full p-6 rounded-3xl text-left border-2 transition-all font-medium ${
                                    selectedOption === opt 
                                    ? 'bg-violet-600 border-violet-500 text-white shadow-xl' 
                                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                                } ${showFeedback && opt === currentQ.correctAnswer ? '!bg-green-600/20 !border-green-500 !text-white' : ''}
                                ${showFeedback && selectedOption === opt && opt !== currentQ.correctAnswer ? '!bg-red-600/20 !border-red-500 !text-white' : ''}`}
                            >
                                <MathRenderer text={opt} />
                            </button>
                        ))
                    ) : (
                        <textarea
                            value={writtenAnswer}
                            onChange={e => setWrittenAnswer(e.target.value)}
                            disabled={showFeedback}
                            placeholder="NEURAL RESPONSE REQUIRED..."
                            className="w-full h-56 bg-slate-950/80 border-2 border-slate-800 p-8 rounded-[2.5rem] text-slate-200 outline-none"
                        />
                    )}
                </div>

                {showFeedback && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-6">
                        <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Neural Logic</p>
                            <MarkdownRenderer content={currentQ.explanation} />
                        </div>
                    </motion.div>
                )}

                <div className="mt-12 flex justify-end">
                    {!showFeedback ? (
                        <Button 
                            onClick={handleCheck} 
                            disabled={isChecking || (isMCQType ? !selectedOption : !writtenAnswer.trim())} 
                            className="h-20 px-16 !rounded-[2rem] !text-lg !font-black"
                        >
                            {isChecking ? <Spinner colorClass="bg-white" /> : 'VALIDATE'}
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="h-20 px-16 !rounded-[2rem] !text-lg !font-black">
                            {currentIndex < questions.length - 1 ? 'PROCEED' : 'ARCHIVE'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default QuizComponent;
