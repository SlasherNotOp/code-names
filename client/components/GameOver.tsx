'use client';

import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Skull } from 'lucide-react';
import { TeamColor, ClientCard } from '@/lib/types';

interface GameOverProps {
    winner: TeamColor;
    board: ClientCard[];
    onPlayAgain: () => void;
}

export default function GameOver({ winner, board, onPlayAgain }: GameOverProps) {
    const isAssassinKill = board.some(c => c.color === 'assassin' && c.revealed);

    const winColor = winner === 'red'
        ? 'from-red-600/20 via-red-900/10 to-transparent'
        : 'from-blue-600/20 via-blue-900/10 to-transparent';

    const textColor = winner === 'red' ? 'text-red-400' : 'text-blue-400';
    const glowClass = winner === 'red' ? 'glow-red' : 'glow-blue';

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={`
          glass-strong rounded-3xl p-8 sm:p-12 max-w-md w-full mx-4
          border-2 ${winner === 'red' ? 'border-red-500/30' : 'border-blue-500/30'}
          ${glowClass}
        `}
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            >
                <div className={`bg-gradient-to-b ${winColor} absolute inset-0 rounded-3xl pointer-events-none`} />

                <div className="relative z-10 text-center">
                    {/* Icon */}
                    <motion.div
                        className="mx-auto mb-6 w-20 h-20 rounded-full bg-bg-primary/50 flex items-center justify-center"
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        {isAssassinKill ? (
                            <Skull className="w-10 h-10 text-red-400" />
                        ) : (
                            <Trophy className={`w-10 h-10 ${textColor}`} />
                        )}
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        className={`text-3xl sm:text-4xl font-display font-black uppercase tracking-wider mb-2 ${textColor}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {winner} Wins!
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        className="text-text-secondary text-sm mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {isAssassinKill
                            ? 'The opposing team hit the Assassin!'
                            : `${winner === 'red' ? 'Red' : 'Blue'} team found all their agents!`
                        }
                    </motion.p>

                    {/* Play Again */}
                    <motion.button
                        onClick={onPlayAgain}
                        className={`
              px-8 py-3 rounded-xl font-display font-bold uppercase tracking-wider
              ${winner === 'red'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
                            }
              text-white shadow-lg transition-all duration-200
              flex items-center gap-2 mx-auto
            `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <RotateCcw className="w-4 h-4" />
                        Play Again
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
