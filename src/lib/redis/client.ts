/**
 * Redis Client Singleton
 * Manages connection to Upstash Redis
 */

import { Redis } from '@upstash/redis'

let redisClient: Redis | null = null

/**
 * Get or create Redis client instance
 * Returns null if Redis is not configured (graceful degradation)
 */
export function getRedisClient(): Redis | null {
  // Return existing client if already created
  if (redisClient) {
    return redisClient
  }

  // Check if Redis is configured
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('Redis not configured. Caching will be disabled.')
    return null
  }

  try {
    redisClient = new Redis({
      url,
      token,
    })
    console.log('Redis client initialized successfully')
    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    return null
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedisClient() !== null
}

/**
 * Reset Redis client (useful for testing)
 */
export function resetRedisClient(): void {
  redisClient = null
}

