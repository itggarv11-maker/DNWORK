import React from 'react';
import { SmartSummary } from '../../types';
import Card from '../common/Card';
import MathRenderer from '../common/MathRenderer';
import { LightBulbIcon, BookOpenIcon, SparklesIcon, HeartIcon } from '../icons';

interface SmartSummaryComponentProps {
    summary: SmartSummary;
}

const SmartSummaryComponent: React.FC<SmartSummaryComponentProps> = ({ summary }) => {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800">Smart Summary: {summary.title}</h1>
            </div>

            <Card variant="light">
                <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <BookOpenIcon className="w-6 h-6 text-violet-500"/> Core Concepts
                </h2>
                <div className="space-y-3">
                    {summary.coreConcepts.map((concept, index) => (
                        <div key={index} className="p-3 bg-white/60 rounded-lg border border-slate-200">
                            <dt className="font-bold text-slate-800"><MathRenderer text={concept.term} /></dt>
                            <dd className="text-sm text-slate-600 mt-1"><MathRenderer text={concept.definition} /></dd>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="light">
                    <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <LightBulbIcon className="w-6 h-6 text-amber-500"/> Visual Analogy
                    </h2>
                    <p className="font-semibold text-slate-800 italic">"{summary.visualAnalogy.analogy}"</p>
                    <p className="text-sm text-slate-600 mt-2">{summary.visualAnalogy.explanation}</p>
                </Card>
                <Card variant="light">
                    <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2">
                       <SparklesIcon className="w-6 h-6 text-pink-500"/> Exam Spotlight (CBSE)
                    </h2>
                     <ul className="list-disc list-inside space-y-2 text-slate-700">
                        {summary.examSpotlight.map((point, index) => (
                            <li key={index}><MathRenderer text={point} /></li>
                        ))}
                    </ul>
                </Card>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-violet-100 to-pink-100 rounded-lg border border-violet-200">
                 <p className="font-bold text-violet-800 flex items-center justify-center gap-2">
                    <HeartIcon className="w-5 h-5"/> A Tip from StuBro
                 </p>
                 <p className="text-slate-700 mt-1 italic">"{summary.stuBroTip}"</p>
            </div>

        </div>
    );
};

export default SmartSummaryComponent;