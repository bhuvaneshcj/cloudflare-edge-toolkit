/// <reference types="@cloudflare/workers-types" />

/**
 * WebSocket room for managing multiple connections
 */
export class WebSocketRoom {
    private connections: Set<WebSocket> = new Set();

    /**
     * Add connection to room
     */
    add(ws: WebSocket): void {
        this.connections.add(ws);
    }

    /**
     * Remove connection from room
     */
    remove(ws: WebSocket): void {
        this.connections.delete(ws);
    }

    /**
     * Broadcast message to all connections in room
     */
    broadcast(
        message: string | ArrayBuffer | ArrayBufferView,
        exclude?: WebSocket,
    ): void {
        for (const ws of this.connections) {
            if (ws === exclude) {
                continue;
            }
            if (ws.readyState === WebSocket.READY_STATE_OPEN) {
                try {
                    ws.send(message);
                } catch (error) {
                    console.error(
                        "Failed to send message to WebSocket:",
                        error,
                    );
                    this.connections.delete(ws);
                }
            } else {
                // Remove closed connections
                this.connections.delete(ws);
            }
        }
    }

    /**
     * Get number of connections
     */
    size(): number {
        return this.connections.size;
    }

    /**
     * Check if room is empty
     */
    isEmpty(): boolean {
        return this.connections.size === 0;
    }

    /**
     * Close all connections
     */
    closeAll(code: number = 1000, reason: string = "Room closed"): void {
        for (const ws of this.connections) {
            if (ws.readyState === WebSocket.READY_STATE_OPEN) {
                try {
                    ws.close(code, reason);
                } catch (error) {
                    console.error("Failed to close WebSocket:", error);
                }
            }
        }
        this.connections.clear();
    }
}

/**
 * Room manager for multiple rooms
 */
export class RoomManager {
    private rooms: Map<string, WebSocketRoom> = new Map();

    /**
     * Get or create a room
     */
    getRoom(name: string): WebSocketRoom {
        if (!this.rooms.has(name)) {
            this.rooms.set(name, new WebSocketRoom());
        }
        return this.rooms.get(name)!;
    }

    /**
     * Remove a room
     */
    removeRoom(name: string): void {
        const room = this.rooms.get(name);
        if (room) {
            room.closeAll();
            this.rooms.delete(name);
        }
    }

    /**
     * Broadcast to a specific room
     */
    broadcastToRoom(
        roomName: string,
        message: string | ArrayBuffer | ArrayBufferView,
        exclude?: WebSocket,
    ): void {
        const room = this.rooms.get(roomName);
        if (room) {
            room.broadcast(message, exclude);
        }
    }

    /**
     * Broadcast to all rooms
     */
    broadcastAll(
        message: string | ArrayBuffer | ArrayBufferView,
        exclude?: WebSocket,
    ): void {
        for (const room of this.rooms.values()) {
            room.broadcast(message, exclude);
        }
    }

    /**
     * Get all room names
     */
    getRoomNames(): string[] {
        return Array.from(this.rooms.keys());
    }

    /**
     * Get room size
     */
    getRoomSize(roomName: string): number {
        const room = this.rooms.get(roomName);
        return room ? room.size() : 0;
    }
}
