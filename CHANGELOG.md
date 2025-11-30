# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2024-11-30

### Added

- **WebSocket Support** - Upgrade HTTP requests to WebSocket
  ```typescript
  import { upgradeWebSocket } from "cloudflare-edge-toolkit";
  
  app.get("/ws", (req) => {
    return upgradeWebSocket(req, {
      onMessage: (ws, message) => {
        ws.send(`Echo: ${message}`);
      },
    });
  });
  ```

- **Room Management** - Organize WebSocket connections into rooms
  ```typescript
  const roomManager = new RoomManager();
  const room = roomManager.getRoom("chat");
  room.broadcast("Hello everyone!");
  ```

- **Message Broadcasting** - Send messages to multiple connections
- **Connection Management** - Handle open, close, error events
- New example project demonstrating WebSocket chat

### Improved

- Better WebSocket event handling
- Automatic cleanup of closed connections

## [1.3.0] - 2024-11-30

### Added

- **Session Management** - KV-backed session storage
  ```typescript
  app.use(session({
    kv: env.SESSIONS_KV,
    secret: env.SESSION_SECRET,
    maxAge: 3600,
  }));
  ```

- **Session Class** - Full session API with get, set, delete, clear
- **Session Middleware** - Automatic session loading and saving
- **Cookie-based Sessions** - Secure cookie handling
- **Flash Messages** - One-time messages stored in session
- **Session Lifecycle** - Create, load, save, destroy sessions
- New example project demonstrating session management

### Improved

- Better session security with configurable options
- Automatic session expiration via KV TTL

## [1.2.0] - 2024-11-30

### Added

- **D1 Query Builder** - Fluent API for building SQL queries

    ```typescript
    const users = await db
        .query()
        .select("id", "name")
        .where("age", ">", 18)
        .orderBy("name")
        .limit(10)
        .all();
    ```

- **Model Base Class** - ORM-style model definitions

    ```typescript
    class User extends Model {
        static tableName = "users";
    }
    const user = await User.find(1);
    ```

- **Type-safe Queries** - Full TypeScript inference for query results
- **CRUD Operations** - Create, read, update, delete methods on models
- **Relationships** - hasOne, hasMany, belongsTo relationship helpers
- **Migrations System** - Database migration runner with up/down support
- **Fixed D1 Transactions** - Proper transaction support implementation
- New example project demonstrating D1 ORM features

### Improved

- Enhanced D1 service wrapper with better transaction support
- Better error handling in query builder
- Improved TypeScript types for ORM

## [1.1.0] - 2024-11-30

### Added

- **Route Groups** - Organize routes with common prefixes using `app.group()`

    ```typescript
    const api = app.group("/api");
    api.get("/users", handler);
    ```

- **Sub-routers** - Mount separate routers using `app.use(path, router)`

    ```typescript
    const userRouter = new Router();
    app.use("/users", userRouter);
    ```

- **Route Constraints** - Regex-based path parameter validation

    ```typescript
    app.get("/posts/:id(\\d+)", handler); // Only numeric IDs
    ```

- **Security Headers Middleware** - Add security headers to responses

    ```typescript
    app.use(
        securityHeaders({
            contentSecurityPolicy: "default-src 'self'",
            xFrameOptions: "DENY",
        }),
    );
    ```

- **Request Validation Middleware** - Validate request body, query, and params

    ```typescript
    app.post(
        "/users",
        validate({
            body: { name: "string", email: "email" },
        }),
        handler,
    );
    ```

- **Compression Middleware** - Compression utilities (Cloudflare handles compression automatically)
- **Nested Route Groups** - Create nested groups for better organization
- New example project demonstrating v1.1.0 features

### Improved

- Enhanced path parsing with regex constraint support
- Better TypeScript types for route groups
- Improved middleware composition

## [1.0.0] - 2024-11-30

### Added

- Initial release of Cloudflare Edge Toolkit
- Class-based Router with support for GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD methods
- Path parameter support (`/users/:id`)
- Middleware pipeline system
- Global and route-specific middleware
- Custom 404 and error handlers
- KV service wrapper with get, set, delete, list, and metadata support
- R2 service wrapper with upload, download, delete, list, and multipart upload support
- D1 service wrapper with prepared statements, transactions, and batch operations
- Cache API wrapper
- JWT authentication service (requires optional `jose` package)
- JSON response utilities
- Error classes (HttpError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError)
- Request parsing utilities (body, query params, path params, cookies, headers)
- Response utilities (HTML, text, redirect, cookies)
- Environment variable utilities with type safety
- Validation utilities
- CORS middleware
- Logger middleware
- Error handler middleware
- Rate limiting middleware (in-memory and KV-backed)
- Authentication middleware with JWT support
- Role-based access control middleware
- Comprehensive TypeScript type definitions
- Three example projects (basic-worker, full-stack-app, api-with-storage)
- Full documentation and README

### Technical Details

- TypeScript-first with strict mode
- ESM-only modules
- Zero runtime dependencies (except optional `jose` for JWT)
- Edge-optimized code
- Tree-shakeable exports
- Full type safety
