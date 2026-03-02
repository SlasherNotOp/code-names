'use client';

import { motion } from 'framer-motion';
import { ClientCard } from '@/lib/types';
import { Skull } from 'lucide-react';

interface CardProps {
    card: ClientCard;
    index: number;
    isSpymaster: boolean;
    isMyTurn: boolean;
    canFlip: boolean;
    onFlip: (index: number) => void;
}

function getCardColorClasses(color: string, revealed: boolean) {
    if (!revealed) {
        switch (color) {
            case 'red':
                return 'bg-red-900/30 border-red-500/40 text-red-200';
            case 'blue':
                return 'bg-blue-900/30 border-blue-500/40 text-blue-200';
            case 'neutral':
                return 'bg-stone-800/30 border-stone-500/30 text-stone-300';
            case 'assassin':
                return 'bg-zinc-900/50 border-red-800/50 text-red-300';
            default:
                return 'bg-bg-card border-border-subtle text-text-primary';
        }
    }

    switch (color) {
        case 'red':
            return 'bg-gradient-to-br from-red-600 to-red-800 border-red-400 text-white shadow-lg shadow-red-900/40';
        case 'blue':
            return 'bg-gradient-to-br from-blue-600 to-blue-800 border-blue-400 text-white shadow-lg shadow-blue-900/40';
        case 'neutral':
            return 'bg-gradient-to-br from-stone-500 to-stone-700 border-stone-400 text-stone-100 shadow-lg shadow-stone-900/40';
        case 'assassin':
            return 'bg-gradient-to-br from-zinc-900 to-black border-red-500 text-red-400 shadow-lg shadow-red-900/50';
        default:
            return 'bg-bg-card border-border-subtle text-text-primary';
    }
}

export default function Card({ card, index, isSpymaster, isMyTurn, canFlip, onFlip }: CardProps) {
    const isClickable = !card.revealed && canFlip && isMyTurn && !isSpymaster && card.color === 'hidden';
    const colorToShow = isSpymaster ? card.color : (card.revealed ? card.color : 'hidden');
    const colorClasses = colorToShow !== 'hidden'
        ? getCardColorClasses(colorToShow, card.revealed)
        : 'bg-bg-card border-border-subtle hover:border-accent-gold/50 text-text-primary';

    return (
        <motion.button
            id={`card-${index}`}
            onClick={() => isClickable && onFlip(index)}
            className={`
        card-container relative rounded-xl border-2 p-2 sm:p-3 lg:p-4
        flex items-center justify-center
        min-h-[56px] sm:min-h-[72px] lg:min-h-[88px]
        font-display font-semibold text-xs sm:text-sm lg:text-base
        transition-all duration-300 select-none
        ${colorClasses}
        ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-xl active:scale-95' : ''}
        ${!isClickable && !card.revealed ? 'cursor-default' : ''}
        ${card.revealed ? 'cursor-default' : ''}
        ${isSpymaster && !card.revealed ? 'opacity-70' : ''}
      `}
            whileHover={isClickable ? { y: -2 } : {}}
            whileTap={isClickable ? { scale: 0.95 } : {}}
            initial={card.revealed ? { rotateY: 180, opacity: 0 } : { opacity: 0, y: 10 }}
            animate={card.revealed
                ? { rotateY: 0, opacity: 1, transition: { duration: 0.5, type: 'spring' } }
                : { opacity: 1, y: 0, transition: { delay: index * 0.02 } }
            }
            layout
        >
            {/* Card content */}
            <span className="relative z-10 text-center leading-tight tracking-wide uppercase">
                {card.word}
            </span>

            {/* Assassin skull icon */}
            {colorToShow === 'assassin' && (
                <Skull className="absolute top-1 right-1 w-3 h-3 sm:w-4 sm:h-4 text-red-500/60" />
            )}

            {/* Spymaster color indicator dot */}
            {isSpymaster && !card.revealed && (
                <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${card.color === 'red' ? 'bg-red-500' :
                        card.color === 'blue' ? 'bg-blue-500' :
                            card.color === 'assassin' ? 'bg-red-800' :
                                'bg-stone-500'
                    }`} />
            )}

            {/* Revealed shimmer effect */}
            {card.revealed && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            )}
        </motion.button>
    );
}
