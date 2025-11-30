import {
    Router,
    json,
    session,
    attachSessionCookie,
    createFlash,
} from "cloudflare-edge-toolkit";
import type { RequestWithParams } from "cloudflare-edge-toolkit";
import type { Session } from "cloudflare-edge-toolkit";

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const app = new Router();

        // Session middleware
        app.use(
            session({
                kv: env.SESSIONS_KV,
                secret: env.SESSION_SECRET || "your-secret-key",
                cookieName: "session",
                maxAge: 3600, // 1 hour
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
            }),
        );

        // Login endpoint
        app.post("/login", async (req) => {
            const body = await req.json();
            const { username, password } = body as {
                username?: string;
                password?: string;
            };

            // Simple authentication (in production, use proper password hashing)
            if (username === "admin" && password === "admin") {
                const reqWithSession = req as RequestWithParams & {
                    session?: Session;
                };
                const session = reqWithSession.session;

                if (session) {
                    session.set("userId", 1);
                    session.set("username", username);
                    session.set("isAuthenticated", true);

                    const response = json({ message: "Login successful" });
                    await session.save();
                    return attachSessionCookie(response, session);
                }
            }

            return json({ error: "Invalid credentials" }, { status: 401 });
        });

        // Logout endpoint
        app.post("/logout", async (req) => {
            const reqWithSession = req as RequestWithParams & {
                session?: Session;
            };
            const session = reqWithSession.session;

            if (session) {
                await session.destroy();
                const response = json({ message: "Logged out" });
                // Remove cookie by setting maxAge to 0
                return attachSessionCookie(
                    response,
                    new (session.constructor as typeof Session)({
                        kv: env.SESSIONS_KV,
                        secret: env.SESSION_SECRET || "your-secret-key",
                    }),
                );
            }

            return json({ message: "Not logged in" });
        });

        // Protected route - check session
        app.get("/profile", async (req) => {
            const reqWithSession = req as RequestWithParams & {
                session?: Session;
            };
            const session = reqWithSession.session;

            if (!session || !session.get("isAuthenticated")) {
                return json({ error: "Unauthorized" }, { status: 401 });
            }

            const userId = session.get<number>("userId");
            const username = session.get<string>("username");

            await session.save();
            const response = json({
                userId,
                username,
                message: "Profile data",
            });
            return attachSessionCookie(response, session);
        });

        // Flash messages example
        app.get("/flash", async (req) => {
            const reqWithSession = req as RequestWithParams & {
                session?: Session;
            };
            const session = reqWithSession.session;

            if (session) {
                const flash = createFlash(session);
                const message = flash.get("message");

                // Clear flash after reading
                flash.clear();

                await session.save();
                const response = json({ flashMessage: message });
                return attachSessionCookie(response, session);
            }

            return json({ flashMessage: null });
        });

        app.post("/flash", async (req) => {
            const body = await req.json();
            const reqWithSession = req as RequestWithParams & {
                session?: Session;
            };
            const session = reqWithSession.session;

            if (session) {
                const flash = createFlash(session);
                flash.set("message", body.message || "Flash message set!");

                await session.save();
                const response = json({ message: "Flash message set" });
                return attachSessionCookie(response, session);
            }

            return json({ error: "Session not available" }, { status: 500 });
        });

        // Get session data
        app.get("/session", async (req) => {
            const reqWithSession = req as RequestWithParams & {
                session?: Session;
            };
            const session = reqWithSession.session;

            if (session) {
                await session.save();
                const response = json({
                    sessionId: session.getId(),
                    data: session.getAll(),
                });
                return attachSessionCookie(response, session);
            }

            return json({ error: "No session" }, { status: 404 });
        });

        // 404 handler
        app.on404(() => json({ error: "Not found" }, { status: 404 }));

        // Error handler
        app.onError((error) => {
            console.error("Error:", error);
            return json({ error: error.message }, { status: 500 });
        });

        return app.handle(request, env, ctx);
    },
};

interface Env {
    SESSIONS_KV: KVNamespace;
    SESSION_SECRET?: string;
}

