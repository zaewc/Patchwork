import { getSession } from "@/entities/viewer";
import { SiteHeader } from "@/widgets/site-header";
import { getDictionary } from "@/shared/lib/i18n-server";
import { requestTheme } from "@/shared/lib/theme-server";

export async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [session, dict, theme] = await Promise.all([
    getSession(),
    getDictionary(),
    requestTheme(),
  ]);

  return (
    <>
      <SiteHeader
        {...(session ? { user: session } : {})}
        theme={theme}
        dict={dict}
        active="dashboard"
      />
      {children}
    </>
  );
}
