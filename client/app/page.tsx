'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, LogIn, Grid3x3, Sparkles, Zap, Shield, Copy, Check } from 'lucide-react';
import { getIdentity, setPlayerName, getStoredRoom, setStoredRoom, clearIdentity } from '@/lib/identity';
import { socketClient } from '@/lib/socket';

export default function LobbyPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingRoom, setExistingRoom] = useState<string | null>(null);

    useEffect(() => {
        // Check for existing session
        const stored = getStoredRoom();
        if (stored) {
            setExistingRoom(stored);
        }
        const kickMessage = sessionStorage.getItem('lobby-error');
        if (kickMessage) {
            setError(kickMessage);
            sessionStorage.removeItem('lobby-error'); // Clear it right away
        }
    }, []);

    async function handleCreate() {
        setLoading(true);
        setError('');

        try {
            const identity = await getIdentity();
            if (name.trim()) {
                setPlayerName(name.trim());
                identity.playerName = name.trim();
            }

            await socketClient.connect(identity.token);

            socketClient.on('ROOM_CREATED', (data: any) => {
                setStoredRoom(data.roomId);
                router.push(`/game/${data.roomId}`);
            });

            socketClient.on('ERROR', (data: any) => {
                if (data.message === 'Invalid or missing authentication token') {
                    clearIdentity();
                    setError('Your session has expired. Please try again.');
                } else {
                    setError(data.message);
                }
                setLoading(false);
            });

            socketClient.send({
                type: 'CREATE_ROOM',
                playerName: identity.playerName,
            });
        } catch (err) {
            setError('Failed to connect to server. Make sure the server is running.');
            setLoading(false);
        }
    }

    async function handleJoin() {
        if (!roomCode.trim()) {
            setError('Enter a room code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const identity = await getIdentity();
            if (name.trim()) {
                setPlayerName(name.trim());
                identity.playerName = name.trim();
            }

            await socketClient.connect(identity.token);

            socketClient.on('GAME_STATE', () => {
                setStoredRoom(roomCode.toUpperCase().trim());
                router.push(`/game/${roomCode.toUpperCase().trim()}`);
            });

            socketClient.on('ERROR', (data: any) => {
                if (data.message === 'Invalid or missing authentication token') {
                    clearIdentity();
                    setError('Your session has expired. Please try again.');
                } else {
                    setError(data.message);
                }
                setLoading(false);
            });

            socketClient.send({
                type: 'JOIN_ROOM',
                roomId: roomCode.toUpperCase().trim(),
                playerName: identity.playerName,
            });
        } catch (err) {
            setError('Failed to connect to server. Make sure the server is running.');
            setLoading(false);
        }
    }

    function handleReconnect() {
        if (existingRoom) {
            router.push(`/game/${existingRoom}`);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/3 rounded-full blur-3xl" />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                {/* Logo / Title */}
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Grid3x3 className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight">
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                            CipherGrid
                        </span>
                    </h1>
                    <p className="mt-2 text-text-secondary text-sm">
                        Real-time multiplayer social deduction
                    </p>
                </motion.div>

                {/* Reconnect banner */}
                {existingRoom && (
                    <motion.div
                        className="glass rounded-2xl p-4 mb-4 border border-accent-gold/20"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-accent-gold">Active session found</p>
                                <p className="text-xs text-text-muted">Room: {existingRoom}</p>
                            </div>
                            <motion.button
                                onClick={handleReconnect}
                                className="px-4 py-2 bg-accent-gold/20 hover:bg-accent-gold/30 text-accent-gold rounded-xl text-sm font-semibold transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Rejoin
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Main card */}
                <motion.div
                    className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl animate-border-glow border"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Name input */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter your name (optional)"
                            className="w-full bg-bg-primary/60 border border-border-subtle rounded-xl px-4 py-3
                text-text-primary placeholder-text-muted
                focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50
                transition-all text-sm"
                        />
                    </div>

                    {/* Create Room */}
                    <motion.button
                        id="create-room-btn"
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%]
              hover:bg-[position:100%_0] text-white font-display font-bold text-lg
              py-4 rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40
              transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-3 mb-4"
                        whileHover={!loading ? { scale: 1.02 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Create Room
                            </>
                        )}
                    </motion.button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-5">
                        <div className="flex-1 h-px bg-border-subtle" />
                        <span className="text-text-muted text-xs uppercase tracking-wider">or join</span>
                        <div className="flex-1 h-px bg-border-subtle" />
                    </div>

                    {/* Join Room */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={roomCode}
                            onChange={e => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="ROOM CODE"
                            maxLength={6}
                            className="flex-1 bg-bg-primary/60 border border-border-subtle rounded-xl px-4 py-3
                text-text-primary placeholder-text-muted font-mono text-center text-lg tracking-[0.3em] uppercase
                focus:outline-none focus:ring-2 focus:ring-accent-gold/30 focus:border-accent-gold/50
                transition-all"
                        />
                        <motion.button
                            id="join-room-btn"
                            onClick={handleJoin}
                            disabled={loading || !roomCode.trim()}
                            className="px-6 py-3 bg-bg-elevated hover:bg-bg-card border border-border-subtle
                rounded-xl text-text-primary font-semibold
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all flex items-center gap-2"
                            whileHover={!loading ? { scale: 1.05 } : {}}
                            whileTap={!loading ? { scale: 0.95 } : {}}
                        >
                            <LogIn className="w-4 h-4" />
                            Join
                        </motion.button>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.p
                            className="mt-4 text-red-400 text-sm text-center"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.p>
                    )}
                </motion.div>

                {/* Features */}
                <motion.div
                    className="mt-8 grid grid-cols-3 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {[
                        { icon: <Zap className="w-4 h-4" />, label: 'Real-time' },
                        { icon: <Shield className="w-4 h-4" />, label: 'No sign-up' },
                        { icon: <Sparkles className="w-4 h-4" />, label: 'Instant play' },
                    ].map((f, i) => (
                        <div key={i} className="glass rounded-xl p-3 text-center">
                            <div className="text-accent-purple mb-1 flex justify-center">{f.icon}</div>
                            <span className="text-xs text-text-muted">{f.label}</span>
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
