// ============================
// CipherGrid — Client Types
// ============================

export type TeamColor = 'red' | 'blue';
export type CardColor = 'red' | 'blue' | 'neutral' | 'assassin';
export type PlayerRole = 'spymaster' | 'operative';
export type GamePhase = 'lobby' | 'playing' | 'ended';

export interface Clue {
    word: string;
    count: number;
    team: TeamColor;
    timestamp: number;
}

export interface ClientCard {
    word: string;
    color: CardColor | 'hidden';
    revealed: boolean;
}

export interface PlayerInfo {
    id: string;
    name: string;
    team?: TeamColor;
    role?: PlayerRole;
    connected: boolean;
    // ready: boolean;
    isHost: boolean;

}

export interface ClientGameState {
    roomId: string;
    board: ClientCard[];
    players: PlayerInfo[];
    phase: GamePhase;
    currentTurn: TeamColor;
    currentClue: Clue | null;
    remainingGuesses: number;
    actionLog: ActionLogEntry[];
    winner: TeamColor | null;
    redRemaining: number;
    blueRemaining: number;
    you: PlayerInfo;
}

export interface ActionLogEntry {
    type: 'clue' | 'flip' | 'pass' | 'join' | 'leave' | 'start' | 'end';
    team?: TeamColor;
    playerName?: string;
    message: string;
    timestamp: number;
}
