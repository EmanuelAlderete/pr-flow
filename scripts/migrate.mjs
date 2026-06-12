import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(sql);

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Database migrations applied.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await sql.end();
}
