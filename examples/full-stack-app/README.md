# Full Stack App Example

A comprehensive example demonstrating advanced features of the Cloudflare Edge Toolkit.

## Features Demonstrated

- Multiple route handlers
- Authentication middleware
- CORS configuration
- Request logging
- Error handling
- CRUD operations with KV
- File upload/download with R2
- Path parameters
- Request body parsing

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure your `wrangler.toml`:
    - Set KV namespace IDs
    - Set R2 bucket names
    - Set JWT_SECRET

3. Run locally:

```bash
npx wrangler dev
```

4. Deploy:

```bash
npx wrangler deploy
```

## API Endpoints

### Public Routes

- `GET /` - Welcome message
- `POST /auth/login` - Login (username: admin, password: admin)

### Protected Routes (require authentication)

- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `DELETE /users/:id` - Delete user
- `POST /files` - Upload file
- `GET /files/:key` - Download file
- `DELETE /files/:key` - Delete file

## Authentication

Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```
