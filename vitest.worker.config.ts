import path from "node:path"
import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig(async () => {
  const migrationsPath = path.join(__dirname, "migrations")
  const migrations = await readD1Migrations(migrationsPath)

  return {
    test: {
      pool: "@cloudflare/vitest-pool-workers",
      poolOptions: {
        workers: {
          wrangler: {
            configPath: "./wrangler.jsonc",
          },
          miniflare: {
            bindings: {
              TEST_MIGRATIONS: migrations,
            },
          },
        },
      },
      include: ["src/worker/**/*.test.ts"],
      setupFiles: ["./src/worker/apply-migrations.test-support.ts"],
    },
  }
})
