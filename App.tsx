import React, { useState, useCallback } from 'react';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import Lobby from './components/Lobby';

declare global {
    interface Window {
        Peer: any;
        confetti: any;
    }
}

const App: React.FC = () => {
    const [role, setRole] = useState<'host' | 'player' | null>(null);
    const [peerId, setPeerId] = useState<string>('');
    const [hostId, setHostId] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');

    const handleCreateGame = useCallback((id: string) => {
        setPeerId(id);
        setRole('host');
    }, []);

    const handleJoinGame = useCallback((id: string, name: string) => {
        setHostId(id);
        setPlayerName(name);
        setRole('player');
    }, []);
    
    const handleReset = useCallback(() => {
      setRole(null);
      setPeerId('');
      setHostId('');
      setPlayerName('');
    }, []);

    const renderContent = () => {
        if (role === 'host') {
            return <HostView hostPeerId={peerId} onReset={handleReset} />;
        }
        if (role === 'player') {
            return <PlayerView hostId={hostId} playerName={playerName} onReset={handleReset}/>;
        }
        return <Lobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />;
    };

    return (
        <main className="min-h-screen bg-gray-100 text-gray-800 font-sans p-4 flex items-center justify-center">
            <div className="w-full max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </main>
    );
};

export default App;