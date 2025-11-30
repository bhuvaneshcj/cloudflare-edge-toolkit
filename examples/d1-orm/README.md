# D1 ORM Example

This example demonstrates the D1 ORM features from v1.2.0:

## Features Demonstrated

1. **Query Builder** - Fluent API for building SQL queries
2. **Model Class** - Base model with CRUD operations
3. **Migrations** - Database migration system
4. **Complex Queries** - Joins, where conditions, ordering
5. **Type Safety** - Full TypeScript support

## Setup

1. Create a D1 database:

```bash
npx wrangler d1 create my-database
```

2. Update `wrangler.toml` with your database ID

3. Run migrations:

```bash
# Start dev server
npx wrangler dev

# In another terminal, run migrations
curl -X POST http://localhost:8787/migrate
```

4. Test the API:

```bash
# Create user
curl -X POST http://localhost:8787/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get users
curl http://localhost:8787/users

# Get user by ID
curl http://localhost:8787/users/1
```

## API Endpoints

- `GET /users` - List users (with query builder)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /posts` - List posts with author (join example)
- `GET /users/count` - Count users
- `GET /users/search?q=john` - Search users
- `POST /migrate` - Run migrations

## Model Usage

```typescript
// Define model
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
```

## Query Builder Usage

```typescript
const users = await User.query()
    .select("id", "name")
    .where("age", ">", 18)
    .orderBy("name", "ASC")
    .limit(10)
    .all();
```
