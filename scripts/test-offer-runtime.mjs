// PostgreSQL WASM test fallback for containers that cannot switch OS users.
// All schema, RLS and PL/pgSQL are real PostgreSQL; connections are serialized.
import { createRequire } from "node:module";
import { resolve, join } from "node:path";
export async function startTestDb(runtimeDirectory) {
  const require = createRequire(
    join(resolve(runtimeDirectory), "package.json"),
  );
  const { PGlite } = require("@electric-sql/pglite");
  const db = new PGlite();
  await db.waitReady;
  let queue = Promise.resolve();
  class Client {
    async connect() {}
    async end() {}
    async query(sql, values) {
      const command = sql.trim().toLowerCase();
      if (command === "begin") {
        const previous = queue;
        queue = new Promise((done) => {
          this.release = done;
        });
        await previous;
      }
      try {
        let result;
        if (values) result = await db.query(sql, values);
        else {
          const results = await db.exec(sql);
          result = results[results.length - 1] ?? { rows: [] };
        }
        return {
          ...result,
          rowCount: result.rows?.length || result.affectedRows || 0,
        };
      } finally {
        if (command === "commit" || command === "rollback") {
          this.release?.();
          this.release = null;
        }
      }
    }
  }
  return {
    connectionString: "postgresql://localhost/test",
    Client,
    close: () => db.close(),
    database: db,
  };
}
