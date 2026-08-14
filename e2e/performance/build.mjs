import { spawnSync } from "node:child_process";
import environment from "./environment.cjs";

const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  env: { ...process.env, ...environment.appEnv },
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
