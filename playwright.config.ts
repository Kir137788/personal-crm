import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";
const databaseURL = "postgres://postgres@127.0.0.1:5433/personal_crm_e2e";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `DATABASE_URL=${databaseURL} pnpm db:migrate && pnpm build && DATABASE_URL=${databaseURL} pnpm exec next start --hostname 127.0.0.1 --port 3100`,
    url: `${baseURL}/health`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
