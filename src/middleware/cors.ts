import type { Handler } from "../router/types.js";

/**
 * CORS middleware options
 */
export interface CORSOptions {
    origin?:
        | string
        | string[]
        | ((origin: string | null) => string | null | boolean);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}

/**
 * Create CORS middleware
 */
export function cors(options: CORSOptions = {}): Handler {
    const {
        origin = "*",
        methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
        allowedHeaders = ["Content-Type", "Authorization"],
        exposedHeaders = [],
        credentials = false,
        maxAge = 86400,
    } = options;

    return async (request) => {
        const requestOrigin = request.headers.get("Origin");

        // Handle preflight requests
        if (request.method === "OPTIONS") {
            const headers = new Headers();

            // Set origin
            const allowedOrigin = getOrigin(origin, requestOrigin);
            if (allowedOrigin) {
                headers.set("Access-Control-Allow-Origin", allowedOrigin);
            }

            // Set credentials
            if (credentials && allowedOrigin && allowedOrigin !== "*") {
                headers.set("Access-Control-Allow-Credentials", "true");
            }

            // Set methods
            headers.set("Access-Control-Allow-Methods", methods.join(", "));

            // Set allowed headers
            const requestedHeaders = request.headers.get(
                "Access-Control-Request-Headers",
            );
            if (requestedHeaders) {
                headers.set("Access-Control-Allow-Headers", requestedHeaders);
            } else {
                headers.set(
                    "Access-Control-Allow-Headers",
                    allowedHeaders.join(", "),
                );
            }

            // Set exposed headers
            if (exposedHeaders.length > 0) {
                headers.set(
                    "Access-Control-Expose-Headers",
                    exposedHeaders.join(", "),
                );
            }

            // Set max age
            headers.set("Access-Control-Max-Age", String(maxAge));

            return new Response(null, { status: 204, headers });
        }

        // For non-preflight requests, add CORS headers to response
        // This is handled by modifying the response in the handler
        // We'll return void to continue, and the actual CORS headers
        // should be added by the response handler
        return;
    };
}

/**
 * Get allowed origin
 */
function getOrigin(
    origin:
        | string
        | string[]
        | ((origin: string | null) => string | null | boolean),
    requestOrigin: string | null,
): string | null {
    if (typeof origin === "string") {
        return origin;
    }

    if (Array.isArray(origin)) {
        return requestOrigin && origin.includes(requestOrigin)
            ? requestOrigin
            : null;
    }

    if (typeof origin === "function") {
        const result = origin(requestOrigin);
        if (result === true) {
            return requestOrigin;
        }
        if (typeof result === "string") {
            return result;
        }
        return null;
    }

    return "*";
}

/**
 * Add CORS headers to response
 */
export function addCORSHeaders(
    response: Response,
    options: CORSOptions = {},
): Response {
    const { origin = "*", exposedHeaders = [], credentials = false } = options;

    const requestOrigin = null; // We don't have access to request here
    const allowedOrigin = getOrigin(origin, requestOrigin);

    const headers = new Headers(response.headers);

    if (allowedOrigin) {
        headers.set("Access-Control-Allow-Origin", allowedOrigin);
    }

    if (credentials && allowedOrigin && allowedOrigin !== "*") {
        headers.set("Access-Control-Allow-Credentials", "true");
    }

    if (exposedHeaders.length > 0) {
        headers.set("Access-Control-Expose-Headers", exposedHeaders.join(", "));
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
