import { json } from "./json.js";

/**
 * Base HTTP error class
 */
export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = "HttpError";
    }

    /**
     * Convert error to Response
     */
    toResponse(): Response {
        return json(
            {
                success: false,
                error: this.message,
                details: this.details,
            },
            { status: this.status },
        );
    }
}

/**
 * 400 Bad Request error
 */
export class BadRequestError extends HttpError {
    constructor(message: string = "Bad Request", details?: unknown) {
        super(400, message, details);
        this.name = "BadRequestError";
    }
}

/**
 * 401 Unauthorized error
 */
export class UnauthorizedError extends HttpError {
    constructor(message: string = "Unauthorized", details?: unknown) {
        super(401, message, details);
        this.name = "UnauthorizedError";
    }
}

/**
 * 403 Forbidden error
 */
export class ForbiddenError extends HttpError {
    constructor(message: string = "Forbidden", details?: unknown) {
        super(403, message, details);
        this.name = "ForbiddenError";
    }
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends HttpError {
    constructor(message: string = "Not Found", details?: unknown) {
        super(404, message, details);
        this.name = "NotFoundError";
    }
}

/**
 * 422 Validation error
 */
export class ValidationError extends HttpError {
    constructor(
        message: string = "Validation Error",
        public fields?: Record<string, string[]>,
    ) {
        super(422, message, fields);
        this.name = "ValidationError";
    }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends HttpError {
    constructor(message: string = "Internal Server Error", details?: unknown) {
        super(500, message, details);
        this.name = "InternalServerError";
    }
}

/**
 * Convert any error to Response
 */
export function errorToResponse(
    error: unknown,
    includeStack: boolean = false,
): Response {
    if (error instanceof HttpError) {
        return error.toResponse();
    }

    const message =
        error instanceof Error ? error.message : "Internal Server Error";
    const stack =
        includeStack && error instanceof Error ? error.stack : undefined;

    return json(
        {
            success: false,
            error: message,
            ...(stack && { stack }),
        },
        { status: 500 },
    );
}
