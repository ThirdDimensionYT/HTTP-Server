import path from "path";
import type { MigrationConfig } from "drizzle-orm/migrator";

export type APIConfig = {
  fileserverHits: number;
  platform: string;
  polkaKey: string;
};

export type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

export type AuthConfig = {
  jwtSecret: string;
};

export type AppConfig = {
  api: APIConfig;
  db: DBConfig;
  auth: AuthConfig;
};

function envOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

process.loadEnvFile();

export const config: AppConfig = {
  api: {
    fileserverHits: 0,
    platform: envOrThrow("PLATFORM"),
    polkaKey: envOrThrow("POLKA_KEY"),
  },
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: {
      migrationsFolder: path.resolve(process.cwd(), "src/db/migrations"),
    },
  },
  auth: {
    jwtSecret: envOrThrow("JWT_SECRET"),
  },
};
