import { Router, json, getKV, setKV } from "cloudflare-edge-toolkit";

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<Response> {
        const app = new Router();

        // Simple GET route
        app.get("/hello", () => {
            return json({ message: "Hello from Edge!" });
        });

        // Route with path parameters
        app.get("/users/:id", (req) => {
            const params = req.params || {};
            return json({ userId: params.id, message: `User ${params.id}` });
        });

        // KV operations
        app.get("/kv", async (req, env) => {
            if (!env.MY_KV) {
                return json(
                    { error: "KV namespace not configured" },
                    { status: 500 },
                );
            }

            // Get value
            const counter = await getKV<number>(env.MY_KV, "counter");
            const currentValue = counter || 0;

            // Set value
            await setKV(env.MY_KV, "counter", currentValue + 1);

            return json({ counter: currentValue + 1 });
        });

        // POST route with body parsing
        app.post("/data", async (req) => {
            const body = await req.json();
            return json({ received: body, message: "Data received" });
        });

        // Custom 404 handler
        app.on404(() => {
            return json({ error: "Route not found" }, { status: 404 });
        });

        // Error handler
        app.onError((error, req) => {
            console.error("Error:", error);
            return json(
                { error: error.message || "Internal Server Error" },
                { status: 500 },
            );
        });

        return app.handle(request, env, ctx);
    },
};

interface Env {
    MY_KV: KVNamespace;
}
