import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";

type DbClient = ReturnType<typeof postgres>;
type Db = ReturnType<typeof createDbInstance>;

const globalForDb = globalThis as unknown as {
  __pamoPg?: DbClient;
  __pamoDb?: Db;
};

function createDbInstance(client: DbClient) {
  return drizzle(client, { schema });
}

/**
 * Server-only Drizzle client (singleton in Node).
 * Never import this module from Client Components.
 */
export function createDb() {
  if (globalForDb.__pamoDb) {
    return globalForDb.__pamoDb;
  }

  const { DATABASE_URL } = getServerEnv();
  // Small pool so dashboard Promise.all (counts + recent lists) can overlap.
  const client = postgres(DATABASE_URL, { prepare: false, max: 3 });
  const db = createDbInstance(client);

  globalForDb.__pamoPg = client;
  globalForDb.__pamoDb = db;

  return db;
}

export type { Db };
