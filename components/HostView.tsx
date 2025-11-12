import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateQuizQuestions } from '../services/geminiService';
// Fix: Import PlayerAnswer type to correctly type player answer objects.
import { GameState, Message, Players, Scores, PlayerAnswer } from '../types';
import { usePeer } from '../hooks/usePeer';
import QuestionDisplay from './QuestionDisplay';
import Leaderboard from './Leaderboard';

const QUESTION_TIME_LIMIT = 20; // in seconds
const MAX_POINTS_PER_QUESTION = 1000;

const ResultsChart = ({ data, correctAnswer }: { data: { name: string, value: number }[], correctAnswer: string }) => {
    const totalVotes = data.reduce((sum, item) => sum + item.value, 0);
    if (totalVotes === 0) {
        return <p className="text-gray-500">No answers submitted yet.</p>;
    }

    return (
        <div className="w-full space-y-3">
            {data.map((item, index) => {
                const percentage = totalVotes > 0 ? (item.value / totalVotes) * 100 : 0;
                const isCorrect = item.name === correctAnswer;
                return (
                    <div key={index} className="flex items-center">
                        <div className="w-1/3 pr-4 text-right truncate">
                            <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-gray-700'}`}>{item.name}</span>
                        </div>
                        <div className="w-2/3">
                            <div className="w-full bg-gray-200 rounded-full h-8 flex items-center relative">
                                <div
                                    className={`h-8 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-gray-400'}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                                <span className="absolute left-3 font-bold text-white text-shadow-sm">{item.value}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const HostView: React.FC<{ hostPeerId: string; onReset: () => void; }> = ({ hostPeerId, onReset }) => {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [players, setPlayers] = useState<Players>({});
    const [gameState, setGameState] = useState<GameState>({
        status: 'lobby',
        questions: [],
        currentQuestionIndex: 0,
        playerAnswers: {},
        scores: {},
        questionStartTime: null,
        showResults: false,
    });
    const [timer, setTimer] = useState(QUESTION_TIME_LIMIT);
    // Fix: Changed NodeJS.Timeout to ReturnType<typeof setTimeout> for browser compatibility.
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fix: Typed `conn` parameter to ensure `conn.peer` is a string, preventing type inference issues.
    const handleIncomingData = useCallback((conn: { peer: string }, data: Message) => {
        if (data.type === 'PLAYER_JOIN') {
            setPlayers(prev => ({ ...prev, [conn.peer]: { name: data.payload.name } }));
            setGameState(prev => ({...prev, scores: {...prev.scores, [conn.peer]: 0 }}));
        } else if (data.type === 'PLAYER_ANSWER') {
             setGameState(prev => {
                const newPlayerAnswers = { ...prev.playerAnswers };
                if (!newPlayerAnswers[data.payload.questionIndex]) {
                    newPlayerAnswers[data.payload.questionIndex] = {};
                }
                newPlayerAnswers[data.payload.questionIndex][conn.peer] = {
                    option: data.payload.option,
                    submittedAt: data.payload.submittedAt,
                };
                return { ...prev, playerAnswers: newPlayerAnswers };
            });
        }
    }, []);
    
    const { myPeerId, broadcast, connections } = usePeer(true, hostPeerId, handleIncomingData);

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startTimer = () => {
        stopTimer();
        setTimer(QUESTION_TIME_LIMIT);
        timerRef.current = setInterval(() => {
            setTimer(t => t - 1);
        }, 1000);
    };
    
    useEffect(() => {
        if (timer <= 0) {
            stopTimer();
            if (gameState.status === 'in-progress') {
                setGameState(prev => ({...prev, status: 'question-results'}));
            }
        }
    }, [timer, gameState.status]);

    useEffect(() => {
        // Handle player disconnections
        const connectedPeerIds = connections.map(c => c.peer);
        setPlayers(prevPlayers => {
            const newPlayers = { ...prevPlayers };
            Object.keys(newPlayers).forEach(peerId => {
                if (!connectedPeerIds.includes(peerId)) {
                    delete newPlayers[peerId];
                }
            });
            return newPlayers;
        });
    }, [connections]);

    useEffect(() => {
        broadcast({ type: 'GAME_STATE_UPDATE', payload: gameState });
    }, [gameState, broadcast]);

    const handleGenerateQuiz = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);
        try {
            const questions = await generateQuizQuestions(topic);
            setGameState(prev => ({ ...prev, questions, status: 'lobby' }));
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const startGame = () => {
        if (gameState.questions.length > 0) {
            const initialScores = Object.keys(players).reduce((acc, peerId) => ({...acc, [peerId]: 0}), {});
            setGameState(prev => ({ ...prev, status: 'in-progress', currentQuestionIndex: 0, showResults: false, questionStartTime: Date.now(), scores: initialScores }));
            startTimer();
        }
    };

    const showLeaderboard = () => {
        const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
        // Fix: Explicitly typed `answersForQuestion` to avoid properties being inferred as `unknown`.
        const answersForQuestion: PlayerAnswer = gameState.playerAnswers[gameState.currentQuestionIndex] || {};
        
        const newScores = {...gameState.scores};

        Object.entries(answersForQuestion).forEach(([peerId, answer]) => {
            if (answer.option === currentQuestion.correctAnswer) {
                const timeTaken = (answer.submittedAt - (gameState.questionStartTime ?? 0)) / 1000;
                if(timeTaken <= QUESTION_TIME_LIMIT) {
                    const speedBonus = Math.round(MAX_POINTS_PER_QUESTION * ((QUESTION_TIME_LIMIT - timeTaken) / QUESTION_TIME_LIMIT));
                    newScores[peerId] = (newScores[peerId] || 0) + speedBonus;
                }
            }
        });

        setGameState(prev => ({...prev, status: 'leaderboard', scores: newScores, showResults: true }));
    }

    const nextQuestion = () => {
        setGameState(prev => {
            if (prev.currentQuestionIndex < prev.questions.length - 1) {
                setTimer(QUESTION_TIME_LIMIT);
                startTimer();
                return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1, status: 'in-progress', questionStartTime: Date.now(), showResults: false };
            }
            return { ...prev, status: 'finished' };
        });
    };
    
    const getChartData = () => {
        const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
        if (!currentQuestion) return [];
        // Fix: Explicitly typed `answers` to avoid properties being inferred as `unknown`.
        const answers: PlayerAnswer = gameState.playerAnswers[gameState.currentQuestionIndex] || {};
        const counts = currentQuestion.options.reduce((acc, option) => ({...acc, [option]: 0}), {} as Record<string, number>);
        Object.values(answers).forEach(answer => {
            if (counts[answer.option] !== undefined) counts[answer.option]++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const getControlButton = () => {
        switch(gameState.status) {
            case 'lobby':
                return <button onClick={startGame} disabled={gameState.questions.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed">Start Game</button>;
            case 'in-progress':
                 return <button disabled className="w-full bg-gray-400 text-white font-bold py-2 px-4 rounded cursor-wait">Time Remaining: {timer}s</button>;
            case 'question-results':
                return <button onClick={showLeaderboard} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">Show Leaderboard</button>;
            case 'leaderboard':
                const isLastQuestion = gameState.currentQuestionIndex >= gameState.questions.length - 1;
                return <button onClick={isLastQuestion ? () => setGameState(p => ({...p, status: 'finished'})) : nextQuestion} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{isLastQuestion ? 'Show Final Results' : 'Next Question'}</button>
             default: return null;
        }
    }
    
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const playerList = Object.values(players);

    return (
        <div className="w-full mx-auto flex flex-col min-h-screen bg-white rounded-lg shadow-lg border border-gray-200">
            <header className="flex justify-between items-center p-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800">Host Dashboard</h1>
                <div className="text-center">
                    <p className="text-gray-500 text-sm">Game Code</p>
                    <p className="text-2xl font-mono tracking-widest bg-gray-100 px-4 py-1 rounded-md border border-gray-300">{myPeerId}</p>
                </div>
                 <button onClick={onReset} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors">End Game</button>
            </header>
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
                <aside className="lg:col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Game Controls</h2>
                     {gameState.status === 'lobby' && (
                        <div className="mb-4">
                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter quiz topic" className="w-full bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={handleGenerateQuiz} disabled={isGenerating || !topic.trim()} className="w-full mt-2 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-all">
                                {isGenerating ? 'Generating...' : 'Generate Quiz'}
                            </button>
                        </div>
                    )}
                    <div className="space-y-2">
                        {getControlButton()}
                    </div>
                    <div className="mt-auto pt-4">
                        <h3 className="text-lg font-bold text-gray-700 mt-6 mb-2">Players Connected ({playerList.length})</h3>
                        <ul className="space-y-1 max-h-48 overflow-y-auto">
                            {playerList.map(p => <li key={p.name} className="text-gray-600 bg-gray-200 p-2 rounded-md text-sm truncate">{p.name}</li>)}
                        </ul>
                    </div>
                </aside>

                <main className="lg:col-span-3 bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                    {gameState.status === 'lobby' && <p className="text-2xl text-gray-500">{gameState.questions.length > 0 ? `Quiz on "${topic}" is ready!` : "Generate a quiz to begin."}</p>}
                    {gameState.status === 'finished' && <div className="text-center"><h2 className="text-3xl font-bold mb-4">Final Results</h2><Leaderboard scores={gameState.scores} players={players} /></div>}
                    {(gameState.status === 'in-progress' || gameState.status === 'question-results') && currentQuestion && (
                        <div className="w-full text-center">
                            <p className="text-lg text-gray-500">Question {gameState.currentQuestionIndex + 1} / {gameState.questions.length}</p>
                            <h2 className="text-3xl font-bold my-4">{currentQuestion.question}</h2>
                            {gameState.status === 'question-results' && <ResultsChart data={getChartData()} correctAnswer={currentQuestion.correctAnswer} />}
                        </div>
                    )}
                    {gameState.status === 'leaderboard' && (
                        <div className="w-full text-center">
                            <h2 className="text-3xl font-bold mb-4">Leaderboard</h2>
                             <Leaderboard scores={gameState.scores} players={players} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default HostView;