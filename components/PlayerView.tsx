import React, { useState, useEffect, useCallback } from 'react';
import { usePeer } from '../hooks/usePeer';
import { GameState, Message } from '../types';
import QuestionDisplay from './QuestionDisplay';
import { LogoIcon } from './icons/LifelineIcons';

interface PlayerViewProps {
    hostId: string;
    playerName: string;
    onReset: () => void;
}

const PlayerView: React.FC<PlayerViewProps> = ({ hostId, playerName, onReset }) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [myAnswer, setMyAnswer] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    const handleIncomingData = useCallback((conn: any, data: Message) => {
        if (data.type === 'GAME_STATE_UPDATE') {
            setGameState(prev => {
                if (prev && prev.currentQuestionIndex !== data.payload.currentQuestionIndex) {
                    setMyAnswer(null);
                }
                return data.payload;
            });
        }
    }, []);

    const { myPeerId, connect, sendToHost } = usePeer(false, undefined, handleIncomingData);

    useEffect(() => {
        if (!myPeerId) return;
        const conn = connect(hostId);
        if (conn) {
            conn.on('open', () => {
                setIsConnected(true);
                sendToHost({ type: 'PLAYER_JOIN', payload: { name: playerName } });
            });
            conn.on('close', () => setIsConnected(false));
            conn.on('error', () => setIsConnected(false));
        }
    }, [connect, hostId, playerName, sendToHost, myPeerId]);

    const handleSelectAnswer = (option: string) => {
        if (myAnswer || !gameState || gameState.showResults) return;
        setMyAnswer(option);
        sendToHost({
            type: 'PLAYER_ANSWER',
            payload: {
                questionIndex: gameState.currentQuestionIndex,
                option: option,
                submittedAt: Date.now()
            }
        });
    };

    const currentQuestion = gameState?.questions[gameState.currentQuestionIndex];
    const isCorrect = myAnswer && currentQuestion && myAnswer === currentQuestion.correctAnswer;

    // Correct Answer Animation
    useEffect(() => {
        if (gameState?.showResults && isCorrect && window.confetti) {
            const duration = 2 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, colors: ['#22c55e', '#86efac', '#ffffff'] };

            function randomInRange(min: number, max: number) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);

                const particleCount = 50 * (timeLeft / duration);
                window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [gameState?.showResults, isCorrect]);
    
    const sortedPlayers = gameState ? Object.keys(gameState.scores).sort((a, b) => gameState.scores[b] - gameState.scores[a]) : [];
    const winnerId = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
    const amIWinner = myPeerId === winnerId;

    // Winner Animation
    useEffect(() => {
        if (gameState?.status === 'finished' && amIWinner && window.confetti) {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const colors = ['#0ea5e9', '#22c55e', '#a855f7', '#eab308', '#f97316'];

            (function frame() {
                window.confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
                window.confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
                if (Date.now() < animationEnd) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }, [gameState?.status, amIWinner]);
    
    const renderContent = () => {
        if (!isConnected) {
            return <div className="text-center"><p className="text-2xl text-gray-500 animate-pulse">Connecting to host...</p></div>;
        }
        if (!gameState || gameState.status === 'lobby' || !currentQuestion) {
            return (
                <div className="text-center flex flex-col items-center">
                     <LogoIcon className="w-24 h-24 text-blue-500/30 mb-4" />
                    <p className="text-2xl font-semibold text-gray-700">Welcome, {playerName}!</p>
                    <p className="text-xl text-gray-500">Waiting for the host to start the game...</p>
                </div>
            );
        }
        if (gameState.status === 'finished') {
             const finalScore = gameState.scores[myPeerId] || 0;
             const winnerName = winnerId ? gameState.players[winnerId]?.name : 'No one';
            return (
                <div className="text-center">
                    <h2 className="text-4xl font-bold mb-4">
                        {amIWinner ? '🎉 You are the Winner! 🎉' : `🏆 ${winnerName} Wins! 🏆`}
                    </h2>
                    <p className="text-2xl text-gray-600">Your final score is: <span className="font-bold text-blue-600">{finalScore}</span></p>
                </div>
            );
        }
        if (myAnswer || gameState.showResults) {
            return (
                 <div className="w-full">
                    <QuestionDisplay
                        question={currentQuestion}
                        selectedOption={myAnswer}
                        showCorrect={gameState.showResults}
                        disabled={true}
                    />
                    <div className="text-center mt-8">
                        {gameState.showResults ? (
                             <p className="text-2xl font-semibold">The correct answer was: <span className="text-green-600">{currentQuestion.correctAnswer}</span></p>
                        ) : (
                             <p className="text-2xl font-semibold animate-pulse">Waiting for results...</p>
                        )}
                    </div>
                 </div>
            )
        }
        return (
             <QuestionDisplay
                    question={currentQuestion}
                    onSelect={handleSelectAnswer}
                    selectedOption={myAnswer}
                    showCorrect={false}
                    disabled={!!myAnswer}
                />
        );
    }

    return (
        <div className="w-full mx-auto flex flex-col min-h-screen bg-white rounded-lg shadow-lg border border-gray-200">
             <header className="flex justify-between items-center p-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800">Live Quiz</h1>
                <div className="text-right">
                    <p className="font-semibold">{playerName}</p>
                    <p className="text-sm text-gray-500">Score: {gameState?.scores[myPeerId] ?? 0}</p>
                </div>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-4xl">
                 {renderContent()}
                </div>
            </main>
             <footer className="p-4 border-t border-gray-200 text-center">
                 <button onClick={onReset} className="text-sm text-gray-500 hover:text-red-600 hover:underline">
                    Leave Game
                </button>
            </footer>
        </div>
    );
};

export default PlayerView;