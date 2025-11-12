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
        const conn = connect(hostId);
        if (conn) {
            conn.on('open', () => {
                setIsConnected(true);
                sendToHost({ type: 'PLAYER_JOIN', payload: { name: playerName } });
            });
            conn.on('close', () => setIsConnected(false));
            conn.on('error', () => setIsConnected(false));
        }
    }, [connect, hostId, playerName, sendToHost]);

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
            return <div className="text-center"><p className="text-2xl font-bold text-green-600">The quiz has ended!</p><p className="text-xl text-gray-600">Your final score is: {finalScore}</p></div>;
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