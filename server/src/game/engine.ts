// ============================
// CipherGrid — Game Engine
// ============================
import { Card, CardColor, TeamColor, GameState, Clue, ActionLogEntry, ClientGameState, ClientCard, Player, PlayerInfo } from './types';
import { WORD_LIST } from '../data/words';

/**
 * Shuffle an array in-place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Generate a new 5×5 board with 25 random words and assigned colors.
 * Starting team gets 9 cards, other team gets 8, 7 neutral, 1 assassin.
 */
export function generateBoard(startingTeam: TeamColor): Card[] {
    const words = shuffle([...WORD_LIST]).slice(0, 25);

    const otherTeam: TeamColor = startingTeam === 'red' ? 'blue' : 'red';

    // 9 starting, 8 other, 7 neutral, 1 assassin
    const colors: CardColor[] = [
        ...Array(9).fill(startingTeam),
        ...Array(8).fill(otherTeam),
        ...Array(7).fill('neutral' as CardColor),
        'assassin',
    ];

    shuffle(colors);

    return words.map((word, i) => ({
        word,
        color: colors[i],
        revealed: false,
    }));
}

/**
 * Generate a random room code (6 uppercase characters)
 */
export function generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

/**
 * Create a new game state for a room
 */
export function createGameState(roomId: string): GameState {
    const startingTeam: TeamColor = Math.random() < 0.5 ? 'red' : 'blue';
    return {
        roomId,
        board: [], // Generated when game starts
        players: new Map(),
        phase: 'lobby',
        currentTurn: startingTeam,
        startingTeam,
        clues: [],
        currentClue: null,
        remainingGuesses: 0,
        actionLog: [],
        winner: null,
        redRemaining: startingTeam === 'red' ? 9 : 8,
        blueRemaining: startingTeam === 'blue' ? 9 : 8,
        createdAt: Date.now(),
        flipLock: false,
    };
}

/**
 * Start the game: generate the board and transition to playing phase.
 */
export function startGame(state: GameState): { success: boolean; error?: string } {
    if (state.phase !== 'lobby') {
        return { success: false, error: 'Game already started' };
    }

    // Validate teams: need at least 1 player on each team with at least 1 spymaster per team
    const players = Array.from(state.players.values());
    const redPlayers = players.filter(p => p.team === 'red');
    const bluePlayers = players.filter(p => p.team === 'blue');
    const redSpymasters = redPlayers.filter(p => p.role === 'spymaster');
    const blueSpymasters = bluePlayers.filter(p => p.role === 'spymaster');

    if (redPlayers.length === 0 || bluePlayers.length === 0) {
        return { success: false, error: 'Each team needs at least one player' };
    }
    if (redSpymasters.length === 0 || blueSpymasters.length === 0) {
        return { success: false, error: 'Each team needs a Spymaster' };
    }

    state.board = generateBoard(state.startingTeam);
    state.phase = 'playing';
    state.redRemaining = state.board.filter(c => c.color === 'red' && !c.revealed).length;
    state.blueRemaining = state.board.filter(c => c.color === 'blue' && !c.revealed).length;

    addLog(state, {
        type: 'start',
        message: `Game started! ${state.startingTeam.toUpperCase()} team goes first.`,
        timestamp: Date.now(),
    });

    return { success: true };
}

/**
 * Give a clue (Spymaster action)
 */
export function giveClue(
    state: GameState,
    playerId: string,
    word: string,
    count: number
): { success: boolean; error?: string } {
    if (state.phase !== 'playing') return { success: false, error: 'Game is not in progress' };

    const player = state.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.role !== 'spymaster') return { success: false, error: 'Only Spymasters can give clues' };
    if (player.team !== state.currentTurn) return { success: false, error: "It's not your team's turn" };
    if (state.currentClue) return { success: false, error: 'A clue has already been given this turn' };

    // Validate clue word isn't on the board
    const upperWord = word.toUpperCase().trim();
    if (state.board.some(c => c.word === upperWord && !c.revealed)) {
        return { success: false, error: 'Clue word cannot be a word on the board' };
    }

    if (count < 0 || count > 9) {
        return { success: false, error: 'Clue count must be between 0 and 9' };
    }

    const clue: Clue = {
        word: upperWord,
        count,
        team: state.currentTurn,
        timestamp: Date.now(),
    };

    state.currentClue = clue;
    state.clues.push(clue);
    // Operatives get count + 1 guesses (standard Codenames rule)
    state.remainingGuesses = count === 0 ? Infinity : count + 1;

    addLog(state, {
        type: 'clue',
        team: state.currentTurn,
        playerName: player.name,
        message: `${player.name} gives clue: "${upperWord}: ${count}"`,
        timestamp: Date.now(),
    });

    return { success: true };
}

/**
 * Flip a card (Operative action)
 */
