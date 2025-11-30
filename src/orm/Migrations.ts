/// <reference types="@cloudflare/workers-types" />

/**
 * Migration interface
 */
export interface Migration {
    up(database: D1Database): Promise<void>;
    down(database: D1Database): Promise<void>;
}

/**
 * Migration runner
 */
export class MigrationRunner {
    constructor(private database: D1Database) {
        this.initMigrationsTable();
    }

    /**
     * Initialize migrations table
     */
    private async initMigrationsTable(): Promise<void> {
        await this.database.exec(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Run migrations
     */
    async up(
        migrations: Array<{ name: string; migration: Migration }>,
    ): Promise<void> {
        for (const { name, migration } of migrations) {
            // Check if migration already ran
            const existing = await this.database
                .prepare("SELECT id FROM _migrations WHERE name = ?")
                .bind(name)
                .first<{ id: number }>();

            if (existing) {
                console.log(`Migration ${name} already executed, skipping...`);
                continue;
            }

            try {
                console.log(`Running migration: ${name}`);
                await migration.up(this.database);

                // Record migration
                await this.database
                    .prepare("INSERT INTO _migrations (name) VALUES (?)")
                    .bind(name)
                    .run();

                console.log(`Migration ${name} completed successfully`);
            } catch (error) {
                console.error(`Migration ${name} failed:`, error);
                throw error;
            }
        }
    }

    /**
     * Rollback migrations
     */
    async down(
        migrations: Array<{ name: string; migration: Migration }>,
    ): Promise<void> {
        // Run in reverse order
        for (let i = migrations.length - 1; i >= 0; i--) {
            const { name, migration } = migrations[i];

            // Check if migration was executed
            const existing = await this.database
                .prepare("SELECT id FROM _migrations WHERE name = ?")
                .bind(name)
                .first<{ id: number }>();

            if (!existing) {
                console.log(`Migration ${name} not found, skipping...`);
                continue;
            }

            try {
                console.log(`Rolling back migration: ${name}`);
                await migration.down(this.database);

                // Remove migration record
                await this.database
                    .prepare("DELETE FROM _migrations WHERE name = ?")
                    .bind(name)
                    .run();

                console.log(`Migration ${name} rolled back successfully`);
            } catch (error) {
                console.error(`Rollback of ${name} failed:`, error);
                throw error;
            }
        }
    }

    /**
     * Get executed migrations
     */
    async executed(): Promise<string[]> {
        const result = await this.database
            .prepare("SELECT name FROM _migrations ORDER BY executed_at")
            .all<{ name: string }>();

        return result.results?.map((r) => r.name) || [];
    }
}

/**
 * Create a migration
 */
export function createMigration(
    name: string,
    up: (database: D1Database) => Promise<void>,
    down: (database: D1Database) => Promise<void>,
): { name: string; migration: Migration } {
    return {
        name,
        migration: {
            up,
            down,
        },
    };
}
