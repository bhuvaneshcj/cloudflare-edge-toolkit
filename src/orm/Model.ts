/// <reference types="@cloudflare/workers-types" />

import { QueryBuilder } from "./QueryBuilder.js";

/**
 * Base Model class for D1 ORM
 */
export abstract class Model {
    static tableName: string = "";
    static database: D1Database | null = null;

    /**
     * Set the database for this model
     */
    static setDatabase(database: D1Database): void {
        this.database = database;
    }

    /**
     * Get query builder for this model
     */
    static query(): QueryBuilder {
        if (!this.database) {
            throw new Error(
                "Database not set. Call Model.setDatabase() first.",
            );
        }
        const builder = new QueryBuilder(this.database);
        if (this.tableName) {
            builder.from(this.tableName);
        }
        return builder;
    }

    /**
     * Find all records
     */
    static async all<T extends Model>(): Promise<T[]> {
        const result = await this.query().all<T>();
        return result.results || [];
    }

    /**
     * Find record by ID
     */
    static async find<T extends Model>(id: unknown): Promise<T | null> {
        const result = await this.query().where("id", id).first<T>();
        return result;
    }

    /**
     * Find first record matching conditions
     */
    static async findWhere<T extends Model>(
        field: string,
        value: unknown,
    ): Promise<T | null> {
        const result = await this.query().where(field, value).first<T>();
        return result;
    }

    /**
     * Find all records matching conditions
     */
    static async where<T extends Model>(
        field: string,
        operator: string,
        value: unknown,
    ): Promise<T[]>;
    static async where<T extends Model>(
        field: string,
        value: unknown,
    ): Promise<T[]>;
    static async where<T extends Model>(...args: unknown[]): Promise<T[]> {
        const builder = this.query();
        if (args.length === 2) {
            builder.where(args[0] as string, args[1]);
        } else {
            builder.where(args[0] as string, args[1] as string, args[2]);
        }
        const result = await builder.all<T>();
        return result.results || [];
    }

    /**
     * Create a new record
     */
    static async create<T extends Model>(data: Partial<T>): Promise<T> {
        if (!this.database) {
            throw new Error(
                "Database not set. Call Model.setDatabase() first.",
            );
        }
        if (!this.tableName) {
            throw new Error("Table name not set.");
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => "?").join(", ");

        const sql = `INSERT INTO ${this.tableName} (${fields.join(", ")}) VALUES (${placeholders})`;
        const stmt = this.database.prepare(sql);
        await stmt.bind(...values).run();

        // Get the last inserted ID
        const lastIdResult = await this.database
            .prepare("SELECT last_insert_rowid() as id")
            .first<{ id: number }>();

        if (lastIdResult) {
            return (await this.find<T>(lastIdResult.id)) as T;
        }

        return data as T;
    }

    /**
     * Update records
     */
    static async update(
        data: Record<string, unknown>,
        where: Record<string, unknown>,
    ): Promise<D1ExecResult> {
        if (!this.database) {
            throw new Error(
                "Database not set. Call Model.setDatabase() first.",
            );
        }
        if (!this.tableName) {
            throw new Error("Table name not set.");
        }

        const setFields = Object.keys(data);
        const setValues = Object.values(data);
        const whereFields = Object.keys(where);
        const whereValues = Object.values(where);

        const setClause = setFields.map((f) => `${f} = ?`).join(", ");
        const whereClause = whereFields.map((f) => `${f} = ?`).join(" AND ");

        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;
        const stmt = this.database.prepare(sql);
        const boundStmt = stmt.bind(...setValues, ...whereValues);
        const result = await boundStmt.run();
        return result as unknown as D1ExecResult;
    }

    /**
     * Delete records
     */
    static async delete(where: Record<string, unknown>): Promise<D1ExecResult> {
        if (!this.database) {
            throw new Error(
                "Database not set. Call Model.setDatabase() first.",
            );
        }
        if (!this.tableName) {
            throw new Error("Table name not set.");
        }

        const whereFields = Object.keys(where);
        const whereValues = Object.values(where);
        const whereClause = whereFields.map((f) => `${f} = ?`).join(" AND ");

        const sql = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
        const stmt = this.database.prepare(sql);
        const boundStmt = stmt.bind(...whereValues);
        const result = await boundStmt.run();
        return result as unknown as D1ExecResult;
    }

    /**
     * Count records
     */
    static async count(where?: Record<string, unknown>): Promise<number> {
        const builder = this.query().select("COUNT(*) as count");
        if (where) {
            for (const [field, value] of Object.entries(where)) {
                builder.where(field, value);
            }
        }
        const result = await builder.first<{ count: number }>();
        return result?.count || 0;
    }
}
