import React, { useState } from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import Card from '../components/common/Card';
import { WhatIfHistoryIcon } from '../components/icons/WhatIfHistoryIcon';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as geminiService from '../services/geminiService';
import { saveWorkToHistory } from '../utils/history';

const WhatIfHistoryPage: React.FC = () => {
    const [scenario, setScenario] = useState('');
    const [result, setResult] = useState('');
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
        if (!scenario.trim()) {
            setError('Please enter a scenario to explore.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setResult('');
        try {
            const response = await geminiService.exploreWhatIfHistory(scenario);
            setResult(response);
            saveWorkToHistory({
                type: 'What If History',
                title: scenario,
                data: { scenario, result: response },
            });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card variant="light" className="text-center">
                <WhatIfHistoryIcon className="w-20 h-20 mx-auto text-violet-500" />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">"What If?" History Explorer</h1>
                <p className="mt-2 text-slate-600">
                    Propose an alternate historical scenario and see how the world might have changed, based on real historical principles.
                </p>
                <form onSubmit={handleSubmit} className="mt-8 space-y-2">
                    <textarea
                        value={scenario}
                        onChange={e => setScenario(e.target.value)}
                        placeholder="What if the internet was never invented? What if India was never colonized?"
                        rows={3}
                        className="w-full p-3 bg-white/80 border border-slate-400 rounded-lg shadow-sm"
                    />
                     {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
                    <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading ? <Spinner colorClass="bg-white"/> : 'Explore Scenario'}
                    </Button>
                </form>
            </Card>

            {result && (
                <Card variant="light">
                    <h2 className="text-2xl font-bold text-slate-800">Exploring: "{scenario}"</h2>
                    <div className="mt-4 prose max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />
                </Card>
            )}
        </div>
    );
};

export default WhatIfHistoryPage;