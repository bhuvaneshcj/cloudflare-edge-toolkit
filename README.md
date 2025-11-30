# Cloudflare Edge Toolkit

A TypeScript-first developer toolkit for Cloudflare Workers that provides a class-based router, middleware support, storage wrappers (KV/R2/D1/Cache), authentication utilities, and more.

## Features

- **Class-based Router** - Express-like routing with path parameters, route groups, sub-routers, and middleware
- **Middleware System** - Built-in middleware (CORS, logging, auth, rate limiting, security headers, validation, sessions) and custom middleware support
- **Storage Wrappers** - Type-safe wrappers for KV, R2, D1, and Cache API
- **D1 ORM** - Query builder, model classes, relationships, and migrations
- **Session Management** - KV-backed sessions with cookie support and flash messages
- **WebSocket Support** - Upgrade HTTP to WebSocket with room management and broadcasting
- **Authentication** - JWT authentication utilities and middleware
- **Testing Utilities** - Request builders, mock services (KV/R2/D1), and response assertions
- **Utilities** - JSON helpers, error classes, request/response utilities, validation
- **TypeScript First** - Full type safety with comprehensive type definitions
- **Edge Optimized** - Lightweight and optimized for Cloudflare Workers runtime
- **Zero Dependencies** - No runtime dependencies (except optional `jose` for JWT)

## Why Cloudflare Workers?

Cloudflare Workers provides a global edge computing platform that runs your code in 300+ cities worldwide, resulting in:

- **Ultra-low latency** - Your code runs close to your users
- **Global scale** - Automatic scaling to handle any traffic
- **Cost-effective** - Pay only for what you use
- **Developer-friendly** - Modern JavaScript/TypeScript runtime
- **Integrated services** - KV, R2, D1, Durable Objects, and more

## Installation

**Requirements:** Node.js 24+ (use `nvm use` if you have `.nvmrc` file)

```bash
npm install cloudflare-edge-toolkit
```

For JWT support (optional):

```bash
npm install jose
```

## Quick Start

```typescript
import { Router, json, getKV, setKV } from "cloudflare-edge-toolkit";

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        const app = new Router();

        app.get("/hello", () => json({ message: "Hello from Edge!" }));

        app.get("/kv", async (req, env) => {
            await setKV(env.MY_KV, "counter", 1);
            const value = await getKV(env.MY_KV, "counter");
            return json({ counter: value });
        });

        return app.handle(request, env, ctx);
    },
};
```

## Router Usage

### Basic Routes

```typescript
import { Router, json } from "cloudflare-edge-toolkit";

const app = new Router();

// GET route
app.get("/users", () => json({ users: [] }));

// POST route
app.post("/users", async (req) => {
    const body = await req.json();
    return json({ created: body }, { status: 201 });
});

// Path parameters
app.get("/users/:id", (req) => {
    const id = req.params?.id;
    return json({ userId: id });
});

// Multiple HTTP methods
app.get("/data", handler);
app.post("/data", handler);
app.put("/data/:id", handler);
app.delete("/data/:id", handler);
```

### Route Groups

```typescript
import { Router } from "cloudflare-edge-toolkit";

const app = new Router();

// Create a route group
const api = app.group("/api");
api.get("/users", handler);
api.post("/users", handler);

// Nested groups
const v1 = api.group("/v1");
v1.get("/posts", handler);
```

### Sub-routers

```typescript
import { Router } from "cloudflare-edge-toolkit";

const app = new Router();
const userRouter = new Router();

userRouter.get("/", listUsers);
userRouter.get("/:id", getUser);
userRouter.post("/", createUser);

// Mount sub-router
app.use("/users", userRouter);
```

### Route Constraints

```typescript
// Only numeric IDs
app.get("/posts/:id(\\d+)", handler);

// Only alphanumeric
app.get("/users/:slug([a-z0-9-]+)", handler);
```

### Middleware

```typescript
import {
    Router,
    cors,
    logger,
    auth,
    securityHeaders,
    validate,
} from "cloudflare-edge-toolkit";

const app = new Router();

// Global middleware
app.use(cors({ origin: "*" }));
app.use(logger());

// Route-specific middleware
app.get("/protected", auth({ secret: "your-secret" }), handler);

// Security headers
app.use(
    securityHeaders({
        contentSecurityPolicy: "default-src 'self'",
        xFrameOptions: "DENY",
    }),
);

// Request validation
app.post(
    "/users",
    validate({
        body: { name: "string", email: "email" },
    }),
    handler,
);
```

### Error Handling

```typescript
// Custom 404 handler
app.on404(() => json({ error: "Not found" }, { status: 404 }));

// Custom error handler
app.onError((error, req) => {
    console.error("Error:", error);
    return json({ error: error.message }, { status: 500 });
});
```

## Services

### KV (Key-Value Storage)

```typescript
import { getKV, setKV, deleteKV, KVService } from "cloudflare-edge-toolkit";

// Functional API
await setKV(env.MY_KV, "key", "value");
const value = await getKV(env.MY_KV, "key");
await deleteKV(env.MY_KV, "key");

// Class API
const kv = new KVService(env.MY_KV);
await kv.set("key", { data: "value" });
const data = await kv.get<{ data: string }>("key");
```

