import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { checkDatabaseConnection } = await import("../src/db/check-connection");
  const result = await checkDatabaseConnection({ includeErrorDetails: true });

  if (result.ok) {
    console.log(`OK: ${result.message}`);
    process.exit(0);
  }

  console.error(`FAIL: ${result.message}`);
  process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
