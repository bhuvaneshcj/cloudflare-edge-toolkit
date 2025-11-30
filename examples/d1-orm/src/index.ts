import {
    Router,
    json,
    Model,
    QueryBuilder,
    MigrationRunner,
    createMigration,
    Relations,
} from "cloudflare-edge-toolkit";

// Define User Model
class User extends Model {
    static tableName = "users";
    id?: number;
    name?: string;
    email?: string;
    created_at?: string;
}

// Define Post Model
class Post extends Model {
    static tableName = "posts";
    id?: number;
    title?: string;
    content?: string;
    user_id?: number;
    created_at?: string;
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<Response> {
        // Set database for models
        User.setDatabase(env.DB);
        Post.setDatabase(env.DB);

        const app = new Router();

        // Example 1: Query Builder
        app.get("/users", async () => {
            const users = await User.query()
                .select("id", "name", "email")
                .where("id", ">", 0)
                .orderBy("created_at", "DESC")
                .limit(10)
                .all<User>();

            return json({ users: users.results || [] });
        });

        // Example 2: Model methods
        app.get("/users/:id", async (req) => {
            const id = parseInt(req.params?.id || "0");
            const user = await User.find<User>(id);
            if (!user) {
                return json({ error: "User not found" }, { status: 404 });
            }
            return json({ user });
        });

        // Example 3: Create record
        app.post("/users", async (req) => {
            const body = await req.json();
            const user = await User.create<User>({
                name: body.name,
                email: body.email,
            });
            return json({ user }, { status: 201 });
        });

        // Example 4: Update record
        app.put("/users/:id", async (req) => {
            const id = parseInt(req.params?.id || "0");
            const body = await req.json();
            await User.update(body, { id });
            const user = await User.find<User>(id);
            return json({ user });
        });

        // Example 5: Delete record
        app.delete("/users/:id", async (req) => {
            const id = parseInt(req.params?.id || "0");
            await User.delete({ id });
            return json({ message: "User deleted" });
        });

        // Example 6: Complex query
        app.get("/posts", async () => {
            const posts = await Post.query()
                .select("posts.*", "users.name as author_name")
                .innerJoin("users", "posts.user_id = users.id")
                .where(
                    "posts.created_at",
                    ">",
                    new Date(
                        Date.now() - 7 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                )
                .orderBy("posts.created_at", "DESC")
                .all();

            return json({ posts: posts.results || [] });
        });

        // Example 7: Count
        app.get("/users/count", async () => {
            const count = await User.count();
            return json({ count });
        });

        // Example 8: Where conditions
        app.get("/users/search", async (req) => {
            const query = req.query?.get("q") || "";
            const users = await User.where<User>("name", "LIKE", `%${query}%`);
            return json({ users });
        });

        // Example 9: Migrations endpoint (for development)
        app.post("/migrate", async () => {
            const runner = new MigrationRunner(env.DB);
            const migrations = [
                createMigration(
                    "001_create_users",
                    async (db) => {
                        await db.exec(`
                            CREATE TABLE IF NOT EXISTS users (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                name TEXT NOT NULL,
                                email TEXT UNIQUE NOT NULL,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                            )
                        `);
                    },
                    async (db) => {
                        await db.exec("DROP TABLE IF EXISTS users");
                    },
                ),
                createMigration(
                    "002_create_posts",
                    async (db) => {
                        await db.exec(`
                            CREATE TABLE IF NOT EXISTS posts (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                title TEXT NOT NULL,
                                content TEXT,
                                user_id INTEGER,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id)
                            )
                        `);
                    },
                    async (db) => {
                        await db.exec("DROP TABLE IF EXISTS posts");
                    },
                ),
            ];

            await runner.up(migrations);
            return json({ message: "Migrations completed" });
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
    DB: D1Database;
}
