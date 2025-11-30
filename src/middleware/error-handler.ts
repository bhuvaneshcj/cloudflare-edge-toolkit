import type { ErrorHandler } from "../router/types.js";
import { errorToResponse } from "../utils/errors.js";

/**
 * Error handler middleware options
 */
export interface ErrorHandlerOptions {
    includeStack?: boolean;
    logErrors?: boolean;
}

/**
 * Create error handler middleware
 */
export function errorHandler(options: ErrorHandlerOptions = {}): ErrorHandler {
    const { includeStack = false, logErrors = true } = options;

    return async (error, request, env, ctx) => {
        if (logErrors) {
            console.error("Error handling request:", {
                error: error.message,
                stack: error.stack,
                method: request.method,
                url: request.url,
            });
        }

        return errorToResponse(error, includeStack);
    };
}
