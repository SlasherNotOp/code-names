'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Users } from 'lucide-react';
import { PlayerInfo, TeamColor, Clue } from '@/lib/types';

interface TeamBarProps {
    currentTurn: TeamColor;
    redRemaining: number;
    blueRemaining: number;
    players: PlayerInfo[];
    currentClue: Clue | null;
    remainingGuesses: number;
    you: PlayerInfo;
}

export default function TeamBar({
    currentTurn,
    redRemaining,
    blueRemaining,
    players,
    currentClue,
    remainingGuesses,
    you,
}: TeamBarProps) {
    const redPlayers = players.filter(p => p.team === 'red');
    const bluePlayers = players.filter(p => p.team === 'blue');

    return (
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
            {/* Turn indicator */}
            <motion.div
                className={`
          text-center py-3 px-6 rounded-2xl mb-4 font-display
          ${currentTurn === 'red'
                        ? 'bg-red-900/30 border border-red-500/30 glow-red'
                        : 'bg-blue-900/30 border border-blue-500/30 glow-blue'
                    }
        `}
                key={currentTurn}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
            >
                <div className="text-lg sm:text-xl font-bold uppercase tracking-widest turn-pulse">
                    <span className={currentTurn === 'red' ? 'text-red-400' : 'text-blue-400'}>
                        {currentTurn} Team's Turn
                    </span>
                </div>
                {currentClue && (
                    <motion.div
                        className="mt-1.5 text-sm text-text-secondary"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        Clue: <span className="font-mono font-bold text-accent-gold">"{currentClue.word}" : {currentClue.count}</span>
                        <span className="ml-3 text-text-muted">
                            ({remainingGuesses === Infinity ? '∞' : remainingGuesses} guesses left)
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* Score & Teams */}
            <div className="flex items-stretch gap-3">
                {/* Red Team */}
                <div className="flex-1 glass rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
                            <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Red</span>
                        </div>
                        <span className="text-2xl font-display font-black text-red-400">{redRemaining}</span>
                    </div>
                    <div className="space-y-1">
                        {redPlayers.map(p => (
                            <div key={p.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                                {p.role === 'spymaster' ? <Eye className="w-3 h-3 text-red-400" /> : <Shield className="w-3 h-3 text-red-400/60" />}
                                <span className={`${!p.connected ? 'opacity-40' : ''} ${p.id === you.id ? 'text-accent-gold font-semibold' : ''}`}>
                                    {p.name}{p.id === you.id ? ' (You)' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VS */}
                <div className="flex items-center">
                    <span className="text-text-muted font-display font-bold text-lg">VS</span>
                </div>

                {/* Blue Team */}
                <div className="flex-1 glass rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30" />
                            <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Blue</span>
                        </div>
                        <span className="text-2xl font-display font-black text-blue-400">{blueRemaining}</span>
                    </div>
                    <div className="space-y-1">
                        {bluePlayers.map(p => (
                            <div key={p.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                                {p.role === 'spymaster' ? <Eye className="w-3 h-3 text-blue-400" /> : <Shield className="w-3 h-3 text-blue-400/60" />}
                                <span className={`${!p.connected ? 'opacity-40' : ''} ${p.id === you.id ? 'text-accent-gold font-semibold' : ''}`}>
                                    {p.name}{p.id === you.id ? ' (You)' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
