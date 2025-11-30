import {
    Router,
    json,
    upgradeWebSocket,
    RoomManager,
} from "cloudflare-edge-toolkit";
import type { WebSocketHandler } from "cloudflare-edge-toolkit";

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<Response> {
        const app = new Router();

        // Room manager for chat rooms
        const roomManager = new RoomManager();

        // WebSocket handler for chat
        const chatHandler: WebSocketHandler = {
            onOpen: (ws, req) => {
                console.log("WebSocket connection opened");
                // Join default room
                const room = roomManager.getRoom("general");
                room.add(ws);

                // Send welcome message
                ws.send(
                    JSON.stringify({
                        type: "system",
                        message: "Welcome to the chat!",
                    }),
                );
            },

            onMessage: (ws, message, req) => {
                try {
                    const data = JSON.parse(message as string);
                    const room = roomManager.getRoom("general");

                    if (data.type === "message") {
                        // Broadcast message to all in room
                        room.broadcast(
                            JSON.stringify({
                                type: "message",
                                user: data.user || "Anonymous",
                                message: data.message,
                                timestamp: new Date().toISOString(),
                            }),
                            ws,
                        );
                    } else if (data.type === "join") {
                        // Join a specific room
                        const targetRoom = roomManager.getRoom(
                            data.room || "general",
                        );
                        targetRoom.add(ws);
                        ws.send(
                            JSON.stringify({
                                type: "system",
                                message: `Joined room: ${data.room || "general"}`,
                            }),
                        );
                    }
                } catch (error) {
                    console.error("Error handling WebSocket message:", error);
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Invalid message format",
                        }),
                    );
                }
            },

            onClose: (ws, code, reason, req) => {
                console.log(`WebSocket closed: ${code} ${reason}`);
                // Remove from all rooms
                for (const roomName of roomManager.getRoomNames()) {
                    const room = roomManager.getRoom(roomName);
                    room.remove(ws);
                }
            },

            onError: (ws, error, req) => {
                console.error("WebSocket error:", error);
            },
        };

        // WebSocket endpoint
        app.get("/ws", (req) => {
            return upgradeWebSocket(req, chatHandler);
        });

        // Get room info (HTTP endpoint)
        app.get("/rooms", () => {
            const rooms = roomManager.getRoomNames().map((name) => ({
                name,
                connections: roomManager.getRoomSize(name),
            }));
            return json({ rooms });
        });

        // Health check
        app.get("/", () => {
            return json({
                message: "WebSocket Chat Server",
                endpoints: {
                    websocket: "/ws",
                    rooms: "/rooms",
                },
            });
        });

        // 404 handler
        app.on404(() => json({ error: "Not found" }, { status: 404 }));

        return app.handle(request, env, ctx);
    },
};

interface Env {
    // Add your environment bindings here
}
