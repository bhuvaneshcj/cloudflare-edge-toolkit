/**
 * Extended Request types with path and query parameters
 */
export interface RequestWithParams extends Request {
    params?: Record<string, string>;
    query?: URLSearchParams;
}

export interface ParsedRequest extends Request {
    params: Record<string, string>;
    query: URLSearchParams;
    body?: unknown;
}
