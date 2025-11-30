import {
    Router,
    json,
    getKV,
    setKV,
    putR2,
    getR2,
    listR2,
    matchCache,
    putCache,
    cors,
    rateLimit,
} from "cloudflare-edge-toolkit";

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<Response> {
        const app = new Router();

        // CORS middleware
        app.use(cors({ origin: "*" }));

        // Rate limiting
        app.use(rateLimit({ windowMs: 60000, max: 100 }));

        // Cache check middleware
        app.use(async (req, env) => {
            if (req.method === "GET" && env.CACHE) {
                const cached = await matchCache(env.CACHE, req);
                if (cached) {
                    return cached;
                }
            }
        });

        // API routes
        app.get("/api/data/:key", async (req, env) => {
            if (!env.DATA_KV) {
                return json({ error: "KV not configured" }, { status: 500 });
            }

            const params = req.params || {};
            const key = params.key;

            const data = await getKV(env.DATA_KV, key);
            if (!data) {
                return json({ error: "Not found" }, { status: 404 });
            }

            const response = json({ key, data });

            // Cache the response
            if (env.CACHE) {
                ctx.waitUntil(putCache(env.CACHE, req, response.clone()));
            }

            return response;
        });

        app.post("/api/data/:key", async (req, env) => {
            if (!env.DATA_KV) {
                return json({ error: "KV not configured" }, { status: 500 });
            }

            const params = req.params || {};
            const key = params.key;
            const body = await req.json().catch(() => ({}));

            await setKV(env.DATA_KV, key, body, { expirationTtl: 3600 });

            return json({ key, message: "Data stored" }, { status: 201 });
        });

        // R2 file operations
        app.post("/api/files", async (req, env) => {
            if (!env.FILES_BUCKET) {
                return json(
                    { error: "R2 bucket not configured" },
                    { status: 500 },
                );
            }

            const formData = await req.formData().catch(() => null);
            if (!formData) {
                return json({ error: "Form data required" }, { status: 400 });
            }

            const file = formData.get("file") as File | null;
            if (!file) {
                return json({ error: "File required" }, { status: 400 });
            }

            const key = `files/${Date.now()}-${file.name}`;
            await putR2(env.FILES_BUCKET, key, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                },
            });

            return json({ key, message: "File uploaded" }, { status: 201 });
        });

        app.get("/api/files", async (req, env) => {
            if (!env.FILES_BUCKET) {
                return json(
                    { error: "R2 bucket not configured" },
                    { status: 500 },
                );
            }

            const list = await listR2(env.FILES_BUCKET, { prefix: "files/" });
            const files = list.objects.map((obj) => ({
                key: obj.key,
                size: obj.size,
                uploaded: obj.uploaded,
            }));

            return json({ files });
        });

        app.get("/api/files/:key", async (req, env) => {
            if (!env.FILES_BUCKET) {
                return json(
                    { error: "R2 bucket not configured" },
                    { status: 500 },
                );
            }

            const params = req.params || {};
            const key = params.key;

            const object = await getR2(env.FILES_BUCKET, key);
            if (!object) {
                return json({ error: "File not found" }, { status: 404 });
            }

            return new Response(object.body, {
                headers: {
                    "Content-Type":
                        object.httpMetadata?.contentType ||
                        "application/octet-stream",
                    "Content-Length": object.size.toString(),
                },
            });
        });

        // Health check
        app.get("/health", () => {
            return json({ status: "ok", timestamp: new Date().toISOString() });
        });

        // 404 handler
        app.on404(() => {
            return json({ error: "Not found" }, { status: 404 });
        });

        return app.handle(request, env, ctx);
    },
};

interface Env {
    DATA_KV?: KVNamespace;
    FILES_BUCKET?: R2Bucket;
    CACHE?: Cache;
}
