CREATE TABLE "refresh_tokens" (
  "token" varchar(256) PRIMARY KEY NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "user_id" uuid NOT NULL,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);
