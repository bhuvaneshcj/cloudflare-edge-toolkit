/// <reference types="@cloudflare/workers-types" />

/**
 * D1 Query Builder
 * Provides a fluent API for building SQL queries
 */
export class QueryBuilder {
    private selectFields: string[] = [];
    private fromTable: string = "";
    private whereConditions: Array<{
        field: string;
        operator: string;
        value: unknown;
    }> = [];
    private orderByFields: Array<{ field: string; direction: "ASC" | "DESC" }> =
        [];
    private limitValue: number | null = null;
    private offsetValue: number | null = null;
    private joins: Array<{ type: string; table: string; condition: string }> =
        [];
    private groupByFields: string[] = [];
    private havingConditions: Array<{
        field: string;
        operator: string;
        value: unknown;
    }> = [];

    constructor(private database: D1Database) {}

    /**
     * Select fields
     */
    select(...fields: string[]): this {
        this.selectFields = fields.length > 0 ? fields : ["*"];
        return this;
    }

    /**
     * From table
     */
    from(table: string): this {
        this.fromTable = table;
        return this;
    }

    /**
     * Where condition
     */
    where(field: string, operator: string, value: unknown): this;
    where(field: string, value: unknown): this;
    where(condition: string): this;
    where(...args: unknown[]): this {
        if (args.length === 1) {
            // Raw SQL condition
            this.whereConditions.push({
                field: args[0] as string,
                operator: "",
                value: null,
            });
        } else if (args.length === 2) {
            // field = value
            this.whereConditions.push({
                field: args[0] as string,
                operator: "=",
                value: args[1],
            });
        } else {
            // field operator value
            this.whereConditions.push({
                field: args[0] as string,
                operator: args[1] as string,
                value: args[2],
            });
        }
        return this;
    }

    /**
     * Where IN condition
     */
    whereIn(field: string, values: unknown[]): this {
        this.whereConditions.push({
            field,
            operator: "IN",
            value: values,
        });
        return this;
    }

    /**
     * Where NOT IN condition
     */
    whereNotIn(field: string, values: unknown[]): this {
        this.whereConditions.push({
            field,
            operator: "NOT IN",
            value: values,
        });
        return this;
    }

    /**
     * Where NULL condition
     */
    whereNull(field: string): this {
        this.whereConditions.push({
            field,
            operator: "IS NULL",
            value: null,
        });
        return this;
    }

    /**
     * Where NOT NULL condition
     */
    whereNotNull(field: string): this {
        this.whereConditions.push({
            field,
            operator: "IS NOT NULL",
            value: null,
        });
        return this;
    }

    /**
     * Order by
     */
    orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): this {
        this.orderByFields.push({ field, direction });
        return this;
    }

    /**
     * Limit
     */
    limit(count: number): this {
        this.limitValue = count;
        return this;
    }

    /**
     * Offset
     */
    offset(count: number): this {
        this.offsetValue = count;
        return this;
    }

    /**
     * Inner join
     */
    innerJoin(table: string, condition: string): this {
        this.joins.push({ type: "INNER", table, condition });
        return this;
    }

    /**
     * Left join
     */
    leftJoin(table: string, condition: string): this {
        this.joins.push({ type: "LEFT", table, condition });
        return this;
    }

    /**
     * Group by
     */
    groupBy(...fields: string[]): this {
        this.groupByFields = fields;
        return this;
    }

    /**
     * Having condition
     */
    having(field: string, operator: string, value: unknown): this {
        this.havingConditions.push({ field, operator, value });
        return this;
    }

    /**
     * Build SQL query
     */
    private buildQuery(): { sql: string; params: unknown[] } {
        const params: unknown[] = [];
        let sql = "SELECT ";

        // SELECT fields
        sql += this.selectFields.join(", ");

        // FROM table
        if (this.fromTable) {
            sql += ` FROM ${this.fromTable}`;
        }

        // JOINs
        for (const join of this.joins) {
            sql += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
        }

        // WHERE conditions
        if (this.whereConditions.length > 0) {
            sql += " WHERE ";
            const conditions: string[] = [];
            for (const condition of this.whereConditions) {
                if (condition.operator === "") {
                    // Raw SQL
                    conditions.push(condition.field);
                } else if (
                    condition.operator === "IN" ||
                    condition.operator === "NOT IN"
                ) {
                    const values = condition.value as unknown[];
                    const placeholders = values.map(() => "?").join(", ");
                    conditions.push(
                        `${condition.field} ${condition.operator} (${placeholders})`,
                    );
                    params.push(...values);
                } else if (
                    condition.operator === "IS NULL" ||
                    condition.operator === "IS NOT NULL"
                ) {
                    conditions.push(`${condition.field} ${condition.operator}`);
                } else {
                    conditions.push(
                        `${condition.field} ${condition.operator} ?`,
                    );
                    params.push(condition.value);
                }
            }
            sql += conditions.join(" AND ");
        }

        // GROUP BY
        if (this.groupByFields.length > 0) {
            sql += ` GROUP BY ${this.groupByFields.join(", ")}`;
        }

        // HAVING
        if (this.havingConditions.length > 0) {
            sql += " HAVING ";
            const conditions: string[] = [];
            for (const condition of this.havingConditions) {
                conditions.push(`${condition.field} ${condition.operator} ?`);
                params.push(condition.value);
            }
            sql += conditions.join(" AND ");
        }

        // ORDER BY
        if (this.orderByFields.length > 0) {
            sql += " ORDER BY ";
            sql += this.orderByFields
                .map((f) => `${f.field} ${f.direction}`)
                .join(", ");
        }

        // LIMIT
        if (this.limitValue !== null) {
            sql += ` LIMIT ${this.limitValue}`;
        }

        // OFFSET
        if (this.offsetValue !== null) {
            sql += ` OFFSET ${this.offsetValue}`;
        }

        return { sql, params };
    }

    /**
     * Execute query and get all results
     */
    async all<T = unknown>(): Promise<D1Result<T>> {
        const { sql, params } = this.buildQuery();
        const stmt = this.database.prepare(sql);
        if (params.length > 0) {
            return stmt.bind(...params).all<T>();
        }
        return stmt.all<T>();
    }

    /**
     * Execute query and get first result
     */
    async first<T = unknown>(): Promise<T | null> {
        const { sql, params } = this.buildQuery();
        const stmt = this.database.prepare(sql);
        if (params.length > 0) {
            const result = await stmt.bind(...params).first<T>();
            return result || null;
        }
        const result = await stmt.first<T>();
        return result || null;
    }

    /**
     * Execute query and get raw result
     */
    async run(): Promise<D1ExecResult> {
        const { sql, params } = this.buildQuery();
        const stmt = this.database.prepare(sql);
        let boundStmt = stmt;
        if (params.length > 0) {
            boundStmt = stmt.bind(...params);
        }
        const result = await boundStmt.run();
        // run() returns D1ExecResult
        return result as unknown as D1ExecResult;
    }

    /**
     * Get SQL string (for debugging)
     */
    toSQL(): string {
        return this.buildQuery().sql;
    }
}
