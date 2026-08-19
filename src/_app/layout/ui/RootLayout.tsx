import type { Metadata } from "next";
import { themeAttribute } from "@/shared/config";
import { getDictionary } from "@/shared/lib/i18n-server";
import { requestTheme } from "@/shared/lib/theme-server";
import "../../styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();
  return { title: metadata.title, description: metadata.description };
}

/**
 * 문서 껍데기. 화면을 세로로 채워 footer 없이도 배경이 끊기지 않게 한다.
 *
 * 고른 테마를 여기서 `data-theme`에 적는다. 스크립트가 켜진 뒤 색을 고치면 그 사이에
 * 반대 색이 한 번 번쩍이므로, 서버가 쿠키를 읽어 첫 HTML에 실어 보낸다. 고르지 않았으면
 * 속성이 없고, 그때는 CSS가 운영체제 설정을 따른다.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [dict, theme] = await Promise.all([getDictionary(), requestTheme()]);

  return (
    <html
      lang={dict.locale}
      data-theme={themeAttribute(theme)}
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
