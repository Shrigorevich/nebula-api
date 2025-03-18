export interface AppConfiguration {
  redisConnection: RedisConnConfig;
  pgConnection: PgConnection;
  google: {
    credentialsFile: string;
  };
  chunkSize: number;
}

export interface RedisConnConfig {
  host: string;
  port: number;
}

export interface PgConnection {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}
