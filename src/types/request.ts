/**
 * Extended Request types with path and query parameters
 */
export interface RequestWithParams extends Request {
    params?: Record<string, string>;
    query?: URLSearchParams;
}

export interface ParsedRequest {
    params: Record<string, string>;
    query: URLSearchParams;
    body?: unknown;
    url: string;
    method: string;
    headers: Headers;
}
