// ============================
// CipherGrid — Anonymous Identity
// ============================

const PLAYER_ID_KEY = 'ciphergrid_player_id';
const PLAYER_TOKEN_KEY = 'ciphergrid_token';
const PLAYER_NAME_KEY = 'ciphergrid_player_name';
const ROOM_KEY = 'ciphergrid_room_id';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

export interface Identity {
    playerId: string;
    token: string;
    playerName: string;
}

/**
 * Get or create anonymous player identity.
 * Generates a new identity from the server if none exists or if forceRefresh is true.
 */
export async function getIdentity(forceRefresh: boolean = false): Promise<Identity> {
    const existingId = localStorage.getItem(PLAYER_ID_KEY);
    const existingToken = localStorage.getItem(PLAYER_TOKEN_KEY);
    const existingName = localStorage.getItem(PLAYER_NAME_KEY);

    if (!forceRefresh && existingId && existingToken && existingName) {
        return { playerId: existingId, token: existingToken, playerName: existingName };
    }

    // Generate new identity from server
    const res = await fetch(`${SERVER_URL}/auth/anonymous`, { method: 'POST' });
    const data = await res.json();

    const name = existingName || generateDisplayName();

    localStorage.setItem(PLAYER_ID_KEY, data.playerId);
    localStorage.setItem(PLAYER_TOKEN_KEY, data.token);
    localStorage.setItem(PLAYER_NAME_KEY, name);

    return { playerId: data.playerId, token: data.token, playerName: name };
}

/**
 * Clear stored identity
 */
export function clearIdentity(): void {
    localStorage.removeItem(PLAYER_ID_KEY);
    localStorage.removeItem(PLAYER_TOKEN_KEY);
    localStorage.removeItem(PLAYER_NAME_KEY);
}

/**
 * Update the stored player name
 */
export function setPlayerName(name: string): void {
    localStorage.setItem(PLAYER_NAME_KEY, name);
}

/**
 * Get stored room ID for reconnection
 */
export function getStoredRoom(): string | null {
    return localStorage.getItem(ROOM_KEY);
}

/**
 * Store the current room ID
 */
export function setStoredRoom(roomId: string): void {
    localStorage.setItem(ROOM_KEY, roomId);
}

/**
 * Clear stored room
 */
export function clearStoredRoom(): void {
    localStorage.removeItem(ROOM_KEY);
}

/**
 * Generate a fun display name
 */
function generateDisplayName(): string {
    const adjectives = ['Swift', 'Clever', 'Bold', 'Stealthy', 'Mystic', 'Noble', 'Daring', 'Cosmic', 'Lunar', 'Solar',
        'Crimson', 'Golden', 'Silver', 'Azure', 'Shadow', 'Silent', 'Thunder', 'Storm', 'Frost', 'Blaze'];
    const nouns = ['Fox', 'Hawk', 'Wolf', 'Panther', 'Falcon', 'Eagle', 'Lynx', 'Viper', 'Tiger', 'Bear',
        'Raven', 'Phoenix', 'Dragon', 'Knight', 'Sphinx', 'Jaguar', 'Cobra', 'Owl', 'Lion', 'Shark'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}`;
}
