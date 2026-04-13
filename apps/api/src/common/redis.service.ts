import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memoryCache = new Map<string, { value: string; expiresAt: number }>();

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    if (url) {
      try {
        this.client = new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
          lazyConnect: true,
        });
        this.client.connect().catch((err) => {
          this.logger.warn(`Redis unavailable — falling back to in-memory cache: ${err.message}`);
          this.client = null;
        });
      } catch {
        this.logger.warn('Redis unavailable — using in-memory cache');
        this.client = null;
      }
    } else {
      this.logger.warn('No REDIS_URL — using in-memory cache');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        return this.memGet(key);
      }
    }
    return this.memGet(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.set(key, value);
        return;
      } catch { /* fallback */ }
    }
    this.memoryCache.set(key, { value, expiresAt: Date.now() + 3600_000 });
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.setex(key, seconds, value);
        return;
      } catch { /* fallback */ }
    }
    this.memoryCache.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch { /* fallback */ }
    }
    this.memoryCache.delete(key);
  }

  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.get(key);
    if (cached) return JSON.parse(cached) as T;
    const data = await fetcher();
    await this.setex(key, ttlSeconds, JSON.stringify(data));
    return data;
  }

  private memGet(key: string): string | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }
}
