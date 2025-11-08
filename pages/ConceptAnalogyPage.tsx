import React, { useState } from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import Card from '../components/common/Card';
import { ConceptAnalogyIcon } from '../components/icons/ConceptAnalogyIcon';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import { Analogy } from '../types';
import { saveWorkToHistory } from '../utils/history';

const ConceptAnalogyPage: React.FC = () => {
    const [concept, setConcept] = useState('');
    const [analogies, setAnalogies] = useState<Analogy[]>([]);
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
        setAnalogies([]);
        try {
            const result = await geminiService.generateAnalogies(concept);
            setAnalogies(result);
            saveWorkToHistory({
                type: 'Concept Analogy',
                title: `Analogies for ${concept}`,
                data: { concept, analogies: result },
            });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card variant="light" className="text-center max-w-3xl mx-auto">
            <ConceptAnalogyIcon className="w-20 h-20 mx-auto text-violet-500" />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">Concept Analogy Generator</h1>
            <p className="mt-2 text-slate-600">
                Struggling with a complex topic? Get simple, relatable analogies to understand anything faster.
            </p>
             <form onSubmit={handleSubmit} className="mt-8 flex flex-col md:flex-row items-center gap-2">
                <input
                    type="text"
                    value={concept}
                    onChange={e => setConcept(e.target.value)}
                    placeholder="Enter a concept, e.g., 'Black Holes' or 'DNA'"
                    className="w-full px-4 py-3 bg-white/80 border border-slate-400 rounded-lg shadow-sm"
                />
                <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isLoading}>
                    {isLoading ? <Spinner colorClass="bg-white" /> : 'Explain'}
                </Button>
            </form>

             {error && <p className="text-red-500 font-semibold mt-4">{error}</p>}
             
             <div className="mt-8 space-y-6 text-left">
                {analogies.map((item, index) => (
                    <div key={index} className="p-4 bg-violet-50/50 border-l-4 border-violet-400 rounded-r-lg">
                        <p className="font-bold text-violet-800 text-lg">"{item.analogy}"</p>
                        <p className="mt-2 text-slate-700">{item.explanation}</p>
                    </div>
                ))}
             </div>
        </Card>
    );
};

export default ConceptAnalogyPage;