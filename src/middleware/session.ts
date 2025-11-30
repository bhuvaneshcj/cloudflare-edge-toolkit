import type { Handler } from "../router/types.js";
import type { RequestWithParams } from "../types/request.js";
import { getSession, Session } from "../services/session.js";
import type { SessionOptions } from "../services/session.js";
import { setCookie } from "../utils/response.js";

/**
 * Session middleware
 */
export function session(options: SessionOptions): Handler {
    return async (request, env) => {
        const session = await getSession(request, options);

        // Attach session to request
        const req = request as RequestWithParams & { session?: Session };
        req.session = session;

        // Continue to next handler
        return;
    };
}

/**
 * Add session cookie to response
 */
export function attachSessionCookie(
    response: Response,
    session: Session,
): Response {
    const cookieOptions = session.getCookieOptions();
    return setCookie(
        response,
        cookieOptions.name,
        cookieOptions.value,
        {
            maxAge: cookieOptions.maxAge,
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
            path: cookieOptions.path,
        },
    );
}

/**
 * Flash messages support
 */
export interface FlashMessages {
    get(key: string): unknown | undefined;
    set(key: string, value: unknown): void;
    has(key: string): boolean;
    all(): Record<string, unknown>;
    clear(): void;
}

/**
 * Create flash messages helper
 */
export function createFlash(session: Session): FlashMessages {
    return {
        get(key: string): unknown | undefined {
            const flash = session.get<Record<string, unknown>>("_flash");
            return flash?.[key];
        },
        set(key: string, value: unknown): void {
            const flash = session.get<Record<string, unknown>>("_flash") || {};
            flash[key] = value;
            session.set("_flash", flash);
        },
        has(key: string): boolean {
            const flash = session.get<Record<string, unknown>>("_flash");
            return key in (flash || {});
        },
        all(): Record<string, unknown> {
            return session.get<Record<string, unknown>>("_flash") || {};
        },
        clear(): void {
            session.delete("_flash");
        },
    };
}

