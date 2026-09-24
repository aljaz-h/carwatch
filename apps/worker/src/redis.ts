import { Redis } from "ioredis";
import { env } from "./env";

export function createRedisConnection() {
  return new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
  });
}

export type RedisConnection = InstanceType<typeof Redis>;