### R2 (Object Storage)

```typescript
import { putR2, getR2, deleteR2, R2Service } from "cloudflare-edge-toolkit";

// Upload file
await putR2(env.MY_BUCKET, "file.txt", fileStream);

// Download file
const object = await getR2(env.MY_BUCKET, "file.txt");
if (object) {
    return new Response(object.body);
}

// Delete file
await deleteR2(env.MY_BUCKET, "file.txt");
```

### D1 (Database)

#### Basic Usage

```typescript
import { prepareD1, D1Service } from "cloudflare-edge-toolkit";

// Prepare statement
const stmt = prepareD1(env.DB, "SELECT * FROM users WHERE id = ?");
const result = await stmt.bind(id).first();

// Class API
const db = new D1Service(env.DB);
const result = await db.prepare("SELECT * FROM users").all();
```

#### Query Builder (v1.2.0+)

```typescript
import { QueryBuilder } from "cloudflare-edge-toolkit";

const users = await new QueryBuilder(env.DB)
    .select("id", "name", "email")
    .from("users")
    .where("age", ">", 18)
    .orderBy("name", "ASC")
    .limit(10)
    .all();
```

#### ORM Models (v1.2.0+)

```typescript
import { Model } from "cloudflare-edge-toolkit";

class User extends Model {
    static tableName = "users";
    id?: number;
    name?: string;
    email?: string;
}

// Set database
User.setDatabase(env.DB);

// Use model
const users = await User.all();
const user = await User.find(1);
const newUser = await User.create({ name: "John", email: "john@example.com" });
await User.update({ name: "Jane" }, { id: 1 });
await User.delete({ id: 1 });
```

#### Relationships (v1.2.0+)

```typescript
import { Relations, withRelations } from "cloudflare-edge-toolkit";

// Define relationships
class User extends Model {
    static tableName = "users";
    posts = Relations.hasMany(Post, "user_id");
}

class Post extends Model {
    static tableName = "posts";
    author = Relations.belongsTo(User, "user_id");
}

// Use relationships
const user = await User.find(1);
const posts = await user.posts(user);

// Eager load
const users = await User.all();
const usersWithPosts = await withRelations(users, {
    posts: (u) => Relations.hasMany(Post, "user_id")(u),
});
```

#### Migrations (v1.2.0+)

```typescript
import { MigrationRunner, createMigration } from "cloudflare-edge-toolkit";

const runner = new MigrationRunner(env.DB);
const migrations = [
    createMigration(
        "001_create_users",
        async (db) => {
            await db.exec(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL
                )
            `);
        },
        async (db) => {
            await db.exec("DROP TABLE users");
        },
    ),
];

await runner.up(migrations);
```

### Cache API

```typescript
import { matchCache, putCache, CacheService } from "cloudflare-edge-toolkit";

// Check cache
const cached = await matchCache(env.CACHE, request);
if (cached) return cached;

// Store in cache
await putCache(env.CACHE, request, response);
```

## Middleware

### CORS

```typescript
import { cors } from "cloudflare-edge-toolkit";

app.use(
    cors({
        origin: "*", // or specific origins
        methods: ["GET", "POST"],
        credentials: true,
    }),
);
```

### Logger

```typescript
import { logger, simpleLogger } from "cloudflare-edge-toolkit";

app.use(logger({ level: "info", format: "json" }));
// or
app.use(simpleLogger());
```

### Rate Limiting

```typescript
import { rateLimit, rateLimitKV } from "cloudflare-edge-toolkit";

// In-memory (single worker)
app.use(rateLimit({ windowMs: 60000, max: 100 }));

// KV-backed (distributed)
app.use(
    rateLimitKV({
        kv: env.RATE_LIMIT_KV,
        windowMs: 60000,
        max: 100,
    }),
);
```

### Authentication

```typescript
import { auth, requireRole } from "cloudflare-edge-toolkit";

// JWT authentication
app.use(
    auth({
        secret: env.JWT_SECRET,
        tokenSource: "header", // or "cookie" or "both"
    }),
);

// Role-based access
app.get("/admin", requireRole("admin"), handler);
```

### Security Headers

```typescript
import { securityHeaders } from "cloudflare-edge-toolkit";

app.use(
    securityHeaders({
        contentSecurityPolicy: "default-src 'self'",
        xFrameOptions: "DENY",
        strictTransportSecurity: "max-age=31536000",
    }),
);
```

### Request Validation

```typescript
import { validate } from "cloudflare-edge-toolkit";

app.post(
    "/register",
    validate({
        body: {
            name: { type: "string", required: true, min: 3 },
            email: { type: "email", required: true },
            age: { type: "number", min: 18, max: 100 },
        },
    }),
    handler,
);
```

### Session Management

```typescript
import { session, attachSessionCookie } from "cloudflare-edge-toolkit";

