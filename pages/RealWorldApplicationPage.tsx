import React, { useState } from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import Card from '../components/common/Card';
import { RealWorldIcon } from '../components/icons/RealWorldIcon';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import { RealWorldApplication } from '../types';
import { saveWorkToHistory } from '../utils/history';

const RealWorldApplicationPage: React.FC = () => {
    const [concept, setConcept] = useState('');
    const [applications, setApplications] = useState<RealWorldApplication[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message.includes("Insufficient tokens")
            ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
            : message);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!concept.trim()) {
            setError('Please enter a concept.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setApplications([]);
        try {
            const result = await geminiService.findRealWorldApplications(concept);
            setApplications(result);
            saveWorkToHistory({
                type: 'Real-World Applications',
                title: `Applications of ${concept}`,
                data: { concept, applications: result },
            });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card variant="light" className="text-center max-w-3xl mx-auto">
            <RealWorldIcon className="w-20 h-20 mx-auto text-violet-500" />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">Real-World Application Finder</h1>
            <p className="mt-2 text-slate-600">
                Enter any academic concept, and discover how it's used in real-world industries, from gaming to space exploration.
            </p>
             <form onSubmit={handleSubmit} className="mt-8 flex flex-col md:flex-row items-center gap-2">
                <input
                    type="text"
                    value={concept}
                    onChange={e => setConcept(e.target.value)}
                    placeholder="Enter a concept, e.g., 'Trigonometry' or 'Photosynthesis'"
                    className="w-full px-4 py-3 bg-white/80 border border-slate-400 rounded-lg shadow-sm"
                />
                <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isLoading}>
                    {isLoading ? <Spinner colorClass="bg-white" /> : 'Discover'}
                </Button>
            </form>

             {error && <p className="text-red-500 font-semibold mt-4">{error}</p>}
             
             <div className="mt-8 space-y-6 text-left">
                {applications.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="font-bold text-violet-800 text-lg">{item.industry}</p>
                        <p className="mt-1 text-slate-700">{item.description}</p>
                    </div>
                ))}
             </div>
        </Card>
    );
};

export default RealWorldApplicationPage;