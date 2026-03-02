'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy, Check, ArrowLeft, Users, Eye, Shield,
    SkipForward, Play, Crown, CheckCircle, Circle
} from 'lucide-react';
import { socketClient } from '@/lib/socket';
import { getIdentity, setStoredRoom, clearStoredRoom } from '@/lib/identity';
import { ClientGameState, TeamColor, PlayerRole } from '@/lib/types';
import Board from '@/components/Board';
import TeamBar from '@/components/TeamBar';
import ClueInput from '@/components/ClueInput';
import ActionLog from '@/components/ActionLog';
import GameOver from '@/components/GameOver';

export default function GamePage() {
    const params = useParams();
    const router = useRouter();
    const roomId = (params?.roomId as string)?.toUpperCase();

    const [gameState, setGameState] = useState<ClientGameState | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState('');

    // Connect to room
    useEffect(() => {
        if (!roomId) return;

        let mounted = true;

        async function connectToRoom() {
            try {
                const identity = await getIdentity();

                if (!socketClient.isConnected) {
                    await socketClient.connect(identity.token);
                }

                socketClient.on('GAME_STATE', (data: any) => {
                    if (mounted) {
                        setGameState(data.state);
                        setConnected(true);
                    }
                });

                socketClient.on('ERROR', (data: any) => {
                    if (mounted) {
                        setToast(data.message);
                        setTimeout(() => setToast(''), 3000);
                    }
                });

                // Try reconnecting first, then join
                socketClient.send({
                    type: 'RECONNECT',
                    roomId,
                });

                // If reconnect fails, join as new player
                setTimeout(() => {
                    if (!gameState) {
                        socketClient.send({
                            type: 'JOIN_ROOM',
                            roomId,
                            playerName: identity.playerName,
                        });
                    }
                }, 500);

                setStoredRoom(roomId);
            } catch (err) {
                if (mounted) {
                    setError('Failed to connect. Is the server running?');
                }
            }
        }

        connectToRoom();

        return () => {
            mounted = false;
            socketClient.offAll();
        };
    }, [roomId]);

    // Actions
    const selectTeam = useCallback((team: TeamColor) => {
        socketClient.send({ type: 'SELECT_TEAM', team });
    }, []);

    const selectRole = useCallback((role: PlayerRole) => {
        socketClient.send({ type: 'SELECT_ROLE', role });
    }, []);

    const toggleReady = useCallback(() => {
        socketClient.send({ type: 'TOGGLE_READY' });
    }, []);

    const giveClue = useCallback((word: string, count: number) => {
        socketClient.send({ type: 'GIVE_CLUE', word, count });
    }, []);

    const flipCard = useCallback((cardIndex: number) => {
        socketClient.send({ type: 'FLIP_CARD', cardIndex });
    }, []);

    const passTurn = useCallback(() => {
        socketClient.send({ type: 'PASS_TURN' });
    }, []);

    const handlePlayAgain = useCallback(() => {
        clearStoredRoom();
        router.push('/');
    }, [router]);

    const copyRoomCode = useCallback(() => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [roomId]);

    // Loading state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-strong rounded-3xl p-8 text-center max-w-md w-full">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-bg-elevated rounded-xl text-text-primary hover:bg-bg-card transition-all"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="w-8 h-8 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary text-sm">Connecting to room {roomId}...</p>
                </motion.div>
            </div>
        );
    }

    const { you, phase, currentTurn } = gameState;
    const isSpymaster = you.role === 'spymaster';
    const isMyTeamTurn = you.team === currentTurn;
    const canFlip = phase === 'playing' && isMyTeamTurn && you.role === 'operative' && !!gameState.currentClue;
    const canGiveClue = phase === 'playing' && isMyTeamTurn && isSpymaster && !gameState.currentClue;
    const canPass = phase === 'playing' && isMyTeamTurn && you.role === 'operative' && !!gameState.currentClue;

    // ========== LOBBY PHASE ==========
    if (phase === 'lobby') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
                </div>

                <motion.div
                    className="relative z-10 w-full max-w-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Room header */}
                    <div className="text-center mb-6">
                        <button
                            onClick={() => { clearStoredRoom(); router.push('/'); }}
                            className="absolute top-0 left-0 text-text-muted hover:text-text-primary transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Room Code</p>
                        <motion.button
                            onClick={copyRoomCode}
                            className="inline-flex items-center gap-2 px-6 py-2 glass rounded-xl hover:bg-bg-elevated transition-all"
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="font-mono text-2xl font-bold tracking-[0.4em] text-accent-gold">
                                {roomId}
                            </span>
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                        </motion.button>
                        <p className="text-text-muted text-xs mt-2">Share this code with your friends</p>
                    </div>

                    {/* Team Selection */}
                    <div className="glass-strong rounded-3xl p-6 sm:p-8 mb-4">
                        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-accent-purple" />
                            Choose Your Team
                        </h2>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {/* Red Team */}
                            <motion.button
                                onClick={() => selectTeam('red')}
                                className={`
                  relative rounded-2xl p-4 border-2 transition-all
                  ${you.team === 'red'
                                        ? 'bg-red-900/30 border-red-500 glow-red'
                                        : 'bg-bg-primary/40 border-border-subtle hover:border-red-500/50'
                                    }
                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-2 shadow-lg shadow-red-500/30" />
                                <span className="font-display font-bold text-red-400 uppercase text-sm tracking-wider">Red Team</span>
                                <div className="mt-2 text-xs text-text-muted">
                                    {gameState.players.filter(p => p.team === 'red').length} players
                                </div>
                            </motion.button>

                            {/* Blue Team */}
                            <motion.button
                                onClick={() => selectTeam('blue')}
                                className={`
                  relative rounded-2xl p-4 border-2 transition-all
                  ${you.team === 'blue'
                                        ? 'bg-blue-900/30 border-blue-500 glow-blue'
                                        : 'bg-bg-primary/40 border-border-subtle hover:border-blue-500/50'
                                    }
                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="w-4 h-4 rounded-full bg-blue-500 mx-auto mb-2 shadow-lg shadow-blue-500/30" />
                                <span className="font-display font-bold text-blue-400 uppercase text-sm tracking-wider">Blue Team</span>
                                <div className="mt-2 text-xs text-text-muted">
                                    {gameState.players.filter(p => p.team === 'blue').length} players
                                </div>
                            </motion.button>
                        </div>

                        {/* Role Selection */}
                        {you.team && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3 className="text-sm font-medium text-text-secondary mb-3">Choose Your Role</h3>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <motion.button
                                        onClick={() => selectRole('spymaster')}
                                        className={`
                      rounded-xl p-3 border transition-all text-center
                      ${you.role === 'spymaster'
                                                ? 'bg-accent-purple/20 border-accent-purple/50'
                                                : 'bg-bg-primary/40 border-border-subtle hover:border-accent-purple/30'
                                            }
                    `}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Eye className={`w-5 h-5 mx-auto mb-1 ${you.role === 'spymaster' ? 'text-accent-purple' : 'text-text-muted'}`} />
                                        <span className="text-sm font-semibold">Spymaster</span>
                                        <p className="text-xs text-text-muted mt-0.5">Give clues</p>
                                    </motion.button>

                                    <motion.button
                                        onClick={() => selectRole('operative')}
                                        className={`
                      rounded-xl p-3 border transition-all text-center
                      ${you.role === 'operative'
                                                ? 'bg-accent-gold/20 border-accent-gold/50'
                                                : 'bg-bg-primary/40 border-border-subtle hover:border-accent-gold/30'
                                            }
                    `}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Shield className={`w-5 h-5 mx-auto mb-1 ${you.role === 'operative' ? 'text-accent-gold' : 'text-text-muted'}`} />
                                        <span className="text-sm font-semibold">Operative</span>
                                        <p className="text-xs text-text-muted mt-0.5">Guess words</p>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Players list */}
                        <div className="border-t border-border-subtle pt-4">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                                Players ({gameState.players.length})
                                <span className="ml-2 text-accent-gold">
                                    {gameState.players.filter(p => p.ready).length}/{gameState.players.length} Ready
                                </span>
                            </p>
                            <div className="space-y-1.5">
                                {gameState.players.map(p => (
                                    <div key={p.id} className="flex items-center gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${p.team === 'red' ? 'bg-red-500' :
                                            p.team === 'blue' ? 'bg-blue-500' :
                                                'bg-text-muted'
                                            }`} />
                                        <span className={p.id === you.id ? 'text-accent-gold font-medium' : 'text-text-secondary'}>
                                            {p.name}{p.id === you.id ? ' (You)' : ''}
                                        </span>
                                        {p.role && (
                                            <span className="text-xs text-text-muted capitalize">
                                                {p.role === 'spymaster' ? '👁 Spymaster' : '🛡 Operative'}
                                            </span>
                                        )}
                                        <span className="ml-auto">
                                            {p.ready
                                                ? <CheckCircle className="w-4 h-4 text-green-400" />
                                                : <Circle className="w-4 h-4 text-text-muted/40" />
                                            }
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ready / Not Ready Toggle */}
                    <motion.button
                        id="ready-btn"
                        onClick={toggleReady}
                        className={`w-full font-display font-bold text-lg py-4 rounded-2xl
              transition-all duration-300 flex items-center justify-center gap-3
              disabled:opacity-40 disabled:cursor-not-allowed
              ${you.ready
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-600/20 hover:shadow-green-600/40'
                            }`}
                        disabled={!you.team || !you.role}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {you.ready ? (
                            <>
                                <Circle className="w-5 h-5" />
                                Not Ready
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Ready Up
                            </>
                        )}
                    </motion.button>

                    {/* Ready status hint */}
                    {you.ready && (
                        <motion.p
                            className="text-center text-xs text-text-muted mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            Waiting for all players to ready up...
                        </motion.p>
                    )}
                </motion.div>

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-xl px-6 py-3 text-sm text-red-400 shadow-2xl"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                        >
                            {toast}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ========== PLAYING / ENDED PHASE ==========
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-border-subtle glass-strong sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { clearStoredRoom(); router.push('/'); }}
                            className="text-text-muted hover:text-text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h1 className="font-display font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            CipherGrid
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={copyRoomCode}
                            className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs font-mono text-accent-gold hover:bg-bg-elevated transition-all"
                        >
                            {roomId}
                            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${isSpymaster
                            ? 'bg-accent-purple/20 text-accent-purple'
                            : 'bg-accent-gold/20 text-accent-gold'
                            }`}>
                            {isSpymaster ? <Eye className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {you.role}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto w-full p-4">
                {/* Game area */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Team Bar */}
                    <TeamBar
                        currentTurn={currentTurn}
                        redRemaining={gameState.redRemaining}
                        blueRemaining={gameState.blueRemaining}
                        players={gameState.players}
                        currentClue={gameState.currentClue}
                        remainingGuesses={gameState.remainingGuesses}
                        you={you}
                    />

                    {/* Board */}
                    <Board
                        board={gameState.board}
                        isSpymaster={isSpymaster}
                        isMyTurn={isMyTeamTurn}
                        canFlip={canFlip}
                        onFlip={flipCard}
                    />

                    {/* Action buttons */}
                    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
                        {/* Spymaster: Give Clue */}
                        {isSpymaster && isMyTeamTurn && phase === 'playing' && (
                            <ClueInput
                                onGiveClue={giveClue}
                                disabled={!canGiveClue}
                                teamColor={you.team!}
                            />
                        )}

                        {/* Operative: Pass Turn */}
                        {canPass && (
                            <motion.button
                                onClick={passTurn}
                                className="w-full glass-strong rounded-2xl py-3 px-6 text-sm font-semibold
                  text-text-secondary hover:text-text-primary
                  flex items-center justify-center gap-2
                  hover:bg-bg-elevated transition-all"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <SkipForward className="w-4 h-4" />
                                End Guessing / Pass Turn
                            </motion.button>
                        )}

                        {/* Waiting state */}
                        {phase === 'playing' && !isMyTeamTurn && (
                            <div className="glass rounded-2xl py-3 px-6 text-center text-sm text-text-muted">
                                Waiting for <span className={currentTurn === 'red' ? 'text-red-400' : 'text-blue-400'}>
                                    {currentTurn} team
                                </span> to play...
                            </div>
                        )}

                        {isMyTeamTurn && isSpymaster && gameState.currentClue && phase === 'playing' && (
                            <div className="glass rounded-2xl py-3 px-6 text-center text-sm text-text-muted">
                                Waiting for your operatives to guess...
                            </div>
                        )}

                        {isMyTeamTurn && !isSpymaster && !gameState.currentClue && phase === 'playing' && (
                            <div className="glass rounded-2xl py-3 px-6 text-center text-sm text-text-muted">
                                Waiting for your Spymaster to give a clue...
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Action Log */}
                <div className="w-full lg:w-72 xl:w-80 lg:shrink-0">
                    <ActionLog log={gameState.actionLog} />
                </div>
            </div>

            {/* Game Over */}
            <AnimatePresence>
                {phase === 'ended' && gameState.winner && (
                    <GameOver
                        winner={gameState.winner}
                        board={gameState.board}
                        onPlayAgain={handlePlayAgain}
                    />
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-xl px-6 py-3 text-sm text-red-400 shadow-2xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