export function flipCard(
    state: GameState,
    playerId: string,
    cardIndex: number
): { success: boolean; error?: string; turnEnded?: boolean; gameEnded?: boolean } {
    if (state.phase !== 'playing') return { success: false, error: 'Game is not in progress' };
    if (state.flipLock) return { success: false, error: 'Another card is being flipped' };

    const player = state.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.role !== 'operative') return { success: false, error: 'Only Operatives can flip cards' };
    if (player.team !== state.currentTurn) return { success: false, error: "It's not your team's turn" };
    if (!state.currentClue) return { success: false, error: 'Wait for your Spymaster to give a clue' };

    if (cardIndex < 0 || cardIndex >= 25) return { success: false, error: 'Invalid card index' };
    const card = state.board[cardIndex];
    if (card.revealed) return { success: false, error: 'Card already revealed' };

    // Concurrency lock
    state.flipLock = true;

    try {
        card.revealed = true;
        card.revealedBy = playerId;

        // Update remaining counts
        if (card.color === 'red') state.redRemaining--;
        if (card.color === 'blue') state.blueRemaining--;

        addLog(state, {
            type: 'flip',
            team: state.currentTurn,
            playerName: player.name,
            message: `${player.name} flips "${card.word}" → ${card.color.toUpperCase()}`,
            timestamp: Date.now(),
        });

        // Check assassin → instant loss
        if (card.color === 'assassin') {
            const losingTeam = state.currentTurn;
            state.winner = losingTeam === 'red' ? 'blue' : 'red';
            state.phase = 'ended';
            addLog(state, {
                type: 'end',
                message: `💀 ASSASSIN! ${state.winner.toUpperCase()} team wins!`,
                timestamp: Date.now(),
            });
            return { success: true, gameEnded: true };
        }

        // Check if a team has found all their cards
        if (state.redRemaining === 0) {
            state.winner = 'red';
            state.phase = 'ended';
            addLog(state, {
                type: 'end',
                message: `🎉 RED team found all their agents! RED wins!`,
                timestamp: Date.now(),
            });
            return { success: true, gameEnded: true };
        }
        if (state.blueRemaining === 0) {
            state.winner = 'blue';
            state.phase = 'ended';
            addLog(state, {
                type: 'end',
                message: `🎉 BLUE team found all their agents! BLUE wins!`,
                timestamp: Date.now(),
            });
            return { success: true, gameEnded: true };
        }

        // Decrement remaining guesses
        state.remainingGuesses--;

        // If wrong team card or neutral → end turn
        if (card.color !== state.currentTurn) {
            switchTurn(state);
            return { success: true, turnEnded: true };
        }

        // If no guesses remaining → end turn
        if (state.remainingGuesses <= 0) {
            switchTurn(state);
            return { success: true, turnEnded: true };
        }

        return { success: true };
    } finally {
        state.flipLock = false;
    }
}

/**
 * Pass the turn (Operative action)
 */
export function passTurn(state: GameState, playerId: string): { success: boolean; error?: string } {
    if (state.phase !== 'playing') return { success: false, error: 'Game is not in progress' };

    const player = state.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.team !== state.currentTurn) return { success: false, error: "It's not your team's turn" };
    if (!state.currentClue) return { success: false, error: 'No active clue to pass on' };

    addLog(state, {
        type: 'pass',
        team: state.currentTurn,
        playerName: player.name,
        message: `${player.name} passes the turn`,
        timestamp: Date.now(),
    });

    switchTurn(state);
    return { success: true };
}

/**
 * Switch the active turn to the other team
 */
function switchTurn(state: GameState): void {
    state.currentTurn = state.currentTurn === 'red' ? 'blue' : 'red';
    state.currentClue = null;
    state.remainingGuesses = 0;

    addLog(state, {
        type: 'pass',
        team: state.currentTurn,
        message: `${state.currentTurn.toUpperCase()} team's turn`,
        timestamp: Date.now(),
    });
}

/**
 * Add an entry to the action log
 */
function addLog(state: GameState, entry: ActionLogEntry): void {
    state.actionLog.push(entry);
}

/**
 * Convert internal Player to external PlayerInfo
 */
function toPlayerInfo(player: Player): PlayerInfo {
    return {
        id: player.id,
        name: player.name,
        team: player.team,
        role: player.role,
        connected: player.connected,
        // ready: player.ready,
        isHost: player.isHost,
    };
}

/**
 * Check if all players are ready to start (have team, role, and ready flag)
 */
// export function checkAllReady(state: GameState): boolean {
//     const players = Array.from(state.players.values());
//     if (players.length < 2) return false;
//     return players.every(p => p.team && p.role && p.ready);
// }

/**
 * Get the game state filtered for a specific player.
 * Operatives see 'hidden' for unrevealed card colors.
 * Spymasters see all colors.
 */
export function getFilteredState(state: GameState, playerId: string): ClientGameState {
    const player = state.players.get(playerId);
    const isSpymaster = player?.role === 'spymaster';

    const board: ClientCard[] = state.board.map(card => {
        if (card.revealed) {
            return { word: card.word, color: card.color, revealed: true };
        }
        if (isSpymaster) {
            return { word: card.word, color: card.color, revealed: false };
        }
        // Operative: hide color
        return { word: card.word, color: 'hidden' as const, revealed: false };
    });

    const players = Array.from(state.players.values()).map(toPlayerInfo);
    const you = player ? toPlayerInfo(player) : {
        id: playerId,
        name: 'Unknown',
        connected: false,
        // ready: false,
        isHost: false,
    };

    return {
        roomId: state.roomId,
        board,
        players,
        phase: state.phase,
        currentTurn: state.currentTurn,
        currentClue: state.currentClue,
        remainingGuesses: state.remainingGuesses,
        actionLog: state.actionLog,
        winner: state.winner,
        redRemaining: state.redRemaining,
        blueRemaining: state.blueRemaining,
        you,
    };
}
