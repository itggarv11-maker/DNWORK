import React from 'react';
import { SmartSummary } from '../../types';
import Card from '../common/Card';
import MathRenderer from '../common/MathRenderer';
import { LightBulbIcon, BookOpenIcon, SparklesIcon, HeartIcon } from '../icons';
import { motion } from 'https://esm.sh/framer-motion';

interface SmartSummaryComponentProps {
    summary: SmartSummary;
}

const SmartSummaryComponent: React.FC<SmartSummaryComponentProps> = ({ summary }) => {
    return (
        <div className="w-full space-y-12 pb-20">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">{summary.title}</h1>
                <p className="text-slate-500 font-mono-tech mt-2">KNOWLEDGE SYNTHESIS COMPLETE</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Core Concepts - Wider column */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <BookOpenIcon className="w-8 h-8 text-violet-500"/>
                        <h2 className="text-2xl font-bold tracking-widest uppercase">Neural Core Concepts</h2>
                        <div className="h-px flex-grow bg-white/5"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {summary.coreConcepts.map((concept, index) => (
                            <Card key={index} variant="glass" className="!p-6 border-l-4 border-l-violet-500 group">
                                <dt className="font-bold text-xl text-white group-hover:text-violet-400 transition-colors">
                                    <MathRenderer text={concept.term} />
                                </dt>
                                <dd className="text-sm text-slate-400 mt-2 leading-relaxed">
                                    <MathRenderer text={concept.definition} />
                                </dd>
                            </Card>
                        ))}
                    </div>
                </motion.div>

                {/* Exam Spotlight Sidebar */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <SparklesIcon className="w-8 h-8 text-pink-500"/>
                        <h2 className="text-xl font-bold tracking-widest uppercase">Exam Target</h2>
                    </div>
                    <div className="space-y-4">
                        {summary.examSpotlight.map((point, index) => (
                            <div key={index} className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
                                <p className="text-sm text-slate-300 font-medium"><MathRenderer text={point} /></p>
                            </div>
                        ))}
                    </div>
                    
                    {/* Visual Analogy Box */}
                    <Card variant="glass" className="!p-6 border-cyan-500/20 bg-cyan-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            <LightBulbIcon className="w-6 h-6 text-cyan-400"/>
                            <h3 className="font-bold uppercase tracking-wider text-cyan-400 text-xs">Mental Model</h3>
                        </div>
                        <p className="font-bold text-white italic text-lg">"{summary.visualAnalogy.analogy}"</p>
                        <p className="text-xs text-slate-400 mt-3 leading-relaxed">{summary.visualAnalogy.explanation}</p>
                    </Card>
                </motion.div>
            </div>
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="max-w-3xl mx-auto text-center p-8 rounded-3xl bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-transparent border border-white/5"
            >
                 <p className="font-bold text-violet-400 flex items-center justify-center gap-3 text-sm tracking-widest uppercase">
                    <HeartIcon className="w-5 h-5"/> StuBro Neural Link
                 </p>
                 <p className="text-xl text-slate-300 mt-4 italic font-light">"{summary.stuBroTip}"</p>
            </motion.div>
        </div>
    );
};

export default SmartSummaryComponent;