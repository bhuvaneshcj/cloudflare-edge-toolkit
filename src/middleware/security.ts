import type { Handler } from "../router/types.js";

/**
 * Security headers middleware options
 */
export interface SecurityHeadersOptions {
    contentSecurityPolicy?: string;
    xFrameOptions?: "DENY" | "SAMEORIGIN" | string;
    xContentTypeOptions?: boolean;
    xXSSProtection?: boolean | string;
    referrerPolicy?: string;
    strictTransportSecurity?: string;
    permissionsPolicy?: string;
    crossOriginEmbedderPolicy?: string;
    crossOriginOpenerPolicy?: string;
    crossOriginResourcePolicy?: string;
}

/**
 * Create security headers middleware
 */
export function securityHeaders(
    options: SecurityHeadersOptions = {},
): Handler {
    const {
        contentSecurityPolicy,
        xFrameOptions = "DENY",
        xContentTypeOptions = true,
        xXSSProtection = "1; mode=block",
        referrerPolicy = "strict-origin-when-cross-origin",
        strictTransportSecurity,
        permissionsPolicy,
        crossOriginEmbedderPolicy,
        crossOriginOpenerPolicy,
        crossOriginResourcePolicy,
    } = options;

    return async (request) => {
        // This middleware will add headers to responses
        // We return void to continue, headers will be added by response interceptor
        // For now, we'll store the headers in a way that can be accessed later
        return;
    };
}

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(
    response: Response,
    options: SecurityHeadersOptions = {},
): Response {
    const {
        contentSecurityPolicy,
        xFrameOptions = "DENY",
        xContentTypeOptions = true,
        xXSSProtection = "1; mode=block",
        referrerPolicy = "strict-origin-when-cross-origin",
        strictTransportSecurity,
        permissionsPolicy,
        crossOriginEmbedderPolicy,
        crossOriginOpenerPolicy,
        crossOriginResourcePolicy,
    } = options;

    const headers = new Headers(response.headers);

    if (contentSecurityPolicy) {
        headers.set("Content-Security-Policy", contentSecurityPolicy);
    }

    if (xFrameOptions) {
        headers.set("X-Frame-Options", xFrameOptions);
    }

    if (xContentTypeOptions) {
        headers.set("X-Content-Type-Options", "nosniff");
    }

    if (xXSSProtection) {
        headers.set(
            "X-XSS-Protection",
            typeof xXSSProtection === "string" ? xXSSProtection : "1; mode=block",
        );
    }

    if (referrerPolicy) {
        headers.set("Referrer-Policy", referrerPolicy);
    }

    if (strictTransportSecurity) {
        headers.set("Strict-Transport-Security", strictTransportSecurity);
    }

    if (permissionsPolicy) {
        headers.set("Permissions-Policy", permissionsPolicy);
    }

    if (crossOriginEmbedderPolicy) {
        headers.set("Cross-Origin-Embedder-Policy", crossOriginEmbedderPolicy);
    }

    if (crossOriginOpenerPolicy) {
        headers.set("Cross-Origin-Opener-Policy", crossOriginOpenerPolicy);
    }

    if (crossOriginResourcePolicy) {
        headers.set("Cross-Origin-Resource-Policy", crossOriginResourcePolicy);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

