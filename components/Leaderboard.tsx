import React from 'react';
import { Scores, Players } from '../types';
import { LeaderboardIcon } from './icons/LifelineIcons';

interface LeaderboardProps {
    scores: Scores;
    players: Players;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores, players }) => {
    const sortedPlayers = Object.keys(scores)
        .sort((a, b) => scores[b] - scores[a])
        .slice(0, 10); // Show top 10

    if (sortedPlayers.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                <LeaderboardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No scores to display yet. The leaderboard will appear here.</p>
            </div>
        );
    }
    
    const getTrophy = (rank: number) => {
        if (rank === 0) return '🥇';
        if (rank === 1) return '🥈';
        if (rank === 2) return '🥉';
        return <span className="font-mono text-gray-400">{rank + 1}</span>;
    }

    return (
        <div className="w-full max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-lg">
            <ul className="space-y-3">
                {sortedPlayers.map((peerId, index) => (
                    <li
                        key={peerId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                        <div className="flex items-center">
                            <span className="text-xl w-8 text-center">{getTrophy(index)}</span>
                            <span className="font-semibold text-gray-700 ml-3">{players[peerId]?.name || 'Anonymous'}</span>
                        </div>
                        <span className="font-bold text-blue-600 text-lg">{scores[peerId]} pts</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Leaderboard;
