import type { Env } from "../types/env.js";
import type { RequestWithParams } from "../types/request.js";
import type { Handler, ErrorHandler, Route } from "./types.js";

/**
 * Class-based router for Cloudflare Workers
 */
export class Router {
    private routes: Route[] = [];
    private globalMiddleware: Handler[] = [];
    private notFoundHandler: Handler | null = null;
    private errorHandler: ErrorHandler | null = null;

    /**
     * Register a GET route
     */
    get(path: string, ...handlers: Handler[]): this {
        return this.addRoute("GET", path, handlers);
    }

    /**
     * Register a POST route
     */
    post(path: string, ...handlers: Handler[]): this {
        return this.addRoute("POST", path, handlers);
    }

    /**
     * Register a PUT route
     */
    put(path: string, ...handlers: Handler[]): this {
        return this.addRoute("PUT", path, handlers);
    }

    /**
     * Register a DELETE route
     */
    delete(path: string, ...handlers: Handler[]): this {
        return this.addRoute("DELETE", path, handlers);
    }

    /**
     * Register a PATCH route
     */
    patch(path: string, ...handlers: Handler[]): this {
        return this.addRoute("PATCH", path, handlers);
    }

    /**
     * Register an OPTIONS route
     */
    options(path: string, ...handlers: Handler[]): this {
        return this.addRoute("OPTIONS", path, handlers);
    }

    /**
     * Register a HEAD route
     */
    head(path: string, ...handlers: Handler[]): this {
        return this.addRoute("HEAD", path, handlers);
    }

    /**
     * Register a route for all HTTP methods
     */
    all(path: string, ...handlers: Handler[]): this {
        return this.addRoute("*", path, handlers);
    }

    /**
     * Add global middleware
     */
    use(...middleware: Handler[]): this {
        this.globalMiddleware.push(...middleware);
        return this;
    }

    /**
     * Add path-specific middleware
     */
    usePath(path: string, ...middleware: Handler[]): this {
        const { pattern, paramNames } = this.parsePath(path);
        this.routes.push({
            method: "*",
            path,
            pattern,
            paramNames,
            handlers: middleware,
        });
        return this;
    }

    /**
     * Set custom 404 handler
     */
    on404(handler: Handler): this {
        this.notFoundHandler = handler;
        return this;
    }

    /**
     * Set custom error handler
     */
    onError(handler: ErrorHandler): this {
        this.errorHandler = handler;
        return this;
    }

    /**
     * Handle incoming request
     */
    async handle(
        request: Request,
        env?: Env,
        ctx?: ExecutionContext,
    ): Promise<Response> {
        try {
            const url = new URL(request.url);
            const method = request.method;
            const pathname = url.pathname;

            // Find matching route
            const route = this.findRoute(method, pathname);

            if (!route) {
                return await this.handleNotFound(request, env, ctx);
            }

            // Extract path parameters
            const params = this.extractParams(route, pathname);
            const reqWithParams = request as RequestWithParams;
            reqWithParams.params = params;
            reqWithParams.query = url.searchParams;

            // Execute global middleware
            for (const middleware of this.globalMiddleware) {
                const response = await middleware(reqWithParams, env, ctx);
                if (response) {
                    return response;
                }
            }

            // Execute route handlers
            for (const handler of route.handlers) {
                const response = await handler(reqWithParams, env, ctx);
                if (response) {
                    return response;
                }
            }

            // If no handler returned a response, return 404
            return await this.handleNotFound(request, env, ctx);
        } catch (error) {
            return this.handleError(
                error instanceof Error ? error : new Error(String(error)),
                request,
                env,
                ctx,
            );
        }
    }

    /**
     * Add a route
     */
    private addRoute(method: string, path: string, handlers: Handler[]): this {
        const { pattern, paramNames } = this.parsePath(path);
        this.routes.push({
            method,
            path,
            pattern,
            paramNames,
            handlers,
        });
        return this;
    }

    /**
     * Parse path pattern and create regex
     */
    private parsePath(path: string): {
        pattern: RegExp;
        paramNames: string[];
    } {
        const paramNames: string[] = [];
        const patternString = path
            .replace(/:([^/]+)/g, (_, paramName) => {
                paramNames.push(paramName);
                return "([^/]+)";
            })
            .replace(/\*/g, ".*");

        const pattern = new RegExp(`^${patternString}$`);
        return { pattern, paramNames };
    }

    /**
     * Find matching route
     */
    private findRoute(method: string, pathname: string): Route | null {
        for (const route of this.routes) {
            if (
                (route.method === method || route.method === "*") &&
                route.pattern.test(pathname)
            ) {
                return route;
            }
        }
        return null;
    }

    /**
     * Extract path parameters
     */
    private extractParams(
        route: Route,
        pathname: string,
    ): Record<string, string> {
        const match = pathname.match(route.pattern);
        if (!match) {
            return {};
        }

        const params: Record<string, string> = {};
        for (let i = 0; i < route.paramNames.length; i++) {
            params[route.paramNames[i]] = match[i + 1] || "";
        }
        return params;
    }

    /**
     * Handle 404 Not Found
     */
    private async handleNotFound(
        request: Request,
        env?: Env,
        ctx?: ExecutionContext,
    ): Promise<Response> {
        if (this.notFoundHandler) {
            const reqWithParams = request as RequestWithParams;
            reqWithParams.params = {};
            reqWithParams.query = new URL(request.url).searchParams;
            const result = await this.notFoundHandler(reqWithParams, env, ctx);
            if (result) {
                return result;
            }
        }

        return new Response("Not Found", { status: 404 });
    }

    /**
     * Handle errors
     */
    private async handleError(
        error: Error,
        request: Request,
        env?: Env,
        ctx?: ExecutionContext,
    ): Promise<Response> {
        if (this.errorHandler) {
            const reqWithParams = request as RequestWithParams;
            reqWithParams.params = {};
            reqWithParams.query = new URL(request.url).searchParams;
            const result = await this.errorHandler(
                error,
                reqWithParams,
                env,
                ctx,
            );
            if (result) {
                return result;
            }
        }

        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
