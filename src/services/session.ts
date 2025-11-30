/// <reference types="@cloudflare/workers-types" />

import { getCookie } from "../utils/request.js";
import { getKV, setKV, deleteKV } from "./kv.js";

/**
 * Session data type
 */
export interface SessionData {
    [key: string]: unknown;
}

/**
 * Session options
 */
export interface SessionOptions {
    kv: KVNamespace;
    secret: string;
    cookieName?: string;
    maxAge?: number; // in seconds
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    path?: string;
}

/**
 * Session class
 */
export class Session {
    private data: SessionData = {};
    private sessionId: string;
    private isModified: boolean = false;

    constructor(
        private options: SessionOptions,
        sessionId?: string,
    ) {
        this.sessionId = sessionId || this.generateSessionId();
    }

    /**
     * Get session ID
     */
    getId(): string {
        return this.sessionId;
    }

    /**
     * Get value from session
     */
    get<T = unknown>(key: string): T | undefined {
        return this.data[key] as T | undefined;
    }

    /**
     * Set value in session
     */
    set(key: string, value: unknown): void {
        this.data[key] = value;
        this.isModified = true;
    }

    /**
     * Delete value from session
     */
    delete(key: string): void {
        delete this.data[key];
        this.isModified = true;
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        return key in this.data;
    }

    /**
     * Get all session data
     */
    getAll(): SessionData {
        return { ...this.data };
    }

    /**
     * Clear all session data
     */
    clear(): void {
        this.data = {};
        this.isModified = true;
    }

    /**
     * Load session from KV
     */
    async load(): Promise<void> {
        try {
            const stored = await getKV<SessionData>(
                this.options.kv,
                `session:${this.sessionId}`,
            );
            if (stored) {
                this.data = stored;
            }
        } catch (error) {
            console.error("Failed to load session:", error);
            this.data = {};
        }
    }

    /**
     * Save session to KV
     */
    async save(): Promise<void> {
        if (!this.isModified) {
            return;
        }

        try {
            const maxAge = this.options.maxAge || 3600; // Default 1 hour
            await setKV(
                this.options.kv,
                `session:${this.sessionId}`,
                this.data,
                { expirationTtl: maxAge },
            );
            this.isModified = false;
        } catch (error) {
            console.error("Failed to save session:", error);
        }
    }

    /**
     * Destroy session
     */
    async destroy(): Promise<void> {
        try {
            await deleteKV(this.options.kv, `session:${this.sessionId}`);
            this.data = {};
            this.isModified = false;
        } catch (error) {
            console.error("Failed to destroy session:", error);
        }
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        // Generate a random session ID
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (byte) =>
            byte.toString(16).padStart(2, "0"),
        ).join("");
    }

    /**
     * Get cookie options for session
     */
    getCookieOptions(): {
        name: string;
        value: string;
        maxAge: number;
        httpOnly: boolean;
        secure: boolean;
        sameSite: "Strict" | "Lax" | "None";
        path: string;
    } {
        return {
            name: this.options.cookieName || "session",
            value: this.sessionId,
            maxAge: this.options.maxAge || 3600,
            httpOnly: this.options.httpOnly !== false,
            secure: this.options.secure !== false,
            sameSite: this.options.sameSite || "Lax",
            path: this.options.path || "/",
        };
    }
}

/**
 * Create a new session
 */
export function createSession(
    options: SessionOptions,
    sessionId?: string,
): Session {
    return new Session(options, sessionId);
}

/**
 * Get session from request
 */
export async function getSession(
    request: Request,
    options: SessionOptions,
): Promise<Session> {
    const cookieName = options.cookieName || "session";
    const sessionId = getCookie(request, cookieName);
    const session = new Session(options, sessionId || undefined);
    await session.load();
    return session;
}
