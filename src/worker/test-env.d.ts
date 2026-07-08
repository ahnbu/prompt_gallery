import type { D1Migration } from "@cloudflare/vitest-pool-workers/config"
import type { WorkerEnv } from "./index"
import "@cloudflare/vitest-pool-workers"

declare module "cloudflare:test" {
  interface ProvidedEnv extends WorkerEnv {
    readonly TEST_MIGRATIONS: readonly D1Migration[]
  }
}
