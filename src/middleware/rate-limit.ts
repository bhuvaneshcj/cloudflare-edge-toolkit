import type { Handler } from "../router/types.js";
import { UnauthorizedError } from "../utils/errors.js";
import { json } from "../utils/json.js";

/**
 * Rate limit middleware options
 */
export interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    max: number; // Maximum number of requests per window
    keyGenerator?: (request: Request) => string | Promise<string>;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}

/**
 * In-memory rate limit store (for single worker instance)
 */
class MemoryStore {
    private store: Map<string, { count: number; resetTime: number }> =
        new Map();

    get(key: string): { count: number; resetTime: number } | undefined {
        const entry = this.store.get(key);
        if (entry && entry.resetTime < Date.now()) {
            this.store.delete(key);
            return undefined;
        }
        return entry;
    }

    set(key: string, count: number, resetTime: number): void {
        this.store.set(key, { count, resetTime });
    }

    increment(
        key: string,
        windowMs: number,
    ): { count: number; resetTime: number } {
        const entry = this.get(key);
        const now = Date.now();
        const resetTime = now + windowMs;

        if (!entry) {
            this.set(key, 1, resetTime);
            return { count: 1, resetTime };
        }

        const newCount = entry.count + 1;
        this.set(key, newCount, entry.resetTime);
        return { count: newCount, resetTime: entry.resetTime };
    }
}

const defaultStore = new MemoryStore();

/**
 * Create rate limit middleware
 */
export function rateLimit(options: RateLimitOptions): Handler {
    const {
        windowMs,
        max,
        keyGenerator = (request) => {
            // Default: use IP address
            const cfConnectingIp = request.headers.get("CF-Connecting-IP");
            return cfConnectingIp || "unknown";
        },
        message = "Too many requests, please try again later.",
        standardHeaders = true,
        legacyHeaders = true,
    } = options;

    return async (request) => {
        const key = await keyGenerator(request);
        const result = defaultStore.increment(key, windowMs);

        const headers = new Headers();

        if (standardHeaders) {
            headers.set("RateLimit-Limit", String(max));
            headers.set(
                "RateLimit-Remaining",
                String(Math.max(0, max - result.count)),
            );
            headers.set(
                "RateLimit-Reset",
                String(Math.ceil(result.resetTime / 1000)),
            );
        }

        if (legacyHeaders) {
            headers.set("X-RateLimit-Limit", String(max));
            headers.set(
                "X-RateLimit-Remaining",
                String(Math.max(0, max - result.count)),
            );
            headers.set(
                "X-RateLimit-Reset",
                String(Math.ceil(result.resetTime / 1000)),
            );
        }

        if (result.count > max) {
            return json(
                { error: message },
                {
                    status: 429,
                    headers,
                },
            );
        }

        // Store headers in request for later use (if needed)
        // Note: We can't modify request headers, so this is just for reference
        return;
    };
}

/**
 * Create rate limit middleware with KV storage (for distributed rate limiting)
 * Note: This requires a KV namespace to be passed
 */
export function rateLimitKV(
    options: RateLimitOptions & { kv: KVNamespace; prefix?: string },
): Handler {
    const {
        windowMs,
        max,
        kv,
        prefix = "ratelimit:",
        keyGenerator = (request) => {
            const cfConnectingIp = request.headers.get("CF-Connecting-IP");
            return cfConnectingIp || "unknown";
        },
        message = "Too many requests, please try again later.",
        standardHeaders = true,
        legacyHeaders = true,
    } = options;

    return async (request) => {
        const key = await keyGenerator(request);
        const kvKey = `${prefix}${key}`;

        // Get current count
        const stored = await kv.get(kvKey);
        const now = Date.now();
        const resetTime = now + windowMs;

        let count = 1;
        if (stored) {
            const data = JSON.parse(stored) as {
                count: number;
                resetTime: number;
            };
            if (data.resetTime > now) {
                count = data.count + 1;
            }
        }

        // Store updated count
        await kv.put(kvKey, JSON.stringify({ count, resetTime }), {
            expirationTtl: Math.ceil(windowMs / 1000),
        });

        const headers = new Headers();

        if (standardHeaders) {
            headers.set("RateLimit-Limit", String(max));
            headers.set(
                "RateLimit-Remaining",
                String(Math.max(0, max - count)),
            );
            headers.set("RateLimit-Reset", String(Math.ceil(resetTime / 1000)));
        }

        if (legacyHeaders) {
            headers.set("X-RateLimit-Limit", String(max));
            headers.set(
                "X-RateLimit-Remaining",
                String(Math.max(0, max - count)),
            );
            headers.set(
                "X-RateLimit-Reset",
                String(Math.ceil(resetTime / 1000)),
            );
        }

        if (count > max) {
            return json(
                { error: message },
                {
                    status: 429,
                    headers,
                },
            );
        }

        return;
    };
}
