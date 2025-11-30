/// <reference types="@cloudflare/workers-types" />

/**
 * D1 (Database) service wrapper
 */

/**
 * Prepare a D1 statement
 */
export function prepareD1(
    database: D1Database,
    query: string,
): D1PreparedStatement {
    return database.prepare(query);
}

/**
 * Execute a D1 query
 */
export async function execD1(
    database: D1Database,
    query: string,
): Promise<D1ExecResult> {
    return database.exec(query);
}

/**
 * Execute a batch of D1 statements
 */
export async function batchD1(
    database: D1Database,
    statements: D1PreparedStatement[],
): Promise<D1Result[]> {
    return database.batch(statements);
}

/**
 * Execute a transaction
 * Note: D1 transactions use a callback pattern with a transaction object
 */
export async function transactionD1<T>(
    database: D1Database,
    callback: (tx: {
        prepare: (query: string) => D1PreparedStatement;
        exec: (query: string) => Promise<D1ExecResult>;
    }) => Promise<T>,
): Promise<T> {
    // D1 transactions work by passing a transaction object to the callback
    // The transaction object has prepare and exec methods
    // @ts-expect-error - D1Database.transaction exists but may not be in types
    return database.transaction(
        async (tx: {
            prepare: (query: string) => D1PreparedStatement;
            exec: (query: string) => Promise<D1ExecResult>;
        }) => {
            const txWrapper = {
                prepare: (query: string) => tx.prepare(query),
                exec: async (query: string) => {
                    return tx.exec(query);
                },
            };
            return callback(txWrapper);
        },
    );
}

/**
 * D1 service class (alternative API)
 */
export class D1Service {
    constructor(private database: D1Database) {}

    prepare(query: string): D1PreparedStatement {
        return prepareD1(this.database, query);
    }

    async exec(query: string): Promise<D1ExecResult> {
        return execD1(this.database, query);
    }

    async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
        return batchD1(this.database, statements);
    }

    async transaction<T>(
        callback: (tx: {
            prepare: (query: string) => D1PreparedStatement;
            exec: (query: string) => Promise<D1ExecResult>;
        }) => Promise<T>,
    ): Promise<T> {
        return transactionD1(this.database, callback);
    }
}
