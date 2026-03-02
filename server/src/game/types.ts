// ============================
// CipherGrid — Game Types
// ============================

export type TeamColor = 'red' | 'blue';
export type CardColor = 'red' | 'blue' | 'neutral' | 'assassin';
export type PlayerRole = 'spymaster' | 'operative';
export type GamePhase = 'lobby' | 'playing' | 'ended';

export interface Card {
    word: string;
    color: CardColor;
    revealed: boolean;
    revealedBy?: string; // playerId
}

export interface Clue {
    word: string;
    count: number;
    team: TeamColor;
    timestamp: number;
}

export interface Player {
    id: string;
    name: string;
    team?: TeamColor;
    role?: PlayerRole;
    connected: boolean;
    ready: boolean;
    isHost: boolean;
}

export interface GameState {
    roomId: string;
    board: Card[];
    players: Map<string, Player>;
    phase: GamePhase;
    currentTurn: TeamColor;
    startingTeam: TeamColor;
    clues: Clue[];
    currentClue: Clue | null;
    remainingGuesses: number;
    actionLog: ActionLogEntry[];
    winner: TeamColor | null;
    redRemaining: number;
    blueRemaining: number;
    createdAt: number;
    flipLock: boolean; // concurrency guard
}

export interface ActionLogEntry {
    type: 'clue' | 'flip' | 'pass' | 'join' | 'leave' | 'start' | 'end';
    team?: TeamColor;
    playerName?: string;
    message: string;
    timestamp: number;
}

// Filtered state sent to clients (cards may have color hidden)
export interface ClientCard {
    word: string;
    color: CardColor | 'hidden';
    revealed: boolean;
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

export interface PlayerInfo {
    id: string;
    name: string;
    team?: TeamColor;
    role?: PlayerRole;
    connected: boolean;
    ready: boolean;
}

// WebSocket Event Types
export type ClientEvent =
    | { type: 'CREATE_ROOM'; playerName: string }
    | { type: 'JOIN_ROOM'; roomId: string; playerName: string }
    | { type: 'SELECT_TEAM'; team: TeamColor }
    | { type: 'SELECT_ROLE'; role: PlayerRole }
    | { type: 'TOGGLE_READY' }
    | { type: 'GIVE_CLUE'; word: string; count: number }
    | { type: 'FLIP_CARD'; cardIndex: number }
    | { type: 'PASS_TURN' }
    | { type: 'RECONNECT'; roomId: string };

export type ServerEvent =
    | { type: 'ROOM_CREATED'; roomId: string }
    | { type: 'GAME_STATE'; state: ClientGameState }
    | { type: 'ERROR'; message: string }
    | { type: 'PLAYER_JOINED'; player: PlayerInfo }
    | { type: 'PLAYER_LEFT'; playerId: string }
    | { type: 'CARD_FLIPPED'; cardIndex: number; card: ClientCard; flipperName: string }
    | { type: 'CLUE_GIVEN'; clue: Clue }
    | { type: 'TURN_CHANGED'; team: TeamColor }
    | { type: 'GAME_OVER'; winner: TeamColor; board: ClientCard[] };
