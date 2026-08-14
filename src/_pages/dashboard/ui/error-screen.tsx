import { SiteHeader } from "@/widgets/site-header";

/** 대시보드를 아예 그릴 수 없을 때의 화면. 무엇이 잘못됐고 다음에 무엇을 누를지만 남긴다. */
export function ErrorScreen({
  title,
  body,
  action,
  href,
}: {
  title: string;
  body: string;
  action: string;
  href: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-24 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        <a
          href={href}
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {action}
        </a>
      </main>
    </>
  );
}
