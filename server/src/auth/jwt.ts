// ============================
// CipherGrid — Anonymous JWT Auth
// ============================
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const SECRET = process.env.JWT_SECRET || 'ciphergrid-secret-key-change-in-production';

interface TokenPayload {
    playerId: string;
}

export function generatePlayerId(): string {
    return uuidv4();
}

export function signToken(playerId: string): string {
    return jwt.sign({ playerId } as TokenPayload, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, SECRET) as TokenPayload;
        return decoded.playerId;
    } catch {
        return null;
    }
}
