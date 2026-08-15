import { redirect } from "next/navigation";
import { GitHubMark } from "@/_pages/home/ui/github-mark";
import { OAuthSetupGuide } from "@/_pages/home/ui/oauth-setup-guide";
import { loginErrorMessage } from "@/_pages/home/model/login-errors";
import { getSession } from "@/entities/viewer";
import { Logo, SiteHeader } from "@/widgets/site-header";
import { ROUTES, isOAuthConfigured } from "@/shared/config";
import { Banner } from "@/shared/ui/banner";

export async function HomePage({ searchParams }: PageProps<"/">) {
  if (await getSession()) redirect(ROUTES.dashboard);

  const params = await searchParams;
  const error = loginErrorMessage(params.error);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-24 text-center">
        <Logo size={40} />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          오픈소스 기여를 한 장의 Patchwork로
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          GitHub contribution과 진행 중인 pull request 상태를 추적합니다.
        </p>

        {error ? (
          <Banner tone="danger" className="mt-6 w-full">
            {error}
          </Banner>
        ) : null}

        {isOAuthConfigured() ? (
          <a
            href={ROUTES.login}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <GitHubMark />
            Sign in with GitHub
          </a>
        ) : (
          <OAuthSetupGuide />
        )}
      </main>
    </>
  );
}
