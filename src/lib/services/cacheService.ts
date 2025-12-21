/**
 * Cache Service
 * Abstraction layer for Redis caching with TTL management and invalidation
 */

import { getRedisClient, isRedisAvailable } from '@/lib/redis/client'
import type { CacheOptions, CacheEntry } from '@/lib/redis/types'

export class CacheService {
  private readonly defaultTTL = 3600 // 1 hour in seconds
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  }

  /**
   * Get cached data by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    const client = getRedisClient()
    if (!client) {
      this.stats.misses++
      return null
    }

    try {
      const cached = await client.get<CacheEntry<T>>(key)
      
      if (cached) {
        // Check if entry has expired
        if (cached.ttl && cached.timestamp) {
          const age = (Date.now() - cached.timestamp) / 1000
          if (age > cached.ttl) {
            // Entry expired, delete it
            await this.delete(key)
            this.stats.misses++
            return null
          }
        }
        
        this.stats.hits++
        return cached.data
      }
      
      this.stats.misses++
      return null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Set cached data with optional TTL
   */
  async set<T = any>(
    key: string,
    data: T,
    options?: CacheOptions
  ): Promise<boolean> {
    const client = getRedisClient()
    if (!client) {
      return false
    }

    try {
      const ttl = options?.ttl ?? this.defaultTTL
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        tags: options?.tags,
      }

      await client.set(key, entry, { ex: ttl })
      this.stats.sets++
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete cached data by key
   */
  async delete(key: string): Promise<boolean> {
    const client = getRedisClient()
    if (!client) {
      return false
    }

    try {
      await client.del(key)
      this.stats.deletes++
      return true
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const client = getRedisClient()
    if (!client) {
      return 0
    }

    try {
      // Get all keys matching pattern
      const keys = await client.keys(pattern)
      if (keys.length === 0) {
        return 0
      }

      // Delete all matching keys
      const deleted = await client.del(...keys)
      this.stats.deletes += deleted
      return deleted
    } catch (error) {
      console.error(`Cache deletePattern error for pattern ${pattern}:`, error)
      return 0
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (tags.length === 0) return 0

    const client = getRedisClient()
    if (!client) {
      return 0
    }

    try {
      let totalDeleted = 0
      // For each tag, delete keys matching the tag pattern
      for (const tag of tags) {
        const pattern = `*:${tag}:*`
        const deleted = await this.deletePattern(pattern)
        totalDeleted += deleted
      }
      return totalDeleted
    } catch (error) {
      console.error(`Cache invalidateByTags error:`, error)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient()
    if (!client) {
      return false
    }

    try {
      const result = await client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0,
      isAvailable: isRedisAvailable(),
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<boolean> {
    const client = getRedisClient()
    if (!client) {
      return false
    }

    try {
      await client.flushdb()
      this.stats.deletes++
      return true
    } catch (error) {
      console.error('Cache clearAll error:', error)
      return false
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

/**
 * Cache key generators
 */
export const cacheKeys = {
  course: {
    list: (filters?: string) => `course:list:${filters || 'all'}`,
    detail: (id: string) => `course:${id}:full`,
    modules: (id: string) => `course:${id}:modules`,
  },
  lesson: {
    content: (id: string) => `lesson:${id}:content`,
    full: (id: string) => `lesson:${id}:full`,
  },
  grandtest: {
    questions: (courseId: string) => `grandtest:questions:${courseId}`,
    attempt: (attemptId: string) => `grandtest:attempt:${attemptId}`,
  },
  enrollment: {
    structure: (id: string) => `enrollment:${id}:structure`,
    progress: (id: string) => `enrollment:${id}:progress`,
  },
  admin: {
    enrollments: 'admin:enrollments:list',
    stats: 'admin:stats:summary',
  },
}

