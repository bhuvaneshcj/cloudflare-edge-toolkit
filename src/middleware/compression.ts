import type { Handler } from "../router/types.js";

/**
 * Compression middleware options
 */
export interface CompressionOptions {
    threshold?: number; // Minimum response size to compress (bytes)
    level?: number; // Compression level (1-9)
    filter?: (request: Request, response: Response) => boolean;
}

/**
 * Create compression middleware
 * Note: Cloudflare Workers automatically compress responses, but this middleware
 * can be used to add compression headers or handle compression logic
 */
export function compression(options: CompressionOptions = {}): Handler {
    const { threshold = 1024, filter } = options;

    return async (request) => {
        // Compression is handled by Cloudflare automatically
        // This middleware can be used to add compression headers
        // or to conditionally enable compression based on request
        return;
    };
}

/**
 * Add compression headers to response
 */
export function addCompressionHeaders(
    response: Response,
    options: CompressionOptions = {},
): Response {
    const headers = new Headers(response.headers);

    // Cloudflare handles compression automatically, but we can add headers
    const contentType = response.headers.get("Content-Type") || "";

    // Only compress text-based content
    if (
        contentType.includes("text/") ||
        contentType.includes("application/json") ||
        contentType.includes("application/javascript") ||
        contentType.includes("application/xml")
    ) {
        // Cloudflare will handle compression, but we indicate support
        if (!headers.has("Content-Encoding")) {
            // Let Cloudflare handle it
        }
    }

    return response;
}
