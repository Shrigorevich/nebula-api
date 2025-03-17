export interface AppConfiguration {
  redisConnection: RedisConnConfig;
  google: {
    credentialsFile: string;
  };
}

export interface RedisConnConfig {
  host: string;
  port: number;
}
