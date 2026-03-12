// ============================
// CipherGrid — WebSocket Handler
// ============================
import WebSocket from 'ws';
import { ClientEvent, Player, ServerEvent, ClientCard } from '../game/types';
import { createGameState, generateRoomId, startGame, giveClue, flipCard, passTurn, getFilteredState } from '../game/engine';
import { gameStore } from '../game/state';
import { verifyToken } from '../auth/jwt';

// Map WebSocket connections to player IDs and room IDs
interface SocketMeta {
    playerId: string;
    roomId?: string;
}

const socketMap = new Map<WebSocket, SocketMeta>();
const playerSockets = new Map<string, WebSocket>();

/**
 * Send a typed event to a WebSocket client
 */
function send(ws: WebSocket, event: ServerEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
    }
}

/**
 * Broadcast the filtered game state to all players in a room
 */
function broadcastGameState(roomId: string): void {
    const state = gameStore.get(roomId);
    if (!state) return;

    for (const [playerId] of state.players) {
        const ws = playerSockets.get(playerId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            send(ws, {
                type: 'GAME_STATE',
                state: getFilteredState(state, playerId),
            });
        }
    }
}

/**
 * Generate a fun random name for anonymous players
 */
function generatePlayerName(): string {
    const adjectives = ['Swift', 'Clever', 'Bold', 'Stealthy', 'Mystic', 'Noble', 'Daring', 'Cosmic', 'Lunar', 'Solar',
        'Crimson', 'Golden', 'Silver', 'Azure', 'Shadow', 'Silent', 'Thunder', 'Storm', 'Frost', 'Blaze'];
    const nouns = ['Fox', 'Hawk', 'Wolf', 'Panther', 'Falcon', 'Eagle', 'Lynx', 'Viper', 'Tiger', 'Bear',
        'Raven', 'Phoenix', 'Dragon', 'Knight', 'Sphinx', 'Jaguar', 'Cobra', 'Owl', 'Lion', 'Shark'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}`;
}

/**
 * Handle a new WebSocket connection
 */
export function handleConnection(ws: WebSocket, token?: string): void {
    let playerId: string | null = null;

    if (token) {
        playerId = verifyToken(token);
    }

    if (!playerId) {
        // Invalid or no token - send error
        send(ws, { type: 'ERROR', message: 'Invalid or missing authentication token' });
        ws.close();
        return;
    }

    // Store socket mapping
    socketMap.set(ws, { playerId });
    playerSockets.set(playerId, ws);

    console.log(`[WS] Player connected: ${playerId}`);

    // Handle messages
    ws.on('message', (data: WebSocket.Data) => {
        try {
            const event = JSON.parse(data.toString()) as ClientEvent;
            handleEvent(ws, playerId!, event);
        } catch (err) {
            send(ws, { type: 'ERROR', message: 'Invalid message format' });
        }
    });

    // Handle disconnect
    ws.on('close', () => {
        const meta = socketMap.get(ws);
        if (meta) {
            socketMap.delete(ws);
            playerSockets.delete(meta.playerId);

            // Mark player as disconnected
            if (meta.roomId) {
                const state = gameStore.get(meta.roomId);
                if (state) {
                    const player = state.players.get(meta.playerId);
                    if (player) {
                        player.connected = false;
                        if (player.isHost) {
                            const newHost = Array.from(state.players.values()).find(p => !p.isHost);
                            if (newHost) {
                                newHost.isHost = true;
                            }
                        }
                        broadcastGameState(meta.roomId);
                    }
                }
            }
            console.log(`[WS] Player disconnected: ${meta.playerId}`);
        }
    });
}

/**
 * Route and handle client events
 */
function handleEvent(ws: WebSocket, playerId: string, event: ClientEvent): void {
    switch (event.type) {
        case 'CREATE_ROOM':
            handleCreateRoom(ws, playerId, event.playerName);
            break;
        case 'START_GAME':
            handleStartGame(ws, playerId);
            break;
        case 'KICK_PLAYER':
            handleKickPlayer(ws, playerId, event.playerId);
            break;
        case 'MAKE_HOST':
            handleMakeHost(ws, playerId, event.playerId);
            break;
        case 'JOIN_ROOM':
            handleJoinRoom(ws, playerId, event.roomId, event.playerName);
            break;
        case 'SELECT_TEAM':
            handleSelectTeam(ws, playerId, event.team);
            break;
        case 'SELECT_ROLE':
            handleSelectRole(ws, playerId, event.role);
            break;
        // case 'TOGGLE_READY':
        //     handleToggleReady(ws, playerId);
        //     break;
        case 'GIVE_CLUE':
            handleGiveClue(ws, playerId, event.word, event.count);
            break;
        case 'FLIP_CARD':
            handleFlipCard(ws, playerId, event.cardIndex);
            break;
        case 'PASS_TURN':
            handlePassTurn(ws, playerId);
            break;
        case 'RECONNECT':
            handleReconnect(ws, playerId, event.roomId);
            break;
        default:
            send(ws, { type: 'ERROR', message: 'Unknown event type' });
    }
}

function handleCreateRoom(ws: WebSocket, playerId: string, playerName?: string): void {
    let roomId = generateRoomId();
    // Ensure unique
    while (gameStore.has(roomId)) {
        roomId = generateRoomId();
    }

    const state = createGameState(roomId);
    const name = playerName || generatePlayerName();

    const player: Player = {
        id: playerId,
        name,
        connected: true,
        // ready: true,
        isHost: true,
    };

    state.players.set(playerId, player);
    gameStore.create(roomId, state);

    // Update socket meta
    const meta = socketMap.get(ws);
    if (meta) meta.roomId = roomId;

    state.actionLog.push({
        type: 'join',
        playerName: name,
        message: `${name} created the room`,
        timestamp: Date.now(),
    });

    console.log(`[Room] ${name} created room ${roomId}`);

    send(ws, { type: 'ROOM_CREATED', roomId });
    broadcastGameState(roomId);
}

function handleJoinRoom(ws: WebSocket, playerId: string, roomId: string, playerName?: string): void {
    const normalizedRoomId = roomId.toUpperCase().trim();
    const state = gameStore.get(normalizedRoomId);

    if (!state) {
        send(ws, { type: 'ERROR', message: 'Room not found. Check the room code and try again.' });
        return;
    }

    const name = playerName || generatePlayerName();

    // Check if player is reconnecting
    const existingPlayer = state.players.get(playerId);
    if (existingPlayer) {
        existingPlayer.connected = true;
        existingPlayer.name = name;
    } else {
        const player: Player = {
            id: playerId,
            name,
            connected: true,
            // ready: false,
            isHost: false,
        };
        state.players.set(playerId, player);

        state.actionLog.push({
            type: 'join',
            playerName: name,
            message: `${name} joined the room`,
            timestamp: Date.now(),
        });
    }

    // Update socket meta
    const meta = socketMap.get(ws);
    if (meta) meta.roomId = normalizedRoomId;

    console.log(`[Room] ${name} joined room ${normalizedRoomId}`);
    broadcastGameState(normalizedRoomId);
}

function handleReconnect(ws: WebSocket, playerId: string, roomId: string): void {
    const normalizedRoomId = roomId.toUpperCase().trim();
    const state = gameStore.get(normalizedRoomId);

    if (!state) {
        send(ws, { type: 'ERROR', message: 'Room not found' });
        return;
    }

    const player = state.players.get(playerId);
    if (!player) {
        send(ws, { type: 'ERROR', message: 'Player not found in this room' });
        return;
    }

    player.connected = true;
    const meta = socketMap.get(ws);
    if (meta) meta.roomId = normalizedRoomId;

    console.log(`[Room] ${player.name} reconnected to ${normalizedRoomId}`);
    broadcastGameState(normalizedRoomId);
}

function handleSelectTeam(ws: WebSocket, playerId: string, team: string): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;
    if (state.phase !== 'lobby') {
        send(ws, { type: 'ERROR', message: 'Game already started' });
        return;
    }

    const player = state.players.get(playerId);
    if (!player) return;

    if (team !== 'red' && team !== 'blue') {
        send(ws, { type: 'ERROR', message: 'Invalid team' });
        return;
    }

    player.team = team;
    // player.ready = false; // Reset ready on team change
    broadcastGameState(meta.roomId);
}

function handleSelectRole(ws: WebSocket, playerId: string, role: string): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;
    if (state.phase !== 'lobby') {
        send(ws, { type: 'ERROR', message: 'Game already started' });
        return;
    }

    const player = state.players.get(playerId);
    if (!player) return;

    if (role !== 'spymaster' && role !== 'operative') {
        send(ws, { type: 'ERROR', message: 'Invalid role' });
        return;
    }

    // Only one spymaster per team
    if (role === 'spymaster' && player.team) {
        const existingSpymaster = Array.from(state.players.values()).find(
            p => p.team === player.team && p.role === 'spymaster' && p.id !== playerId
        );
        if (existingSpymaster) {
            send(ws, { type: 'ERROR', message: `${existingSpymaster.name} is already the Spymaster for ${player.team} team` });
            return;
        }
    }

    player.role = role;
    // player.ready = false; // Reset ready on role change
    broadcastGameState(meta.roomId);
}

function handleStartGame(ws: WebSocket, playerId: string): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;
    if (state.phase !== 'lobby') {
        send(ws, { type: 'ERROR', message: 'Game already started' });
        return;
    }

    const player = state.players.get(playerId);
    if (!player) return;

    if (!player.team || !player.role) {
        send(ws, { type: 'ERROR', message: 'Select a team and role before readying up' });
        return;
    }

    if (!player.isHost) {
        send(ws, { type: 'ERROR', message: 'Only the host can start the game' });
        return;
    }
    const result = startGame(state);
    if (!result.success) {
        send(ws, { type: 'ERROR', message: result.error! });
        return;
    }

    broadcastGameState(meta.roomId);

}

function handleKickPlayer(ws: WebSocket, hostId: string, playerId: string): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;

    const host = state.players.get(hostId);
    if (!host) return;

    const player = state.players.get(playerId);
    if (!player) return;

    if (!host.isHost) {
        send(ws, { type: 'ERROR', message: 'Only the host can kick players' });
        return;
    }

    if (hostId === playerId) {
        send(ws, { type: 'ERROR', message: 'Cannot kick the host' });
        return;
    }


    const kickedPlayer = state.players.get(playerId);
    if (!kickedPlayer) {
        send(ws, { type: 'ERROR', message: 'Cannot kick the host' });
        return;
    }

    state.players.delete(playerId);

    for (const [id, player] of state.players) {
        const playerWs = playerSockets.get(id);
        if (!playerWs) return;
        const noob = '';
        send(playerWs, { type: 'KICKED_PLAYER', playerName: kickedPlayer.name })
    }
    const kickedPlayerSocket = playerSockets.get(playerId);

    if (kickedPlayerSocket) {
        send(kickedPlayerSocket, { type: 'YOU_KICKED', message: 'You are Kicked from the Room' })
    }

    broadcastGameState(meta.roomId);
}
function handleMakeHost(ws: WebSocket, hostId: string, playerId: string): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;

    const host = state.players.get(hostId);
    if (!host) return;

    const player = state.players.get(playerId);
    if (!player) return;

    if (!host.isHost) {
        send(ws, { type: 'ERROR', message: 'Only the host can make other players host' });
        return;
    }

    host.isHost = false;
    player.isHost = true;
    broadcastGameState(meta.roomId);
}

// function handleToggleReady(ws: WebSocket, playerId: string): void {
//     const meta = socketMap.get(ws);
//     if (!meta?.roomId) {
//         send(ws, { type: 'ERROR', message: 'Not in a room' });
//         return;
//     }

//     const state = gameStore.get(meta.roomId);
//     if (!state) return;
//     if (state.phase !== 'lobby') {
//         send(ws, { type: 'ERROR', message: 'Game already started' });
//         return;
//     }

//     const player = state.players.get(playerId);
//     if (!player) return;

//     if (!player.team || !player.role) {
//         send(ws, { type: 'ERROR', message: 'Select a team and role before readying up' });
//         return;
//     }

//     player.ready = !player.ready;
//     broadcastGameState(meta.roomId);

//     // Check if all players are ready → auto-start
//     if (checkAllReady(state)) {
//         const result = startGame(state);
//         if (result.success) {
//             console.log(`[Game] All players ready — game started in room ${meta.roomId}`);
//             broadcastGameState(meta.roomId);
//         }
//     }
// }

function handleGiveClue(ws: WebSocket, playerId: string, word: string, count: number): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;

    const result = giveClue(state, playerId, word, count);
    if (!result.success) {
        send(ws, { type: 'ERROR', message: result.error! });
        return;
    }

    broadcastGameState(meta.roomId);
}

function handleFlipCard(ws: WebSocket, playerId: string, cardIndex: number): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;

    const result = flipCard(state, playerId, cardIndex);
    if (!result.success) {
        send(ws, { type: 'ERROR', message: result.error! });
        return;
    }

    broadcastGameState(meta.roomId);
}

function handlePassTurn(ws: WebSocket, playerId: string): void {
    const meta = socketMap.get(ws);
    if (!meta?.roomId) {
        send(ws, { type: 'ERROR', message: 'Not in a room' });
        return;
    }

    const state = gameStore.get(meta.roomId);
    if (!state) return;

    const result = passTurn(state, playerId);
    if (!result.success) {
        send(ws, { type: 'ERROR', message: result.error! });
        return;
    }

    broadcastGameState(meta.roomId);
}
