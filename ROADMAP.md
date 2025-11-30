# Roadmap - Cloudflare Edge Toolkit

## Version History & Future Plans

### ✅ v1.0.0 (Current - Published)
**Status**: Released and published to npm

**Features**:
- Core router with all HTTP methods
- Middleware system
- KV, R2, D1, Cache service wrappers
- JWT authentication
- Comprehensive utilities
- Built-in middleware (CORS, logger, rate limiting, auth)
- Three example projects
- Full TypeScript support

---

## 🚀 v1.1.0 - Enhanced Router & Middleware
**Target Release**: Q1 2025

### Planned Features

#### Advanced Router Features
- [ ] Route groups/namespaces
  ```typescript
  const api = app.group("/api");
  api.get("/users", handler);
  api.post("/users", handler);
  ```

- [ ] Sub-routers
  ```typescript
  const userRouter = new Router();
  userRouter.get("/", listUsers);
  userRouter.get("/:id", getUser);
  app.use("/users", userRouter);
  ```

- [ ] Route constraints with regex
  ```typescript
  app.get("/users/:id(\\d+)", handler); // Only numeric IDs
  ```

- [ ] Route priorities/ordering
- [ ] Route caching for better performance

#### Enhanced Middleware
- [ ] Compression middleware (gzip/brotli)
- [ ] Security headers middleware
  ```typescript
  app.use(securityHeaders({
    contentSecurityPolicy: "...",
    xFrameOptions: "DENY",
  }));
  ```

- [ ] Request validation middleware
  ```typescript
  app.post("/users", validate({
    body: { name: "string", email: "email" }
  }), handler);
  ```

- [ ] Response transformation middleware
- [ ] Cache middleware with TTL support

#### Improvements
- [ ] Better error messages
- [ ] Performance optimizations
- [ ] Additional examples

---

## 🗄️ v1.2.0 - D1 ORM & Query Builder
**Target Release**: Q1 2025

### Planned Features

#### D1 ORM
- [ ] Query builder
  ```typescript
  const users = await db
    .select("users")
    .where("age", ">", 18)
    .orderBy("name")
    .limit(10)
    .all();
  ```

- [ ] Model definitions
  ```typescript
  class User extends Model {
    static table = "users";
    id: number;
    name: string;
    email: string;
  }
  ```

- [ ] Relationships (hasOne, hasMany, belongsTo)
- [ ] Migrations support
- [ ] Type-safe queries with full TypeScript inference

#### D1 Improvements
- [ ] Fix transaction support (currently placeholder)
- [ ] Batch operations improvements
- [ ] Query result caching

---

## 🔐 v1.3.0 - Session Management
**Target Release**: Q2 2025

### Planned Features

#### Session Management
- [ ] KV-backed session storage
  ```typescript
  app.use(session({
    kv: env.SESSIONS_KV,
    secret: env.SESSION_SECRET,
    maxAge: 3600,
  }));
  ```

- [ ] Cookie-based sessions
- [ ] Token-based sessions
- [ ] Session middleware
- [ ] Flash messages support

#### Authentication Enhancements
- [ ] OAuth2 support
- [ ] API key authentication
- [ ] Multi-factor authentication helpers

---

## 🌐 v1.4.0 - WebSocket Support
**Target Release**: Q2 2025

### Planned Features

#### WebSocket Support
- [ ] WebSocket upgrade handling
  ```typescript
  app.ws("/chat", (ws, req) => {
    ws.on("message", (data) => {
      ws.send(`Echo: ${data}`);
    });
  });
  ```

- [ ] Message broadcasting
- [ ] Room management
- [ ] Connection management
- [ ] WebSocket middleware

---

## 🧪 v1.5.0 - Testing Utilities
**Target Release**: Q2 2025

### Planned Features

#### Testing Utilities
- [ ] Test helpers for Workers
  ```typescript
  import { createTestWorker } from "cloudflare-edge-toolkit/testing";
  
  const worker = createTestWorker(app);
  const response = await worker.fetch("/users");
  ```

- [ ] Mock KV/R2/D1
- [ ] Request builders
- [ ] Response assertions
- [ ] Integration test utilities

---

## 🛠️ v2.0.0 - CLI Tool & Developer Experience
**Target Release**: Q3 2025

### Planned Features

#### CLI Tool
- [ ] Project scaffolding
  ```bash
  npx cloudflare-edge-toolkit create my-app
  ```

- [ ] Code generation
  ```bash
  npx cloudflare-edge-toolkit generate route users
  npx cloudflare-edge-toolkit generate middleware auth
  ```

- [ ] Deployment helpers
- [ ] Local development server
- [ ] Type generation from wrangler.toml

#### Plugin System
- [ ] Plugin architecture
- [ ] Middleware plugins
- [ ] Service plugins
- [ ] Community plugins support

---

## 🚀 v2.1.0+ - Advanced Features
**Target Release**: Q3-Q4 2025

### Planned Features

#### Advanced Features
- [ ] GraphQL support
- [ ] Server-Sent Events (SSE)
- [ ] Streaming responses
- [ ] Request queuing
- [ ] Durable Objects helpers
- [ ] Queue API helpers

#### Monitoring & Observability
- [ ] Metrics collection
- [ ] Tracing support
- [ ] Performance monitoring
- [ ] Error tracking integration

---

## 📊 Priority Matrix

### High Priority (v1.1.0 - v1.2.0)
1. Route groups/namespaces
2. D1 ORM with query builder
3. Security headers middleware
4. Request validation middleware
5. Testing utilities

### Medium Priority (v1.3.0 - v1.4.0)
1. Session management
2. WebSocket support
3. Compression middleware
4. Enhanced authentication

### Lower Priority (v2.0.0+)
1. CLI tool
2. Plugin system
3. GraphQL support
4. Advanced monitoring

---

## 🤝 Contributing

We welcome contributions! Areas where help is especially needed:

- [ ] D1 ORM implementation
- [ ] WebSocket support
- [ ] Testing utilities
- [ ] Documentation improvements
- [ ] Additional examples
- [ ] Performance optimizations

---

## 📝 Version Strategy

- **Patch (1.0.x)**: Bug fixes, security patches
- **Minor (1.x.0)**: New features, backward compatible
- **Major (x.0.0)**: Breaking changes, major new features

---

## 🎯 Next Immediate Steps (v1.1.0)

1. **Route Groups** - Most requested feature
2. **Security Headers Middleware** - Important for production
3. **Request Validation** - Developer experience improvement
4. **Better Documentation** - More examples and guides

---

**Last Updated**: November 30, 2024
**Current Version**: v1.0.0
**Next Version**: v1.1.0

