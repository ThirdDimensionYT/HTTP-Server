import express from "express";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { config } from "./config.js";
import { handlerReadiness } from "./api/readiness.js";
import { handlerAdminMetrics } from "./api/hits.js";
import { handlerReset } from "./api/reset.js";
import {
  handlerCreateChirp,
  handlerDeleteChirp,
  handlerGetAllChirps,
  handlerGetChirpById,
} from "./api/chirps.js";
import { handlerCreateUser, handlerUpdateUser } from "./api/users.js";
import { handlerLogin } from "./api/login.js";
import { handlerRefresh, handlerRevoke } from "./api/refresh.js";
import { handlerPolkaWebhook } from "./api/polka.js";
import {
  middlewareCountFileServerHits,
  middlewareLogResponse,
  middlewareHandleErrors,
} from "./api/middleware.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

async function ensureHashedPasswordColumn(client: typeof migrationClient) {
  const result = await client`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'hashed_password'
    LIMIT 1;
  `;

  if (result.length === 0) {
    console.log('Applying fallback migration for users.hashed_password');
    await client`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "hashed_password" varchar(256) NOT NULL DEFAULT 'unset';
    `;
  }
}

await ensureHashedPasswordColumn(migrationClient);

const app = express();
const PORT = 8080;

app.use(middlewareLogResponse);
app.use(express.json());
app.use("/app", middlewareCountFileServerHits);
app.use("/app", express.static("./src/app"));

app.get("/api/healthz", handlerReadiness);
app.get("/api/chirps/:chirpId", handlerGetChirpById);
app.get("/api/chirps", handlerGetAllChirps);
app.post("/api/chirps", handlerCreateChirp);
app.delete("/api/chirps/:chirpId", handlerDeleteChirp);
app.post("/api/users", handlerCreateUser);
app.put("/api/users", handlerUpdateUser);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);
app.post("/api/polka/webhooks", handlerPolkaWebhook);
app.get("/admin/metrics", handlerAdminMetrics);
app.post("/admin/reset", handlerReset);

app.use(middlewareHandleErrors);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
