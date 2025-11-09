

import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Using esm.sh for react-router-dom to resolve module loading errors.
import { useNavigate, Link } from 'https://esm.sh/react-router-dom@6';
import { GameLevel, PlayerPosition, Interaction } from '../types';
import * as geminiService from '../services/geminiService';
import { useContent } from '../contexts/ContentContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

type GameState = 'generating' | 'playing' | 'interaction' | 'feedback' | 'completed' | 'error';

// Game constants
const TILE_SIZE = 40; // Size of each tile in pixels
const PLAYER_SIZE_RATIO = 0.8; // Player size relative to tile size
const PLAYER_SPEED = 2; // Pixels per frame

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
    const gameLoopRef = useRef<number | null>(null);
    const keysPressed = useRef<{ [key: string]: boolean }>({});

    // Fetch and set up the game level
    useEffect(() => {
        if (!extractedText) {
            setGameState('error');
            setError(
                <span>No study content found. Please <Link to="/app" className="font-bold underline text-violet-600">go to the dashboard</Link> and provide some content first.</span>
            );
            return;
        }
        
        const setupGame = async () => {
            setGameState('generating');
            try {
                const gameLevel = await geminiService.generateGameLevel(extractedText);
                setLevel(gameLevel);
                setPlayerPosition({ 
                    x: gameLevel.player_start.x * TILE_SIZE, 
                    y: gameLevel.player_start.y * TILE_SIZE 
                });
                setGameState('playing');
            } catch (err) {
                 if (err instanceof Error) {
                    setError(err.message.includes("Insufficient tokens")
                        ? <span>You're out of tokens! Please <Link to="/premium" className="font-bold underline text-violet-600">upgrade to Premium</Link>.</span>
                        : err.message);
                } else {
                    setError("An unknown error occurred while building your game.");
                }
                setGameState('error');
            }
        };
        setupGame();
    }, [extractedText]);

    const handleInteractionSubmit = () => {
        if (!activeInteraction) return;
        const isCorrect = interactionAnswer.toLowerCase().trim() === activeInteraction.correct_answer.toLowerCase().trim();
        setFeedback({
            correct: isCorrect,
            message: isCorrect ? activeInteraction.success_message : activeInteraction.failure_message,
        });
        if (isCorrect) {
            setScore(s => s + 10);
            setCompletedInteractions(prev => new Set(prev).add(activeInteraction.id));
        }
        setGameState('feedback');
    };

    const closeFeedback = () => {
        setFeedback(null);
        setInteractionAnswer('');
        setActiveInteraction(null);
        setGameState('playing');
    };

    const checkForInteraction = useCallback(() => {
        if (!level) return;
        const playerGridX = Math.round(playerPosition.x / TILE_SIZE);
        const playerGridY = Math.round(playerPosition.y / TILE_SIZE);
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                 if (Math.abs(dx) + Math.abs(dy) > 1) continue;
                const checkX = playerGridX + dx;
                const checkY = playerGridY + dy;
                
                const interaction = level.interactions.find(i => i.position.x === checkX && i.position.y === checkY);
                if (interaction && !completedInteractions.has(interaction.id)) {
                    setActiveInteraction(interaction);
                    setGameState('interaction');
                    return;
                }
            }
        }
    }, [level, playerPosition, completedInteractions]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)) {
             e.preventDefault();
        }
        keysPressed.current[key] = true;
    }, []);
    
    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        keysPressed.current[e.key.toLowerCase()] = false;
    }, []);

    // The main game loop for player movement and interactions
    useEffect(() => {
        const gameLoop = () => {
            if (gameState === 'playing') {
                if(keysPressed.current['e']) {
                    checkForInteraction();
                    keysPressed.current['e'] = false; // Prevent repeated triggers
                }

                setPlayerPosition(prevPos => {
                    if (!level) return prevPos;

                    let newPos = { ...prevPos };
                    if (keysPressed.current['w'] || keysPressed.current['arrowup']) newPos.y -= PLAYER_SPEED;
                    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) newPos.y += PLAYER_SPEED;
                    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) newPos.x -= PLAYER_SPEED;
                    if (keysPressed.current['d'] || keysPressed.current['arrowright']) newPos.x += PLAYER_SPEED;

                    const playerSize = TILE_SIZE * PLAYER_SIZE_RATIO;
                    const margin = (TILE_SIZE - playerSize) / 2;
                    
                    const corners = [
                        { x: newPos.x + margin, y: newPos.y + margin },
                        { x: newPos.x + playerSize - margin, y: newPos.y + margin },
                        { x: newPos.x + margin, y: newPos.y + playerSize - margin },
                        { x: newPos.x + playerSize - margin, y: newPos.y + playerSize - margin }
                    ];

                    for (const corner of corners) {
                        const gridX = Math.floor(corner.x / TILE_SIZE);
                        const gridY = Math.floor(corner.y / TILE_SIZE);
                        
                        if (!level.grid[gridY] || !level.grid[gridY][gridX] || level.grid[gridY][gridX].type === 'wall') {
                            return prevPos;
                        }
                        if (level.grid[gridY][gridX].type === 'exit') {
                            setGameState('completed');
                        }
                    }

                    return newPos;
                });
            }
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameState, level, checkForInteraction, handleKeyDown, handleKeyUp]);

    if (gameState === 'generating') {
        return (
            <Card variant="light" className="max-w-md mx-auto text-center">
                <Spinner className="w-16 h-16" colorClass="bg-violet-600" />
                <h2 className="text-2xl font-bold text-slate-800 mt-6">AI Level Designer is Building Your Game...</h2>
                <p className="text-slate-600 mt-2">Get ready for an adventure!</p>
            </Card>
        );
    }
    
    if (gameState === 'error' || !level) {
         return (