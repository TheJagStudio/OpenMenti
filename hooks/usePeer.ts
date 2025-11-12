
import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '../types';

export const usePeer = (
    isHost: boolean, 
    id?: string, 
    onData?: (conn: any, data: Message) => void
) => {
    const [peer, setPeer] = useState<any>(null);
    const [myPeerId, setMyPeerId] = useState<string>('');
    const connectionsRef = useRef<any[]>([]);

    useEffect(() => {
        if (typeof window.Peer === 'undefined') {
            console.error('PeerJS is not loaded');
            return;
        }
        
        const newPeer = id ? new window.Peer(id) : new window.Peer();

        newPeer.on('open', (peerId: string) => {
            console.log('My peer ID is: ' + peerId);
            setMyPeerId(peerId);
            setPeer(newPeer);
        });

        if (isHost) {
            newPeer.on('connection', (conn: any) => {
                console.log('Player connected:', conn.peer);
                connectionsRef.current.push(conn);
                conn.on('data', (data: any) => onData && onData(conn, data as Message));
                conn.on('close', () => {
                    console.log('Player disconnected:', conn.peer);
                    connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
                });
            });
        }

        newPeer.on('error', (err: any) => {
            console.error('PeerJS error:', err);
        });

        return () => {
            newPeer.destroy();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost, id]);

    const connect = useCallback((peerIdToConnect: string) => {
        if (!peer) return null;
        const conn = peer.connect(peerIdToConnect);
        if (conn) {
            conn.on('open', () => {
                console.log('Connected to host:', peerIdToConnect);
                connectionsRef.current = [conn];
            });
            conn.on('data', (data: any) => onData && onData(conn, data as Message));
        }
        return conn;
    }, [peer, onData]);
    
    const broadcast = useCallback((data: Message) => {
        connectionsRef.current.forEach(conn => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }, []);

    const sendToHost = useCallback((data: Message) => {
        if (connectionsRef.current[0] && connectionsRef.current[0].open) {
            connectionsRef.current[0].send(data);
        }
    }, []);

    return { peer, myPeerId, connections: connectionsRef.current, connect, broadcast, sendToHost };
};
   