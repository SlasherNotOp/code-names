'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, UserPlus, Play, Flag, Zap, SkipForward } from 'lucide-react';
import { ActionLogEntry } from '@/lib/types';

interface ActionLogProps {
    log: ActionLogEntry[];
}

function getIcon(type: string) {
    switch (type) {
        case 'clue': return <MessageSquare className="w-3.5 h-3.5" />;
        case 'flip': return <Zap className="w-3.5 h-3.5" />;
        case 'pass': return <SkipForward className="w-3.5 h-3.5" />;
        case 'join': return <UserPlus className="w-3.5 h-3.5" />;
        case 'start': return <Play className="w-3.5 h-3.5" />;
        case 'end': return <Flag className="w-3.5 h-3.5" />;
        default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
}

function getTeamColor(team?: string) {
    switch (team) {
        case 'red': return 'text-red-400 border-red-500/20';
        case 'blue': return 'text-blue-400 border-blue-500/20';
        default: return 'text-text-secondary border-border-subtle';
    }
}

export default function ActionLog({ log }: ActionLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new entries
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [log.length]);

    return (
        <div className="glass-strong rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent-gold" />
                <span className="text-sm font-semibold text-text-primary">Action Log</span>
                <span className="text-xs text-text-muted ml-auto">{log.length} events</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-1.5"
                style={{ maxHeight: '400px' }}
            >
                <AnimatePresence mode="popLayout">
                    {log.map((entry, i) => (
                        <motion.div
                            key={`${entry.timestamp}-${i}`}
                            className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs border
                ${getTeamColor(entry.team)}
                bg-bg-primary/30
              `}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <span className="mt-0.5 shrink-0 opacity-70">{getIcon(entry.type)}</span>
                            <span className="leading-relaxed">{entry.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {log.length === 0 && (
                    <div className="text-center text-text-muted text-xs py-8">
                        Waiting for the game to start...
                    </div>
                )}
            </div>
        </div>
    );
}
