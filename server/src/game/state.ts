// ============================
// CipherGrid — Game State Store
// ============================
import { GameState } from './types';

/**
 * In-memory room store. 
 * Designed for easy migration to Redis later.
 */
class GameStore {
    private rooms: Map<string, GameState> = new Map();

    create(roomId: string, state: GameState): void {
        this.rooms.set(roomId, state);
    }

    get(roomId: string): GameState | undefined {
        return this.rooms.get(roomId);
    }

    delete(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }

    has(roomId: string): boolean {
        return this.rooms.has(roomId);
    }

    /**
     * Find a room by player ID (for reconnection)
     */
    findByPlayerId(playerId: string): GameState | undefined {
        for (const state of this.rooms.values()) {
            if (state.players.has(playerId)) {
                return state;
            }
        }
        return undefined;
    }

    /**
     * Clean up stale rooms (older than 2 hours with no connected players)
     */
    cleanup(): void {
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        for (const [roomId, state] of this.rooms.entries()) {
            const hasConnected = Array.from(state.players.values()).some(p => p.connected);
            if (!hasConnected && state.createdAt < twoHoursAgo) {
                this.rooms.delete(roomId);
                console.log(`[Cleanup] Removed stale room: ${roomId}`);
            }
        }
    }

    get size(): number {
        return this.rooms.size;
    }
}

export const gameStore = new GameStore();

// Run cleanup every 30 minutes
setInterval(() => gameStore.cleanup(), 30 * 60 * 1000);
