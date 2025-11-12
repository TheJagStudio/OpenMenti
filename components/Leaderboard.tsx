import React, { useState, useEffect, useMemo } from 'react';
import { Scores, Players } from '../types';
import { LeaderboardIcon } from './icons/LifelineIcons';

interface LeaderboardProps {
    scores: Scores;
    players: Players;
    previousScores?: Scores;
    isFinal?: boolean;
}

const ITEM_HEIGHT = 68; // Height of one leaderboard item in px, including margins/padding

const getTrophy = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return <span className="font-mono text-gray-400">{rank + 1}</span>;
}

const ScoreDelta: React.FC<{ amount: number }> = ({ amount }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t1 = setTimeout(() => setVisible(true), 500);
        const t2 = setTimeout(() => setVisible(false), 2000);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    return (
        <span className={`ml-3 text-sm font-bold text-green-500 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            +{amount}
        </span>
    );
};

const Leaderboard: React.FC<LeaderboardProps> = ({ scores, players, previousScores, isFinal = false }) => {
    const initialPlayerData = useMemo(() => {
        return Object.keys(players)
            .filter(peerId => scores[peerId] !== undefined)
            .map(peerId => {
                const oldScore = previousScores?.[peerId] ?? 0;
                const newScore = scores[peerId];
                return {
                    peerId,
                    name: players[peerId]?.name || 'Anonymous',
                    score: oldScore,
                    previousScore: oldScore,
                    scoreDelta: newScore - oldScore,
                };
            });
    }, [scores, previousScores, players]);

    const [displayPlayers, setDisplayPlayers] = useState(initialPlayerData);

    useEffect(() => {
        if (isFinal) return; // Do not run animation for final leaderboard

        const animationDuration = 1800;
        const scoreUpdateDuration = 1200;
        let startTime: number | null = null;
        let animationFrameId: number;

        setDisplayPlayers(initialPlayerData);

        const animate = (timestamp: number) => {
            if (startTime === null) {
                startTime = timestamp;
            }
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / scoreUpdateDuration, 1);

            const nextDisplayPlayers = initialPlayerData.map(player => ({
                ...player,
                score: Math.round(player.previousScore + player.scoreDelta * progress),
            }));

            setDisplayPlayers(nextDisplayPlayers);

            if (elapsed < animationDuration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                const finalPlayers = initialPlayerData.map(p => ({ ...p, score: p.previousScore + p.scoreDelta }));
                setDisplayPlayers(finalPlayers);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [initialPlayerData, isFinal]);
    
    // Static final leaderboard
    if (isFinal) {
        const finalSortedPlayers = Object.keys(scores)
            .map(peerId => ({
                peerId,
                name: players[peerId]?.name || 'Anonymous',
                score: scores[peerId] || 0,
            }))
            .sort((a, b) => b.score - a.score);

        // Confetti for the winner
        useEffect(() => {
            if (finalSortedPlayers.length > 0 && window.confetti) {
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
        }, [finalSortedPlayers.length]);

        if (finalSortedPlayers.length === 0) {
            return (
                <div className="text-center text-gray-500 py-10">
                    <LeaderboardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No scores to display.</p>
                </div>
            );
        }

        return (
            <div className="w-full max-w-md mx-auto bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <ul className="space-y-3">
                    {finalSortedPlayers.map((player, rank) => (
                        <li
                            key={player.peerId}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-transform duration-300 ${
                                rank === 0 ? 'bg-yellow-100 border-yellow-400 scale-105' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-center truncate">
                                <span className="text-xl w-8 text-center">{getTrophy(rank)}</span>
                                <span className="font-semibold text-gray-800 ml-3 text-lg truncate">{player.name}</span>
                            </div>
                            <span className="font-bold text-blue-600 text-lg tabular-nums flex-shrink-0">{player.score} pts</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
    
    // Animated in-game leaderboard
    const sortedDisplayPlayers = [...displayPlayers].sort((a, b) => b.score - a.score);

    if (initialPlayerData.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                <LeaderboardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No scores to display yet. The leaderboard will appear here.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-lg">
            <ul
                className="relative transition-all duration-500 ease-in-out"
                style={{ height: `${sortedDisplayPlayers.length * ITEM_HEIGHT}px` }}
            >
                {initialPlayerData.map((player) => {
                    const currentData = sortedDisplayPlayers.find(p => p.peerId === player.peerId);
                    if (!currentData) return null;

                    const rank = sortedDisplayPlayers.findIndex(p => p.peerId === player.peerId);
                    const isWinner = rank === 0 && isFinal;

                    return (
                        <li
                            key={player.peerId}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-700 ease-out absolute w-full ${isWinner ? 'bg-yellow-100 border-yellow-400 scale-105 shadow-lg' : 'bg-gray-50 border-gray-200'}`}
                            style={{
                                transform: `translateY(${rank * ITEM_HEIGHT}px)`,
                                zIndex: initialPlayerData.length - rank,
                            }}
                        >
                            <div className="flex items-center truncate">
                                <span className="text-xl w-8 text-center">{getTrophy(rank)}</span>
                                <span className="font-semibold text-gray-700 ml-3 truncate">{player.name}</span>
                                {player.scoreDelta > 0 && (
                                    <ScoreDelta amount={player.scoreDelta} />
                                )}
                            </div>
                            <span className="font-bold text-blue-600 text-lg tabular-nums flex-shrink-0">{currentData.score} pts</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default Leaderboard;
