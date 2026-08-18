import { getSession } from "@/entities/viewer";
import { SiteHeader } from "@/widgets/site-header";
import { getDictionary } from "@/shared/lib/i18n-server";

export async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [session, dict] = await Promise.all([getSession(), getDictionary()]);

  return (
    <>
      <SiteHeader {...(session ? { user: session } : {})} dict={dict} />
      {children}
    </>
  );
}
