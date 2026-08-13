import { redirect } from "next/navigation";
import { Logo, SiteHeader } from "@/components/site-header";
import { getSession, isConfigured } from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "GitHub OAuth 환경변수가 아직 설정되지 않았습니다.",
  access_denied: "GitHub 로그인이 취소되었습니다.",
  invalid_state: "로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
  token_exchange_failed: "GitHub 토큰 교환에 실패했습니다. Client ID/Secret을 확인해 주세요.",
  identity_failed: "GitHub 사용자 정보를 가져오지 못했습니다.",
  session_expired: "세션이 만료되었습니다. 다시 로그인해 주세요.",
};

const FEATURES = [
  {
    title: "기여 조각보",
    body: "커밋·PR·리뷰·이슈를 하루 단위 조각으로 이어 붙여, 어느 기간에 무엇을 했는지 한눈에 보여줍니다.",
  },
  {
    title: "외부 저장소 분리 집계",
    body: "내 저장소와 남의 저장소 기여를 나눠 계산합니다. 진짜 오픈소스 기여가 얼마나 되는지 알 수 있습니다.",
  },
  {
    title: "PR 상태 보드",
    body: "열린 PR을 변경 요청 / 리뷰 대기 / 승인됨 / 초안으로 분류하고, 2주 넘게 멈춘 PR을 표시합니다.",
  },
];

export default async function HomePage({ searchParams }: PageProps<"/">) {
  if (await getSession()) redirect("/dashboard");

  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const configured = isConfigured();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="quilt-backdrop border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
            <div className="flex justify-center">
              <Logo size={48} />
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              오픈소스 기여를 한 장의 조각보로
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
              Patchwork는 GitHub 기여 내역과 진행 중인 PR 상태를 모아 보여주는 트래커입니다.
              흩어진 기여 조각을 이어 붙여 흐름을 확인하세요.
            </p>

            {errorKey ? (
              <p className="mx-auto mt-6 max-w-md rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                {ERROR_MESSAGES[errorKey] ?? "로그인 중 문제가 발생했습니다."}
              </p>
            ) : null}

            {configured ? (
              <a
                href="/api/auth/login"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                GitHub 계정으로 시작하기
              </a>
            ) : (
              <div className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-surface p-5 text-left text-sm">
                <p className="font-medium">먼저 GitHub OAuth 앱을 연결하세요</p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
                  <li>
                    GitHub → Settings → Developer settings → OAuth Apps 에서 새 앱을 만듭니다.
                  </li>
                  <li>
                    Authorization callback URL 을{" "}
                    <code className="rounded bg-surface-2 px-1 font-mono text-xs">
                      http://localhost:3000/api/auth/callback
                    </code>{" "}
                    으로 지정합니다.
                  </li>
                  <li>
                    <code className="rounded bg-surface-2 px-1 font-mono text-xs">.env.example</code>{" "}
                    을 <code className="rounded bg-surface-2 px-1 font-mono text-xs">.env.local</code>{" "}
                    로 복사하고 값을 채운 뒤 서버를 다시 시작합니다.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-border bg-surface p-5">
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        Patchwork · GitHub GraphQL API 기반
      </footer>
    </>
  );
}
