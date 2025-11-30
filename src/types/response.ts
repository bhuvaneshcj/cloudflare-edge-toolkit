/**
 * Response type definitions
 */
export interface CookieOptions {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: "Strict" | "Lax" | "None";
    secure?: boolean;
}

export interface JSONResponse<T = unknown> {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
}
