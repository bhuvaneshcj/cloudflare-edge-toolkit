/// <reference types="@cloudflare/workers-types" />

/**
 * WebSocket message types
 */
export type WebSocketMessage = string | ArrayBuffer | ArrayBufferView;

/**
 * WebSocket connection handler
 */
export interface WebSocketHandler {
    onOpen?: (ws: WebSocket, request: Request) => void | Promise<void>;
    onMessage?: (
        ws: WebSocket,
        message: WebSocketMessage,
        request: Request,
    ) => void | Promise<void>;
    onClose?: (
        ws: WebSocket,
        code: number,
        reason: string,
        request: Request,
    ) => void | Promise<void>;
    onError?: (
        ws: WebSocket,
        error: Error,
        request: Request,
    ) => void | Promise<void>;
}

/**
 * WebSocket upgrade options
 */
export interface WebSocketUpgradeOptions {
    protocol?: string;
    compress?: boolean;
}

/**
 * Upgrade request to WebSocket
 */
export function upgradeWebSocket(
    request: Request,
    handler: WebSocketHandler,
    options: WebSocketUpgradeOptions = {},
): Response {
    // Check if request is a WebSocket upgrade
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // Accept the WebSocket connection
    server.accept();

    // Set up event handlers
    if (handler.onOpen) {
        try {
            handler.onOpen(server, request);
        } catch (error) {
            console.error("WebSocket onOpen error:", error);
        }
    }

    server.addEventListener("message", (event) => {
        if (handler.onMessage) {
            try {
                handler.onMessage(server, event.data, request);
            } catch (error) {
                console.error("WebSocket onMessage error:", error);
                if (handler.onError) {
                    handler.onError(
                        server,
                        error instanceof Error
                            ? error
                            : new Error(String(error)),
                        request,
                    );
                }
            }
        }
    });

    server.addEventListener("close", (event) => {
        if (handler.onClose) {
            try {
                handler.onClose(server, event.code, event.reason, request);
            } catch (error) {
                console.error("WebSocket onClose error:", error);
            }
        }
    });

    server.addEventListener("error", (event) => {
        if (handler.onError) {
            try {
                handler.onError(server, new Error("WebSocket error"), request);
            } catch (error) {
                console.error("WebSocket error handler error:", error);
            }
        }
    });

    // Return response with WebSocket
    return new Response(null, {
        status: 101,
        webSocket: client,
        headers: {
            Upgrade: "websocket",
            Connection: "Upgrade",
            ...(options.protocol && {
                "Sec-WebSocket-Protocol": options.protocol,
            }),
        },
    });
}
