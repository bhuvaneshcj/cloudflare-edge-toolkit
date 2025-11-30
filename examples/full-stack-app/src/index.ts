import {
    Router,
    json,
    jsonError,
    getKV,
    setKV,
    deleteKV,
    putR2,
    getR2,
    deleteR2,
    cors,
    logger,
    errorHandler,
    auth,
    UnauthorizedError,
    NotFoundError,
    BadRequestError,
} from "cloudflare-edge-toolkit";
import type { RequestWithParams } from "cloudflare-edge-toolkit";

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<Response> {
        const app = new Router();

        // Global middleware
        app.use(cors({ origin: "*", credentials: true }));
        app.use(logger({ level: "info" }));

        // Public routes
        app.get("/", () => {
            return json({ message: "Welcome to the API" });
        });

        app.post("/auth/login", async (req, env) => {
            const body = await req.json().catch(() => ({}));
            const { username, password } = body as {
                username?: string;
                password?: string;
            };

            if (!username || !password) {
                throw new BadRequestError("Username and password required");
            }

            // Simple authentication (in production, use proper password hashing)
            if (username === "admin" && password === "admin") {
                // In production, use proper JWT signing
                const token = "mock-jwt-token";
                return json({ token, user: { username, role: "admin" } });
            }

            throw new UnauthorizedError("Invalid credentials");
        });

        // Protected routes
        app.use(
            auth({
                secret: env.JWT_SECRET || "your-secret-key",
                tokenSource: "header",
                optional: false,
            }),
        );

        // Users routes
        app.get("/users", async (req, env) => {
            if (!env.USERS_KV) {
                return jsonError("KV not configured", 500);
            }

            const users = await getKV<Record<string, unknown>>(
                env.USERS_KV,
                "users",
            );
            return json({ users: users || {} });
        });

        app.get("/users/:id", async (req, env) => {
            if (!env.USERS_KV) {
                return jsonError("KV not configured", 500);
            }

            const params = req.params || {};
            const userId = params.id;

            const user = await getKV<Record<string, unknown>>(
                env.USERS_KV,
                `user:${userId}`,
            );
            if (!user) {
                throw new NotFoundError(`User ${userId} not found`);
            }

            return json({ user });
        });

        app.post("/users", async (req, env) => {
            if (!env.USERS_KV) {
                return jsonError("KV not configured", 500);
            }

            const body = await req.json().catch(() => ({}));
            const { id, name, email } = body as {
                id?: string;
                name?: string;
                email?: string;
            };

            if (!id || !name || !email) {
                throw new BadRequestError("id, name, and email are required");
            }

            const user = {
                id,
                name,
                email,
                createdAt: new Date().toISOString(),
            };
            await setKV(env.USERS_KV, `user:${id}`, user);

            return json({ user }, { status: 201 });
        });

        app.delete("/users/:id", async (req, env) => {
            if (!env.USERS_KV) {
                return jsonError("KV not configured", 500);
            }

            const params = req.params || {};
            const userId = params.id;

            await deleteKV(env.USERS_KV, `user:${userId}`);
            return json({ message: `User ${userId} deleted` });
        });

        // Files routes (R2)
        app.post("/files", async (req, env) => {
            if (!env.MY_BUCKET) {
                return jsonError("R2 bucket not configured", 500);
            }

            const formData = await req.formData().catch(() => null);
            if (!formData) {
                throw new BadRequestError("Form data required");
            }

            const file = formData.get("file") as File | null;
            if (!file) {
                throw new BadRequestError("File required");
            }

            const key = `files/${Date.now()}-${file.name}`;
            await putR2(env.MY_BUCKET, key, file.stream());

            return json({ key, message: "File uploaded" }, { status: 201 });
        });

        app.get("/files/:key", async (req, env) => {
            if (!env.MY_BUCKET) {
                return jsonError("R2 bucket not configured", 500);
            }

            const params = req.params || {};
            const key = params.key;

            const object = await getR2(env.MY_BUCKET, key);
            if (!object) {
                throw new NotFoundError(`File ${key} not found`);
            }

            return new Response(object.body, {
                headers: {
                    "Content-Type":
                        object.httpMetadata?.contentType ||
                        "application/octet-stream",
                },
            });
        });

        app.delete("/files/:key", async (req, env) => {
            if (!env.MY_BUCKET) {
                return jsonError("R2 bucket not configured", 500);
            }

            const params = req.params || {};
            const key = params.key;

            await deleteR2(env.MY_BUCKET, key);
            return json({ message: `File ${key} deleted` });
        });

        // Error handler
        app.onError(errorHandler({ includeStack: false, logErrors: true }));

        // 404 handler
        app.on404(() => {
            return json({ error: "Route not found" }, { status: 404 });
        });

        return app.handle(request, env, ctx);
    },
};

interface Env {
    JWT_SECRET?: string;
    USERS_KV?: KVNamespace;
    MY_BUCKET?: R2Bucket;
}
