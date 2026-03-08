import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(config: ConfigService) {
    super(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
  }

  async onModuleDestroy() {
    await this.quit();
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached) return JSON.parse(cached) as T;

    const data = await fetcher();
    await this.setex(key, ttlSeconds, JSON.stringify(data));
    return data;
  }
}
