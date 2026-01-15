
import React, { useState } from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import Card from '../components/common/Card';
import { LearningPathIcon } from '../components/icons/LearningPathIcon';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import { QuizQuestion, LearningPath, Subject, ClassLevel } from '../types';
import { CLASS_LEVELS } from '../constants';
import MathRenderer from '../components/common/MathRenderer';
import { saveWorkToHistory } from '../utils/history';

type LearningStep = 'topic' | 'quiz' | 'path';

const PersonalizedLearningPathPage: React.FC = () => {
    const [step, setStep] = useState<LearningStep>('topic');
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState<Subject>(Subject.Science);
    const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
    const [diagnosticQuiz, setDiagnosticQuiz] = useState<QuizQuestion[] | null>(null);
    const [quizResults, setQuizResults] = useState<QuizQuestion[] | null>(null);
    const [learningPath, setLearningPath] = useState<LearningPath | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<React.ReactNode | null>(null);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleGenerateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Generating diagnostic quiz...');
        try {
            // A short, medium-difficulty quiz is good for diagnostics
            const quiz = await geminiService.generateQuiz(subject, classLevel, `Generate a diagnostic quiz on ${topic}`, 5, 'Medium', 'mcq');
            setDiagnosticQuiz(quiz);
            setStep('quiz');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuizComplete = async (answeredQuestions: QuizQuestion[]) => {
        setQuizResults(answeredQuestions);
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Analyzing your results and creating your learning path...');
        try {
            const path = await geminiService.generateLearningPath(topic, subject, classLevel, answeredQuestions);
            setLearningPath(path);
            saveWorkToHistory({
                type: 'Personalized Learning Path',
                title: path.mainTopic,
                data: path,
                subject: subject
            });
            setStep('path');
        } catch(err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    // This is a special version of the QuizComponent for diagnostics
    const DiagnosticQuizRunner: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
        const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>([]);
        const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
        const [selectedOption, setSelectedOption] = useState<string | null>(null);

        const handleNext = () => {
            const currentQ = questions[currentQuestionIndex];
            const answeredQ = { ...currentQ, userAnswer: selectedOption, isCorrect: selectedOption === currentQ.correctAnswer };
            const newAnswered = [...answeredQuestions, answeredQ];
            setAnsweredQuestions(newAnswered);
            setSelectedOption(null);

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                handleQuizComplete(newAnswered);
            }
        };

        const q = questions[currentQuestionIndex];
        return (
            <Card variant="light">
                 <p className="text-center font-bold text-slate-700">Question {currentQuestionIndex + 1} of {questions.length}</p>
                 <div className="text-lg font-semibold my-4"><MathRenderer text={q.question} /></div>
                 <div className="space-y-2">
                    {q.options?.map(opt => (
                        <button key={opt} onClick={() => setSelectedOption(opt)} className={`w-full text-left p-3 rounded-md border ${selectedOption === opt ? 'bg-violet-200 border-violet-400' : 'bg-slate-100/50 hover:bg-slate-200/50'}`}>
                            <MathRenderer text={opt} />
                        </button>
                    ))}
                 </div>
                 <div className="text-right mt-4">
                    <Button onClick={handleNext} disabled={!selectedOption}>
                        {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish & Get Path'}
                    </Button>
                 </div>
            </Card>
        );
    };

    const renderTopicSetup = () => (
         <Card variant="light" className="text-center max-w-2xl mx-auto">
            <LearningPathIcon className="w-20 h-20 mx-auto text-violet-500" />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">Personalized Learning Path</h1>
            <p className="mt-2 text-slate-600">
                Enter a topic, take a quick diagnostic quiz, and the AI will create a custom study plan targeting your weak points.
            </p>
            <form onSubmit={handleGenerateQuiz} className="mt-8 space-y-4">
                 <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-slate-700">What topic do you want to master?</label>
                    <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., 'Trigonometry' or 'The Mughal Empire'" className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
                        <select id="subject" value={subject} onChange={e => setSubject(e.target.value as Subject)} className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm">
                            {[Subject.Math, Subject.Physics, Subject.Chemistry, Subject.Biology, Subject.History, Subject.Geography, Subject.English].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="classLevel" className="block text-sm font-medium text-slate-700">Class Level</label>
                        <select id="classLevel" value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm">
                            {CLASS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                </div>
                <Button type="submit" size="lg" disabled={!topic}>Start Diagnostic Quiz</Button>
            </form>
        </Card>
    );

    const renderLearningPath = () => (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
                 <h1 className="text-3xl font-bold text-slate-800">Your Learning Path for "<MathRenderer text={learningPath?.mainTopic || ''} />"</h1>
                 <p className="mt-2 text-slate-600">Based on your quiz, we'll focus on these areas: <span className="font-semibold text-violet-700"><MathRenderer text={learningPath?.weakAreas.join(', ') || ''} /></span></p>
            </div>
            <div className="space-y-4">
            {learningPath?.learningSteps.map(step => (
                <Card key={step.step} variant="light" className="!p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-md">{step.step}</div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800"><MathRenderer text={step.topic} /></h3>
                            <div className="text-slate-600 text-sm"><MathRenderer text={step.goal} /></div>
                            <div className="mt-2 space-y-1">
                                {step.resources.map((res, i) => (
                                    <div key={i} className="text-xs p-2 bg-slate-100 rounded-md border border-slate-200">
                                        <MathRenderer text={res} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
            </div>
            <div className="text-center">
                 <Button onClick={() => setStep('topic')} variant="outline">Start a New Path</Button>
            </div>
        </div>
    );
    
    const renderContent = () => {
        if (isLoading) {
            return (
                 <Card variant="light" className="text-center max-w-md mx-auto">
                    <Spinner className="w-12 h-12" colorClass="bg-violet-600"/>
                    <p className="mt-4 font-semibold text-slate-700">{loadingMessage}</p>
                </Card>
            );
        }
        if (error) {
            return (
                <Card variant="light" className="text-center max-w-md mx-auto">
                    <p className="text-red-500 font-bold">An error occurred</p>
                    <p className="mt-2 text-slate-600">{error}</p>
                    <Button onClick={() => setStep('topic')} className="mt-4">Try Again</Button>
                </Card>
            );
        }

        switch (step) {
            case 'topic': return renderTopicSetup();
            case 'quiz': return <DiagnosticQuizRunner questions={diagnosticQuiz!} />;
            case 'path': return renderLearningPath();
            default: return renderTopicSetup();
        }
    };

    return <div>{renderContent()}</div>;
};

export default PersonalizedLearningPathPage;
