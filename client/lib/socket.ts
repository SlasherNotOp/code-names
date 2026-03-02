// ============================
// CipherGrid — WebSocket Client
// ============================

type EventHandler = (data: any) => void;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

class SocketClient {
    private ws: WebSocket | null = null;
    private handlers: Map<string, EventHandler[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private token: string = '';
    private isConnecting = false;

    /**
     * Connect to the WebSocket server
     */
    connect(token: string): Promise<void> {
        this.token = token;

        return new Promise((resolve, reject) => {
            if (this.isConnecting) return resolve();
            this.isConnecting = true;

            try {
                this.ws = new WebSocket(`${WS_URL}?token=${token}`);

                this.ws.onopen = () => {
                    console.log('[WS] Connected');
                    this.reconnectAttempts = 0;
                    this.isConnecting = false;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.emit(data.type, data);
                    } catch (err) {
                        console.error('[WS] Failed to parse message:', err);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('[WS] Disconnected:', event.code, event.reason);
                    this.isConnecting = false;
                    this.attemptReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('[WS] Error:', error);
                    this.isConnecting = false;
                    reject(error);
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Disconnect from the server
     */
    disconnect(): void {
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Send an event to the server
     */
    send(event: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(event));
        } else {
            console.warn('[WS] Cannot send - not connected');
        }
    }

    /**
     * Register an event handler
     */
    on(eventType: string, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
    }

    /**
     * Remove an event handler
     */
    off(eventType: string, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) handlers.splice(index, 1);
        }
    }

    /**
     * Remove all handlers for an event type
     */
    offAll(eventType?: string): void {
        if (eventType) {
            this.handlers.delete(eventType);
        } else {
            this.handlers.clear();
        }
    }

    /**
     * Emit an event to all registered handlers
     */
    private emit(eventType: string, data: any): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
        // Also emit to wildcard handlers
        const wildcardHandlers = this.handlers.get('*');
        if (wildcardHandlers) {
            wildcardHandlers.forEach(handler => handler(data));
        }
    }

    /**
     * Attempt to reconnect
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[WS] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            if (this.token) {
                this.connect(this.token).catch(() => { });
            }
        }, delay);
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
export const socketClient = new SocketClient();
