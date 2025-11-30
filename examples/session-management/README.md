# Session Management Example

This example demonstrates session management features from v1.3.0:

## Features Demonstrated

1. **KV-backed Sessions** - Store session data in Cloudflare KV
2. **Session Middleware** - Automatic session loading
3. **Cookie-based Sessions** - Secure cookie handling
4. **Flash Messages** - One-time messages stored in session
5. **Session Lifecycle** - Create, save, destroy sessions

## Setup

1. Create a KV namespace:
```bash
npx wrangler kv:namespace create SESSIONS_KV
```

2. Update `wrangler.toml` with your KV namespace IDs

3. Set SESSION_SECRET in `wrangler.toml`

4. Run locally:
```bash
npx wrangler dev
```

## API Endpoints

- `POST /login` - Login and create session
  ```json
  { "username": "admin", "password": "admin" }
  ```

- `POST /logout` - Destroy session

- `GET /profile` - Get protected profile (requires session)

- `GET /session` - Get current session data

- `POST /flash` - Set flash message
  ```json
  { "message": "Hello!" }
  ```

- `GET /flash` - Get and clear flash message

## Usage

```typescript
// Session is automatically attached to request
app.use(session({
    kv: env.SESSIONS_KV,
    secret: env.SESSION_SECRET,
}));

// Access session in handlers
const session = req.session;
session.set("userId", 1);
await session.save();
```

