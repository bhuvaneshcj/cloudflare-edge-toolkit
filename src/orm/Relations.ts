/// <reference types="@cloudflare/workers-types" />

import { Model } from "./Model.js";
import { QueryBuilder } from "./QueryBuilder.js";

/**
 * Relationship types
 */
export type RelationshipType = "hasOne" | "hasMany" | "belongsTo";

/**
 * Relationship definition
 */
export interface Relationship {
    type: RelationshipType;
    model: typeof Model;
    foreignKey?: string;
    localKey?: string;
}

/**
 * Relationship helpers for models
 */
export class Relations {
    /**
     * Has one relationship
     */
    static hasOne<T extends Model>(
        model: typeof Model,
        foreignKey?: string,
        localKey: string = "id",
    ): (instance: T) => Promise<InstanceType<typeof model> | null> {
        return async (instance: T) => {
            const fk = foreignKey || `${this.getModelName(instance)}_id`;
            const value = (instance as Record<string, unknown>)[localKey];
            return model.findWhere(fk, value) as Promise<InstanceType<
                typeof model
            > | null>;
        };
    }

    /**
     * Has many relationship
     */
    static hasMany<T extends Model>(
        model: typeof Model,
        foreignKey?: string,
        localKey: string = "id",
    ): (instance: T) => Promise<InstanceType<typeof model>[]> {
        return async (instance: T) => {
            const fk = foreignKey || `${this.getModelName(instance)}_id`;
            const value = (instance as Record<string, unknown>)[localKey];
            return model.where(fk, value) as Promise<
                InstanceType<typeof model>[]
            >;
        };
    }

    /**
     * Belongs to relationship
     */
    static belongsTo<T extends Model>(
        model: typeof Model,
        foreignKey?: string,
    ): (instance: T) => Promise<InstanceType<typeof model> | null> {
        return async (instance: T) => {
            const fk = foreignKey || `${this.getModelName(model)}_id`;
            const value = (instance as Record<string, unknown>)[fk];
            if (!value) {
                return null;
            }
            return model.find(value) as Promise<InstanceType<
                typeof model
            > | null>;
        };
    }

    /**
     * Get model name from instance or class
     */
    private static getModelName(modelOrInstance: typeof Model | Model): string {
        if (typeof modelOrInstance === "function") {
            return modelOrInstance.name.toLowerCase();
        }
        return modelOrInstance.constructor.name.toLowerCase();
    }
}

/**
 * Eager load relationships
 */
export async function withRelations<T extends Model>(
    instances: T[],
    relations: Record<string, (instance: T) => Promise<unknown>>,
): Promise<T[]> {
    for (const instance of instances) {
        for (const [key, loader] of Object.entries(relations)) {
            (instance as Record<string, unknown>)[key] = await loader(instance);
        }
    }
    return instances;
}
