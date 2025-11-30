import type { Env } from "../types/env.js";
import type { RequestWithParams } from "../types/request.js";

/**
 * Middleware type - can return Response or void (to continue)
 */
export type Middleware = (
    req: RequestWithParams,
    env?: Env,
    ctx?: ExecutionContext,
) => Promise<Response | void> | Response | void;

/**
 * Route handler type - can return Response or void (to continue to next handler)
 */
export type Handler = (
    req: RequestWithParams,
    env?: Env,
    ctx?: ExecutionContext,
) => Promise<Response | void> | Response | void;

/**
 * Error handler type
 */
export type ErrorHandler = (
    error: Error,
    req: RequestWithParams,
    env?: Env,
    ctx?: ExecutionContext,
) => Promise<Response> | Response;

/**
 * Route definition
 */
export interface Route {
    method: string;
    path: string;
    pattern: RegExp;
    paramNames: string[];
    handlers: Handler[];
}
