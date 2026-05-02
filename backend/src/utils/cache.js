const logger = require('../utils/logger');

/**
 * A lightweight, in-process cache backed by a plain Map.
 * This is the default cache used when Redis is NOT configured.
 *
 * For production, see cache.js which transparently switches to Redis
 * when REDIS_URL is present in the environment.
 */
class MemoryCache {
  constructor() {
    this._store = new Map();
    this._timers = new Map();
    logger.info('Cache: using in-memory store (no Redis)');
  }

  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    return entry;
  }

  async set(key, value, ttlSeconds = 60) {
    this._store.set(key, value);
    // Clear existing timer
    if (this._timers.has(key)) clearTimeout(this._timers.get(key));
    const timer = setTimeout(() => {
      this._store.delete(key);
      this._timers.delete(key);
    }, ttlSeconds * 1000);
    // Don't prevent process exit
    if (timer.unref) timer.unref();
    this._timers.set(key, timer);
  }

  async del(key) {
    if (this._timers.has(key)) {
      clearTimeout(this._timers.get(key));
      this._timers.delete(key);
    }
    this._store.delete(key);
  }

  async delPattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this._store.keys()) {
      if (regex.test(key)) await this.del(key);
    }
  }

  async flush() {
    for (const timer of this._timers.values()) clearTimeout(timer);
    this._store.clear();
    this._timers.clear();
  }
}

/**
 * Thin Redis adapter with the same interface as MemoryCache.
 * Only instantiated when REDIS_URL env var is set.
 */
class RedisCache {
  constructor(client) {
    this._client = client;
    logger.info('Cache: using Redis store');
  }

  async get(key) {
    const data = await this._client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  async set(key, value, ttlSeconds = 60) {
    const serialized = JSON.stringify(value);
    await this._client.set(key, serialized, { EX: ttlSeconds });
  }

  async del(key) {
    await this._client.del(key);
  }

  async delPattern(pattern) {
    const keys = await this._client.keys(pattern);
    if (keys.length) await this._client.del(keys);
  }

  async flush() {
    await this._client.flushDb();
  }
}

// ── Singleton factory ────────────────────────────────────────────────────────

let cacheInstance = null;

const getCache = async () => {
  if (cacheInstance) return cacheInstance;

  if (process.env.REDIS_URL) {
    try {
      const { createClient } = require('redis');
      const client = createClient({ url: process.env.REDIS_URL });
      client.on('error', (err) => logger.error('Redis client error', { error: err.message }));
      await client.connect();
      cacheInstance = new RedisCache(client);
    } catch (err) {
      logger.warn(`Redis connection failed (${err.message}). Falling back to in-memory cache.`);
      cacheInstance = new MemoryCache();
    }
  } else {
    cacheInstance = new MemoryCache();
  }

  return cacheInstance;
};

// ── Cache middleware factory ─────────────────────────────────────────────────

/**
 * Express middleware that caches GET responses.
 * Cache key: `prefix:url` (e.g. "products:/api/v1/products?page=1")
 *
 * @param {string} prefix  - Namespace (e.g. 'products', 'analytics')
 * @param {number} [ttl=60] - TTL in seconds
 * @returns {import('express').RequestHandler}
 */
const cacheMiddleware = (prefix, ttl = 60) => async (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') return next();

  try {
    const cache = await getCache();
    const key = `${prefix}:${req.originalUrl}`;
    const cached = await cache.get(key);

    if (cached) {
      logger.debug('Cache HIT', { key });
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    // Intercept res.json() to store the response in cache
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode === 200) {
        await cache.set(key, body, ttl);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(body);
    };
  } catch (err) {
    logger.warn('Cache middleware error — bypassing cache', { error: err.message });
  }

  return next();
};

/**
 * Invalidate all cache keys matching a prefix pattern.
 * Call this in mutation routes (POST/PUT/DELETE).
 *
 * @param {string} prefix
 * @returns {Promise<void>}
 */
const invalidateCache = async (prefix) => {
  try {
    const cache = await getCache();
    await cache.delPattern(`${prefix}:*`);
    logger.debug('Cache invalidated', { prefix });
  } catch (err) {
    logger.warn('Cache invalidation error', { error: err.message });
  }
};

module.exports = { getCache, cacheMiddleware, invalidateCache };
