import type { CookieOptions } from "../types/response.js";

/**
 * Response builder utilities
 */

/**
 * Create an HTML response
 */
export function html(content: string, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/html; charset=utf-8");
    }

    return new Response(content, {
        ...init,
        headers,
    });
}

/**
 * Create a text response
 */
export function text(content: string, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/plain; charset=utf-8");
    }

    return new Response(content, {
        ...init,
        headers,
    });
}

/**
 * Create a redirect response
 */
export function redirect(url: string, status: number = 302): Response {
    return new Response(null, {
        status,
        headers: {
            Location: url,
        },
    });
}

/**
 * Set a cookie on a response
 */
export function setCookie(
    response: Response,
    name: string,
    value: string,
    options: CookieOptions = {},
): Response {
    const cookieParts: string[] = [`${name}=${encodeURIComponent(value)}`];

    if (options.domain) {
        cookieParts.push(`Domain=${options.domain}`);
    }

    if (options.path) {
        cookieParts.push(`Path=${options.path}`);
    }

    if (options.expires) {
        cookieParts.push(`Expires=${options.expires.toUTCString()}`);
    }

    if (options.maxAge !== undefined) {
        cookieParts.push(`Max-Age=${options.maxAge}`);
    }

    if (options.httpOnly) {
        cookieParts.push("HttpOnly");
    }

    if (options.secure) {
        cookieParts.push("Secure");
    }

    if (options.sameSite) {
        cookieParts.push(`SameSite=${options.sameSite}`);
    }

    const cookieString = cookieParts.join("; ");
    const headers = new Headers(response.headers);
    const existingCookies = headers.get("Set-Cookie");

    if (existingCookies) {
        headers.set("Set-Cookie", `${existingCookies}, ${cookieString}`);
    } else {
        headers.set("Set-Cookie", cookieString);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Remove a cookie from response
 */
export function removeCookie(
    response: Response,
    name: string,
    options: Pick<CookieOptions, "domain" | "path"> = {},
): Response {
    return setCookie(response, name, "", {
        ...options,
        expires: new Date(0),
        maxAge: 0,
    });
}
