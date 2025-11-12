import React, { useState, useEffect } from 'react';
import { LogoIcon } from './icons/LifelineIcons';

interface LobbyProps {
    onCreateGame: (id: string) => void;
    onJoinGame: (id: string, name: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateGame, onJoinGame }) => {
    const [joinId, setJoinId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [hostId, setHostId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const newHostId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setHostId(newHostId);
        setLoading(false);
    }, []);

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinId.trim() && playerName.trim()) {
            onJoinGame(joinId.trim().toUpperCase(), playerName.trim());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center text-gray-700">
            <div className="mb-12 flex flex-col items-center">
                <LogoIcon className="w-24 h-24 text-blue-600 mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Live AI-Powered Quiz
                </h1>
                <p className="text-lg text-gray-500 mt-2">Engage, Compete, and Learn in Real-Time</p>
            </div>

            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 p-4">
                <div className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center shadow-sm">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-4">Create a Game</h2>
                    <p className="text-gray-500 mb-6">Host a new quiz and invite players to join.</p>
                    {loading ? (
                        <div className="h-12 bg-gray-200 rounded-md animate-pulse w-40"></div>
                    ) : (
                        <button
                            onClick={() => onCreateGame(hostId)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-sm">
                            Start Hosting
                        </button>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center shadow-sm">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-4">Join a Game</h2>
                    <p className="text-gray-500 mb-6">Enter a name and the code from your host.</p>
                    <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3 w-full max-w-sm">
                         <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Your Name"
                            required
                            className="w-full bg-gray-100 border-2 border-gray-300 rounded-md py-3 px-4 text-center text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                placeholder="GAME CODE"
                                required
                                className="flex-grow bg-gray-100 border-2 border-gray-300 rounded-md py-3 px-4 text-center tracking-widest font-bold uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <button
                                type="submit"
                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 transform hover:scale-105 shadow-sm">
                                Join
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Lobby;