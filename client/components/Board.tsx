'use client';

import { motion } from 'framer-motion';
import Card from './Card';
import { ClientCard } from '@/lib/types';

interface BoardProps {
    board: ClientCard[];
    isSpymaster: boolean;
    isMyTurn: boolean;
    canFlip: boolean;
    onFlip: (index: number) => void;
}

export default function Board({ board, isSpymaster, isMyTurn, canFlip, onFlip }: BoardProps) {
    if (!board || board.length === 0) return null;

    return (
        <motion.div
            className="grid-board w-full max-w-4xl mx-auto px-2 sm:px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            {board.map((card, index) => (
                <Card
                    key={`${card.word}-${index}`}
                    card={card}
                    index={index}
                    isSpymaster={isSpymaster}
                    isMyTurn={isMyTurn}
                    canFlip={canFlip}
                    onFlip={onFlip}
                />
            ))}
        </motion.div>
    );
}
