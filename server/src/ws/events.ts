// ============================
// CipherGrid — WebSocket Event Constants
// ============================

export const WS_EVENTS = {
    // Client → Server
    CREATE_ROOM: 'CREATE_ROOM',
    JOIN_ROOM: 'JOIN_ROOM',
    SELECT_TEAM: 'SELECT_TEAM',
    SELECT_ROLE: 'SELECT_ROLE',
    TOGGLE_READY: 'TOGGLE_READY',
    GIVE_CLUE: 'GIVE_CLUE',
    FLIP_CARD: 'FLIP_CARD',
    PASS_TURN: 'PASS_TURN',
    RECONNECT: 'RECONNECT',

    // Server → Client
    ROOM_CREATED: 'ROOM_CREATED',
    GAME_STATE: 'GAME_STATE',
    ERROR: 'ERROR',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    CARD_FLIPPED: 'CARD_FLIPPED',
    CLUE_GIVEN: 'CLUE_GIVEN',
    TURN_CHANGED: 'TURN_CHANGED',
    GAME_OVER: 'GAME_OVER',
} as const;
