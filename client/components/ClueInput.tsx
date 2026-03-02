'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle } from 'lucide-react';

interface ClueInputProps {
    onGiveClue: (word: string, count: number) => void;
    disabled: boolean;
    teamColor: 'red' | 'blue';
}

export default function ClueInput({ onGiveClue, disabled, teamColor }: ClueInputProps) {
    const [word, setWord] = useState('');
    const [count, setCount] = useState(1);
    const [error, setError] = useState('');

    const colors = teamColor === 'red'
        ? 'border-red-500/40 focus:border-red-400 focus:ring-red-500/20'
        : 'border-blue-500/40 focus:border-blue-400 focus:ring-blue-500/20';

    const buttonColor = teamColor === 'red'
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-900/30'
        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-900/30';

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const trimmed = word.trim();
        if (!trimmed) {
            setError('Enter a clue word');
            return;
        }
        if (trimmed.includes(' ')) {
            setError('Clue must be a single word');
            return;
        }

        onGiveClue(trimmed, count);
        setWord('');
        setCount(1);
    }

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="glass-strong rounded-2xl p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${teamColor === 'red' ? 'bg-red-500' : 'bg-blue-500'} turn-pulse`} />
                <span className="text-sm font-medium text-text-secondary">Give Your Clue</span>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={word}
                    onChange={e => { setWord(e.target.value); setError(''); }}
                    placeholder="Clue word..."
                    disabled={disabled}
                    className={`
            flex-1 bg-bg-primary/60 border rounded-xl px-4 py-2.5
            text-text-primary placeholder-text-muted
            focus:outline-none focus:ring-2 transition-all
            font-mono uppercase tracking-wider text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${colors}
          `}
                />

                <select
                    value={count}
                    onChange={e => setCount(parseInt(e.target.value))}
                    disabled={disabled}
                    className={`
            w-16 bg-bg-primary/60 border rounded-xl px-2 py-2.5
            text-text-primary text-center font-mono
            focus:outline-none focus:ring-2 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${colors}
          `}
                >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>

                <motion.button
                    type="submit"
                    disabled={disabled || !word.trim()}
                    className={`
            ${buttonColor} px-4 py-2.5 rounded-xl
            text-white font-semibold shadow-lg
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center gap-2
          `}
                    whileHover={!disabled ? { scale: 1.05 } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                >
                    <Send className="w-4 h-4" />
                </motion.button>
            </div>

            {error && (
                <motion.div
                    className="flex items-center gap-2 text-red-400 text-xs"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </motion.div>
            )}
        </motion.form>
    );
}
