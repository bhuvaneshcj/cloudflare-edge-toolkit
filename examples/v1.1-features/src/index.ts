import {
    Router,
    json,
    securityHeaders,
    validate,
    cors,
    logger,
} from "cloudflare-edge-toolkit";

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const app = new Router();

        // Global middleware
        app.use(cors({ origin: "*" }));
        app.use(logger());

        // Example 1: Route Groups
        const api = app.group("/api");
        api.get("/status", () => json({ status: "ok" }));
        api.get("/version", () => json({ version: "1.1.0" }));

        // Nested route groups
        const v1 = api.group("/v1");
        v1.get("/users", () => json({ users: [] }));
        v1.get("/users/:id", (req) => {
            const id = req.params?.id;
            return json({ userId: id });
        });

        // Example 2: Sub-routers
        const userRouter = new Router();
        userRouter.get("/", () => json({ message: "List users" }));
        userRouter.get("/:id", (req) => {
            const id = req.params?.id;
            return json({ userId: id });
        });
        userRouter.post("/", () => json({ message: "Create user" }, { status: 201 }));

        app.use("/users", userRouter);

        // Example 3: Route constraints with regex
        app.get("/posts/:id(\\d+)", (req) => {
            // Only matches numeric IDs
            const id = req.params?.id;
            return json({ postId: id, type: "numeric" });
        });

        // Example 4: Security headers middleware
        app.get("/secure", securityHeaders({
            contentSecurityPolicy: "default-src 'self'",
            xFrameOptions: "DENY",
            strictTransportSecurity: "max-age=31536000",
        }), () => {
            return json({ message: "Secure endpoint" });
        });

        // Example 5: Request validation middleware
        app.post("/register",
            validate({
                body: {
                    name: { type: "string", required: true, min: 3, max: 50 },
                    email: { type: "email", required: true },
                    age: { type: "number", required: false, min: 18, max: 100 },
                },
            }),
            async (req) => {
                const body = await req.json();
                return json({ message: "Registration successful", data: body }, { status: 201 });
            }
        );

        // Example 6: Combined features
        const admin = app.group("/admin", securityHeaders({
            xFrameOptions: "DENY",
            contentSecurityPolicy: "default-src 'self'",
        }));

        admin.get("/dashboard", () => json({ message: "Admin dashboard" }));
        admin.get("/settings", () => json({ message: "Admin settings" }));

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
    // Add your environment bindings here
}

