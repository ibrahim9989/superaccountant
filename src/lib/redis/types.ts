/**
 * Redis Cache Types
 * Type definitions for Redis caching layer
 */

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
}

export type CacheKey = string

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl?: number
  tags?: string[]
}

