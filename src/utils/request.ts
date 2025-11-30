import type { RequestWithParams } from "../types/request.js";

/**
 * Request parsing utilities
 */

/**
 * Parse request body (JSON, form-data, or text)
 */
export async function parseBody<T = unknown>(request: Request): Promise<T> {
    const contentType = request.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
        const text = await request.text();
        return JSON.parse(text) as T;
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        const data: Record<string, unknown> = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data as T;
    }

    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        return formData as unknown as T;
    }

    const text = await request.text();
    return text as unknown as T;
}

/**
 * Get query parameters from request
 */
export function getQueryParams(request: Request): URLSearchParams {
    const url = new URL(request.url);
    return url.searchParams;
}

/**
 * Get path parameters from request (requires RequestWithParams)
 */
export function getPathParams(request: Request): Record<string, string> {
    const req = request as RequestWithParams;
    return req.params || {};
}

/**
 * Get request headers
 */
export function getHeaders(request: Request): Headers {
    return request.headers;
}

/**
 * Get a specific header value
 */
export function getHeader(request: Request, name: string): string | null {
    return request.headers.get(name);
}

/**
 * Get cookie value from request
 */
export function getCookie(request: Request, name: string): string | null {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(value);
        }
    }

    return null;
}

/**
 * Get all cookies from request
 */
export function getCookies(request: Request): Record<string, string> {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) {
        return {};
    }

    const cookies: Record<string, string> = {};
    const cookiePairs = cookieHeader.split(";").map((c) => c.trim());

    for (const cookie of cookiePairs) {
        const [key, value] = cookie.split("=");
        if (key && value) {
            cookies[key] = decodeURIComponent(value);
        }
    }

    return cookies;
}
