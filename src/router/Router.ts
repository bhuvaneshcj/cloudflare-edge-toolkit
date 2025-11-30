import type { Env } from "../types/env.js";
import type { RequestWithParams } from "../types/request.js";
import type { Handler, ErrorHandler, Route } from "./types.js";

/**
 * Route group for organizing routes with a common prefix
 */
export class RouteGroup {
    constructor(
        private router: Router,
        private prefix: string,
        private groupMiddleware: Handler[] = [],
    ) {}

    /**
     * Register a GET route in this group
     */
    get(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("GET", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Register a POST route in this group
     */
    post(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("POST", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Register a PUT route in this group
     */
    put(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("PUT", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Register a DELETE route in this group
     */
    delete(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("DELETE", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Register a PATCH route in this group
     */
    patch(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("PATCH", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Register an OPTIONS route in this group
     */
    options(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("OPTIONS", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Register a HEAD route in this group
     */
    head(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("HEAD", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Register a route for all HTTP methods in this group
     */
    all(path: string, ...handlers: Handler[]): this {
        this.router.addRoute("*", this.prefix + path, [
            ...this.groupMiddleware,
            ...handlers,
        ]);
        return this;
    }

    /**
     * Add middleware to this group
     */
    use(...middleware: Handler[]): this {
        this.groupMiddleware.push(...middleware);
        return this;
    }

    /**
     * Create a nested route group
     */
    group(prefix: string, ...middleware: Handler[]): RouteGroup {
        return new RouteGroup(this.router, this.prefix + prefix, [
            ...this.groupMiddleware,
            ...middleware,
        ]);
    }
}

/**
 * Class-based router for Cloudflare Workers
 */
export class Router {
    private routes: Route[] = [];
    private globalMiddleware: Handler[] = [];
    private notFoundHandler: Handler | null = null;
    private errorHandler: ErrorHandler | null = null;

    /**
     * Add a route (internal method, made public for RouteGroup)
     */
    addRoute(method: string, path: string, handlers: Handler[]): this {
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
     * Register a WebSocket route
     * Note: WebSocket routes should use upgradeWebSocket function directly
     * This method is for documentation/type purposes
     */
    ws(
        path: string,
        handler: (
            ws: WebSocket,
            request: RequestWithParams,
            env?: Env,
            ctx?: ExecutionContext,
        ) => void | Promise<void>,
    ): this {
        // Store WebSocket handler for this path
        // WebSocket upgrade must be handled manually using upgradeWebSocket
        return this;
    }

    /**
     * Register a route for all HTTP methods
     */
    all(path: string, ...handlers: Handler[]): this {
        return this.addRoute("*", path, handlers);
    }

    /**
     * Add global middleware or mount a sub-router
     */
    use(...args: Handler[]): this;
    use(path: string, router: Router): this;
    use(...args: Handler[] | [string, Router]): this {
        if (
            args.length === 2 &&
            typeof args[0] === "string" &&
            args[1] instanceof Router
        ) {
            // Mount sub-router
            const path = args[0];
            const router = args[1];
            for (const route of router.routes) {
                const prefixedPath = path + route.path;
                this.addRoute(route.method, prefixedPath, route.handlers);
            }
            return this;
        }
        // Add global middleware
        this.globalMiddleware.push(...(args as Handler[]));
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
     * Create a route group with a common prefix
     */
    group(prefix: string, ...middleware: Handler[]): RouteGroup {
        return new RouteGroup(this, prefix, middleware);
    }

    /**
     * Parse path pattern and create regex
     * Supports :param and regex constraints like :id(\\d+)
     */
    private parsePath(path: string): {
        pattern: RegExp;
        paramNames: string[];
    } {
        const paramNames: string[] = [];
        let patternString = path;

        // Handle regex constraints: :param(regex)
        patternString = patternString.replace(
            /:(\w+)\(([^)]+)\)/g,
            (_, paramName, regex) => {
                paramNames.push(paramName);
                return `(${regex})`;
            },
        );

        // Handle simple params: :param
        patternString = patternString.replace(/:(\w+)/g, (_, paramName) => {
            if (!paramNames.includes(paramName)) {
                paramNames.push(paramName);
            }
            return "([^/]+)";
        });

        // Handle wildcards
        patternString = patternString.replace(/\*/g, ".*");

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
