import type { Handler } from "../router/types.js";

/**
 * Logger middleware options
 */
export interface LoggerOptions {
    level?: "debug" | "info" | "warn" | "error";
    format?: "json" | "text";
    includeHeaders?: boolean;
}

/**
 * Create logger middleware
 */
export function logger(options: LoggerOptions = {}): Handler {
    const { level = "info", format = "text", includeHeaders = false } = options;

    return async (request) => {
        // Request and URL are available in Workers runtime
        // Using type assertions to avoid requiring @cloudflare/workers-types at compile time
        const req = request as unknown as {
            url: string;
            method: string;
            headers: {
                forEach: (fn: (value: string, key: string) => void) => void;
            };
        };
        const url = new (
            globalThis as { URL?: new (url: string) => { pathname: string } }
        ).URL!(req.url);

        const logData: Record<string, unknown> = {
            method: req.method,
            path: url.pathname,
            timestamp: new Date().toISOString(),
        };

        if (includeHeaders) {
            const headers: Record<string, string> = {};
            req.headers.forEach((value: string, key: string) => {
                headers[key] = value;
            });
            logData.headers = headers;
        }

        // Log request
        log(level, format, "Request", logData);

        // Wait for response (this middleware runs before handlers)
        // We can't intercept the response here, so we just log the request
        return;
    };
}

/**
 * Log a message
 */
function log(
    level: string,
    format: string,
    message: string,
    data: Record<string, unknown>,
): void {
    const logMessage =
        format === "json"
            ? JSON.stringify({ level, message, ...data })
            : `[${level.toUpperCase()}] ${message} ${JSON.stringify(data)}`;

    // Use console (available in Workers runtime)
    // @ts-expect-error - console is available in Workers runtime but not in all TypeScript environments
    const consoleObj = globalThis.console || {
        log: () => {},
        debug: () => {},
        warn: () => {},
        error: () => {},
    };

    switch (level) {
        case "debug":
            consoleObj.debug(logMessage);
            break;
        case "info":
            consoleObj.log(logMessage);
            break;
        case "warn":
            consoleObj.warn(logMessage);
            break;
        case "error":
            consoleObj.error(logMessage);
            break;
        default:
            consoleObj.log(logMessage);
    }
}

/**
 * Simple request logger (logs method and path)
 */
export function simpleLogger(): Handler {
    return async (request) => {
        // Request and URL are available in Workers runtime
        const req = request as unknown as { url: string; method: string };
        const url = new (globalThis as { URL?: new (url: string) => { pathname: string } }).URL!(req.url);
        // console is available in Workers runtime
        const consoleObj = (globalThis as { console?: { log: (msg: string) => void } }).console || { log: () => {} };
        consoleObj.log(`[${req.method}] ${url.pathname}`);
        return;
    };
}
