
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'https://esm.sh/react-router-dom';
import { GameLevel, PlayerPosition, Interaction } from '../types';
import * as geminiService from '../services/geminiService';
import { useContent } from '../contexts/ContentContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

type GameState = 'generating' | 'playing' | 'interaction' | 'feedback' | 'completed' | 'error';

const TILE_SIZE = 40;

const ChapterConquestPage: React.FC = () => {
    const { extractedText } = useContent();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<GameState>('generating');
    const [level, setLevel] = useState<GameLevel | null>(null);
    const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({ x: 0, y: 0 });
    const [score, setScore] = useState(0);

    const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);
    const [interactionAnswer, setInteractionAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
    const [completedInteractions, setCompletedInteractions] = useState<Set<number>>(new Set());
    const [error, setError] = useState<React.ReactNode | null>(null);

    // Effect to generate level on mount
    useEffect(() => {
        if (!extractedText) {
            setError(<>No content found. Please <button onClick={() => navigate('/new-session')} className="text-violet-600 underline font-bold">start a new session</button> to load content for the game.</>);
            setGameState('error');
            return;
        }

        const generateLevel = async () => {
            try {
                const gameLevel = await geminiService.generateGameLevel(extractedText);
                setLevel(gameLevel);
                setPlayerPosition(gameLevel.player_start);
                setGameState('playing');
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to generate game level.");
                setGameState('error');
            }
        };

        generateLevel();
    }, [extractedText, navigate]);

    const movePlayer = useCallback((dx: number, dy: number) => {
        if (gameState !== 'playing' || !level) return;

        setPlayerPosition(prevPos => {
            const newPos = { x: prevPos.x + dx, y: prevPos.y + dy };
            if (
                newPos.y >= 0 && newPos.y < level.grid.length &&
                newPos.x >= 0 && newPos.x < level.grid[0].length &&
                level.grid[newPos.y][newPos.x].type !== 'wall'
            ) {
                return newPos;
            }
            return prevPos;
        });
    }, [gameState, level]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;
            
            // Prevent default scrolling for arrow keys
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }

            switch(e.key) {
                case 'w': case 'ArrowUp': movePlayer(0, -1); break;
                case 's': case 'ArrowDown': movePlayer(0, 1); break;
                case 'a': case 'ArrowLeft': movePlayer(-1, 0); break;
                case 'd': case 'ArrowRight': movePlayer(1, 0); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer, gameState]);
    
    // Check for interactions or exit on player move
    useEffect(() => {
        if (gameState !== 'playing' || !level) return;

        // Boundary check for safety
        if (playerPosition.y >= level.grid.length || playerPosition.x >= level.grid[0].length) return;

        const tile = level.grid[playerPosition.y][playerPosition.x];
        if (tile.type === 'exit') {
            setGameState('completed');
            return;
        }

        const interaction = level.interactions.find(i => i.position.x === playerPosition.x && i.position.y === playerPosition.y);
        if (interaction && !completedInteractions.has(interaction.id)) {
            setActiveInteraction(interaction);
            setGameState('interaction');
        }

    }, [playerPosition, level, gameState, completedInteractions]);

    const handleInteractionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInteraction) return;

        const isCorrect = interactionAnswer.trim().toLowerCase() === activeInteraction.correct_answer.toLowerCase();
        
        if(isCorrect) {
            setFeedback({ correct: true, message: activeInteraction.success_message });
            setScore(s => s + 1);
            setCompletedInteractions(prev => new Set(prev).add(activeInteraction.id));
        } else {
            setFeedback({ correct: false, message: activeInteraction.failure_message });
        }
        setGameState('feedback');
    };

    const closeFeedback = () => {
        setFeedback(null);
        setActiveInteraction(null);
        setInteractionAnswer('');
        setGameState('playing');
    };

    const renderGame = () => {
        if (!level) return null;

        const gridHeight = level.grid.length * TILE_SIZE;
        const gridWidth = level.grid[0].length * TILE_SIZE;

        return (
            <div className="relative mx-auto overflow-auto" style={{ maxWidth: '100vw' }}>
                <div className="relative" style={{ width: gridWidth, height: gridHeight, margin: '0 auto', backgroundColor: '#334155' }}>
                    {level.grid.map((row, y) => row.map((tile, x) => {
                        let tileColor = '#475569'; // floor
                        if (tile.type === 'wall') tileColor = '#1e293b';
                        if (tile.type === 'exit') tileColor = '#f59e0b';

                        const interaction = level.interactions.find(i => i.position.x === x && i.position.y === y);
                        if (interaction && !completedInteractions.has(interaction.id)) tileColor = '#8b5cf6';
                        if (interaction && completedInteractions.has(interaction.id)) tileColor = '#6d28d9';
                        
                        return (
                            <div key={`${x}-${y}`} style={{
                                position: 'absolute',
                                left: x * TILE_SIZE,
                                top: y * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                backgroundColor: tileColor,
                                border: '1px solid #475569'
                            }}/>
                        )
                    }))}
                    <div style={{
                        position: 'absolute',
                        left: playerPosition.x * TILE_SIZE + (TILE_SIZE / 2),
                        top: playerPosition.y * TILE_SIZE + (TILE_SIZE / 2),
                        width: TILE_SIZE * 0.7,
                        height: TILE_SIZE * 0.7,
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        transition: 'left 0.1s linear, top 0.1s linear',
                        boxShadow: '0 0 10px #10b981'
                    }}/>
                </div>
            </div>
        );
    };

    const renderInteractionModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card variant="light" className="w-full max-w-lg">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{activeInteraction?.prompt}</h3>
                <form onSubmit={handleInteractionSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={interactionAnswer}
                        onChange={e => setInteractionAnswer(e.target.value)}
                        className="w-full p-2 border border-slate-400 rounded-md"
                        autoFocus
                        placeholder="Type your answer here..."
                    />
                    <Button type="submit">Submit Answer</Button>
                </form>
            </Card>
        </div>
    );
    
     const renderFeedbackModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card variant="light" className={`w-full max-w-lg text-center border-4 ${feedback?.correct ? 'border-green-500' : 'border-red-500'}`}>
                <h3 className={`text-2xl font-bold ${feedback?.correct ? 'text-green-600' : 'text-red-600'}`}>
                    {feedback?.correct ? "Correct!" : "Try Again!"}
                </h3>
                <p className="mt-2 text-slate-600">{feedback?.message}</p>
                <Button onClick={closeFeedback} className="mt-4">Continue</Button>
            </Card>
        </div>
    );

    const renderCompletedScreen = () => (
         <Card variant="light" className="text-center max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-violet-700">Level Complete!</h2>
            <p className="mt-2 text-slate-600">You successfully finished the quest "{level?.title}"!</p>
            <p className="mt-4 text-xl">Score: <span className="font-bold">{score} / {level?.interactions.length}</span></p>
            <div className="flex justify-center gap-4 mt-6">
                <Button onClick={() => navigate('/app')}>Back to Dashboard</Button>
            </div>
        </Card>
    );

    if (gameState === 'generating') {
        return <div className="text-center py-10"><Spinner className="w-12 h-12" colorClass="bg-violet-600" /><p className="mt-4 text-slate-600">Building your adventure...</p></div>;
    }

    if (gameState === 'error') {
        return <Card variant="light" className="text-center max-w-lg mx-auto"><h2 className="text-xl font-bold text-red-600">Error</h2><p className="text-slate-600 mt-2">{error}</p></Card>
    }
    
    if (gameState === 'completed') {
        return renderCompletedScreen();
    }

    return (
        <div className="space-y-4">
             <Card variant="light" className="!p-4 text-center">
                <h1 className="text-2xl font-bold text-slate-800">{level?.title}</h1>
                <p className="text-slate-600 text-sm">Goal: {level?.goal}</p>
                <div className="flex justify-center items-center gap-4 mt-2">
                    <p className="font-bold">Score: {score}</p>
                    <p className="text-xs text-slate-500">Use WASD or Arrow Keys to move.</p>
                </div>
            </Card>
            {renderGame()}
            {gameState === 'interaction' && renderInteractionModal()}
            {gameState === 'feedback' && renderFeedbackModal()}
        </div>
    );
};

export default ChapterConquestPage;
