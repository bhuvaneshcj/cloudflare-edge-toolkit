/**
 * JSON response utilities
 */

/**
 * Create a JSON response
 */
export function json(data: unknown, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return new Response(JSON.stringify(data), {
        ...init,
        headers,
    });
}

/**
 * Create an error JSON response
 */
export function jsonError(message: string, status: number = 500): Response {
    return json(
        {
            success: false,
            error: message,
        },
        { status },
    );
}

/**
 * Safely parse JSON string
 */
export function parseJSON<T = unknown>(text: string): T {
    try {
        return JSON.parse(text) as T;
    } catch (error) {
        throw new Error(
            `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}