// Session middleware
app.use(
    session({
        kv: env.SESSIONS_KV,
        secret: env.SESSION_SECRET,
        maxAge: 3600, // 1 hour
    }),
);

// Use session in handlers
app.get("/profile", async (req) => {
    const session = req.session;
    const userId = session.get("userId");

    await session.save();
    const response = json({ userId });
    return attachSessionCookie(response, session);
});
```

### WebSocket Support

```typescript
import { upgradeWebSocket, RoomManager } from "cloudflare-edge-toolkit";

const roomManager = new RoomManager();

app.get("/ws", (req) => {
    return upgradeWebSocket(req, {
        onOpen: (ws) => {
            const room = roomManager.getRoom("chat");
            room.add(ws);
        },
        onMessage: (ws, message) => {
            const room = roomManager.getRoom("chat");
            room.broadcast(message, ws);
        },
        onClose: (ws) => {
            // Remove from rooms
        },
    });
});
```

## Testing Utilities

```typescript
import {
    createTestWorker,
    get,
    post,
    assertResponse,
    createMockKV,
    createMockR2,
    createMockD1,
} from "cloudflare-edge-toolkit";

// Create test worker
const worker = createTestWorker(router);

// Set up mocks
const kv = worker.kv("MY_KV");
const r2 = worker.r2("MY_BUCKET");
const db = worker.d1("MY_DB");

// Make requests
const response = await worker.fetch(get("/users"));
const postResponse = await worker.fetch(
    post("/users", { name: "John" }),
);

// Assert responses
await assertResponse(response).status(200).json();
await assertResponse(postResponse).status(201).hasHeader("Location");
```

## Utilities

### JSON Responses

```typescript
import { json, jsonError } from "cloudflare-edge-toolkit";

return json({ data: "value" });
return jsonError("Error message", 400);
```

### Error Classes

```typescript
import {
    HttpError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    InternalServerError,
    errorToResponse,
} from "cloudflare-edge-toolkit";

throw new BadRequestError("Invalid input");
throw new NotFoundError("User not found");
throw new ForbiddenError("Access denied");

// Convert any error to Response
const response = errorToResponse(error, includeStack: true);
```

### Request Parsing

```typescript
import {
    parseBody,
    getQueryParams,
    getPathParams,
    getHeaders,
    getHeader,
    getCookie,
    getCookies,
} from "cloudflare-edge-toolkit";

const body = await parseBody<{ name: string }>(request);
const query = getQueryParams(request);
const id = getPathParams(request).id;
const headers = getHeaders(request);
const authHeader = getHeader(request, "Authorization");
const token = getCookie(request, "token");
const cookies = getCookies(request);
```

### Response Helpers

```typescript
import { html, text, redirect, setCookie, removeCookie } from "cloudflare-edge-toolkit";

return html("<h1>Hello</h1>");
return text("Plain text");
return redirect("https://example.com");
const response = setCookie(response, "token", "value", { httpOnly: true });
const cleared = removeCookie(response, "token");
```

### Validation Utilities

```typescript
import {
    validateBody,
    validateQueryParam,
    validatePathParam,
    validateEmail,
    validateURL,
    validateLength,
    validateRange,
} from "cloudflare-edge-toolkit";

// Validate body
const user = validateBody(body, (data): data is User => data.name !== undefined);

// Validate query params
const page = validateQueryParam(query, "page", false) || "1";

// Validate path params
const id = validatePathParam(params, "id");

// Validate formats
if (!validateEmail(email)) throw new ValidationError("Invalid email");
if (!validateURL(url)) throw new ValidationError("Invalid URL");

// Validate ranges
if (!validateLength(name, 3, 50)) throw new ValidationError("Name must be 3-50 chars");
if (!validateRange(age, 18, 100)) throw new ValidationError("Age must be 18-100");
```

## Examples

Check out the `examples/` directory for complete examples:

- **basic-worker** - Simple router and KV operations
- **full-stack-app** - Complete app with auth, CRUD, and file uploads
- **api-with-storage** - RESTful API with caching and rate limiting
- **v1.1-features** - Demonstrates route groups, sub-routers, validation, and security headers
- **d1-orm** - D1 database with query builder, models, and migrations
- **session-management** - KV-backed sessions with flash messages
- **websocket-chat** - Real-time chat with WebSocket and room management

## TypeScript

The toolkit is fully typed. Import types as needed:

```typescript
import type {
    Handler,
    Middleware,
    RequestWithParams,
    Env,
} from "cloudflare-edge-toolkit";
```

## Roadmap

### ✅ v1.1.0 - v1.5.0 (Completed)

- [x] Advanced router features (route groups, sub-routers, route constraints)
- [x] Security headers and request validation middleware
- [x] D1 ORM with query builder and migrations
- [x] Session management with KV-backed storage
- [x] WebSocket support with room management
- [x] Testing utilities with mocks and assertions

### v2.0.0+

- [ ] CLI tool for scaffolding and code generation
- [ ] Plugin system
- [ ] GraphQL support
- [ ] Server-Sent Events
- [ ] Monitoring and observability

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions, please open an issue on GitHub.
