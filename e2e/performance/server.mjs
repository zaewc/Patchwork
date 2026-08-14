import { spawn } from "node:child_process";
import environment from "./environment.cjs";

const { APP_PORT, MOCK_PORT, APP_URL, MOCK_GITHUB_URL, AVATAR_URL, appEnv, sessionCookie } =
  environment;
const children = [];
let stopping = false;

function run(command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "inherit", "inherit"],
  });
  children.push(child);

  child.once("exit", (code, signal) => {
    if (stopping) return;
    stopping = true;
    console.error(
      `[performance] ${command} 종료: ${signal ? `signal ${signal}` : `code ${code}`}`,
    );
    for (const running of children) {
      if (running !== child) running.kill("SIGTERM");
    }
    process.exitCode = 1;
  });
}

async function waitUntilReady(url) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // 서버가 listen을 시작할 때까지 재시도한다.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`서버 준비 시간을 초과했습니다: ${url}`);
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));

run(process.execPath, ["e2e/mock-github/server.mjs"], {
  MOCK_GITHUB_PORT: String(MOCK_PORT),
  MOCK_AVATAR_URL: AVATAR_URL,
});
run(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(APP_PORT)], appEnv);

try {
  await Promise.all([waitUntilReady(`${MOCK_GITHUB_URL}/__scenario`), waitUntilReady(APP_URL)]);
  const headers = { Cookie: `pw_session=${sessionCookie()}` };
  const warmups = await Promise.all([
    fetch(`${APP_URL}/dashboard`, { headers }),
    fetch(`${APP_URL}/export`, { headers }),
  ]);
  if (warmups.some((response) => !response.ok)) {
    throw new Error("성능 측정 경로를 준비하지 못했습니다.");
  }
  console.log("[performance] servers ready");
} catch (error) {
  console.error(error);
  stop("SIGTERM");
  process.exitCode = 1;
}
