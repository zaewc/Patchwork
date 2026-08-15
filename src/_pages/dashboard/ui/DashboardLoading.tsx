import { SiteHeader } from "@/widgets/site-header";
import type { Dictionary } from "@/shared/lib/i18n";

function Block({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />
  );
}

/**
 * 데이터를 기다리는 동안 실제 화면과 같은 자리에 자리만 잡아 둔다.
 *
 * 라우트의 `loading.tsx`로 쓰일 때는 사전이 없다. 그 자리는 요청을 읽지 않고 미리
 * 그려 두는 껍데기라 쿠키를 볼 수 없어서, 머리도 빈 자리로 남긴다. 이미 그려진
 * 화면 안에서 다시 기다릴 때(`DashboardContent`)는 사전이 있으므로 머리를 그대로 둔다.
 */
export function DashboardLoading({ dict }: { dict?: Dictionary }) {
  return (
    <>
      {dict ? (
        <SiteHeader dict={dict} />
      ) : (
        <div className="h-14 border-b border-border bg-surface" />
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Block className="h-7 w-40" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Block key={i} className="h-18.5" />
          ))}
        </div>
        <Block className="mt-10 h-40" />
        <Block className="mt-10 h-56" />
      </main>
    </>
  );
}
