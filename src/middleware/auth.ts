import type { Handler } from "../router/types.js";
import { UnauthorizedError } from "../utils/errors.js";
import { verifyJWT } from "../services/auth.js";
import { getHeader, getCookie } from "../utils/request.js";
import type { RequestWithParams } from "../types/request.js";

/**
 * Auth middleware options
 */
export interface AuthOptions {
    secret: string;
    tokenSource?: "header" | "cookie" | "both";
    headerName?: string;
    cookieName?: string;
    algorithms?: string[];
    optional?: boolean;
    onSuccess?: (
        payload: unknown,
        request: RequestWithParams,
    ) => void | Promise<void>;
}

/**
 * Create authentication middleware
 */
export function auth(options: AuthOptions): Handler {
    const {
        secret,
        tokenSource = "header",
        headerName = "Authorization",
        cookieName = "token",
        algorithms = ["HS256"],
        optional = false,
        onSuccess,
    } = options;

    return async (request) => {
        let token: string | null = null;

        // Extract token from header or cookie
        if (tokenSource === "header" || tokenSource === "both") {
            const authHeader = getHeader(request, headerName);
            if (authHeader) {
                // Support "Bearer <token>" format
                const parts = authHeader.split(" ");
                token = parts.length > 1 ? parts[1] : parts[0];
            }
        }

        if ((!token && tokenSource === "cookie") || tokenSource === "both") {
            token = getCookie(request, cookieName);
        }

        // If optional and no token, continue
        if (optional && !token) {
            return;
        }

        // If required and no token, return error
        if (!token) {
            throw new UnauthorizedError("Authentication required");
        }

        try {
            // Verify JWT token
            const { payload } = await verifyJWT(token, secret, { algorithms });

            // Call onSuccess callback if provided
            if (onSuccess) {
                await onSuccess(payload, request as RequestWithParams);
            }

            // Store payload in request for later use
            (request as RequestWithParams & { user?: unknown }).user = payload;

            return;
        } catch (error) {
            if (optional) {
                return;
            }
            throw new UnauthorizedError(
                `Invalid token: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    };
}

/**
 * Create role-based access control middleware
 */
export function requireRole(...roles: string[]): Handler {
    return async (request) => {
        const req = request as RequestWithParams & { user?: { role?: string } };
        const user = req.user;

        if (!user || typeof user !== "object") {
            throw new UnauthorizedError("Authentication required");
        }

        const userRole = (user as { role?: string }).role;
        if (!userRole || !roles.includes(userRole)) {
            throw new UnauthorizedError("Insufficient permissions");
        }

        return;
    };
}
