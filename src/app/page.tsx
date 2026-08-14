import { redirect } from "next/navigation";
import { Logo, SiteHeader } from "@/components/site-header";
import { getSession, isConfigured } from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "GitHub OAuth 환경변수가 설정되지 않았습니다.",
  access_denied: "GitHub 로그인이 취소되었습니다.",
  invalid_state: "로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
  token_exchange_failed: "토큰 교환에 실패했습니다. Client ID/Secret을 확인해 주세요.",
  identity_failed: "GitHub 사용자 정보를 가져오지 못했습니다.",
};

export default async function HomePage({ searchParams }: PageProps<"/">) {
  if (await getSession()) redirect("/dashboard");

  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : undefined;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-24 text-center">
        <Logo size={40} />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          오픈소스 기여를 한 장의 Patchwork로
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          GitHub contribution과 진행 중인 pull request 상태를 한 화면에서 추적합니다.
        </p>

        {errorKey ? (
          <p className="mt-6 w-full rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
            {ERROR_MESSAGES[errorKey] ?? "로그인 중 문제가 발생했습니다."}
          </p>
        ) : null}

        {isConfigured() ? (
          <a
            href="/api/auth/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            Sign in with GitHub
          </a>
        ) : (
          <ol className="mt-8 w-full list-decimal space-y-1.5 rounded-xl border border-border bg-surface p-5 pl-9 text-left text-sm text-muted">
            <li>GitHub → Settings → Developer settings → OAuth Apps 에서 앱을 만듭니다.</li>
            <li>
              Authorization callback URL 을{" "}
              <code className="font-mono text-xs">http://localhost:3000/api/auth/callback</code> 으로
              지정합니다.
            </li>
            <li>
              <code className="font-mono text-xs">.env.example</code> 을{" "}
              <code className="font-mono text-xs">.env.local</code> 로 복사해 값을 채웁니다.
            </li>
          </ol>
        )}
      </main>
    </>
  );
}
