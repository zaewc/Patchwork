import type { Metadata } from "next";
import { getDictionary } from "@/shared/lib/i18n-server";
import "../../styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();
  return { title: metadata.title, description: metadata.description };
}

/** 문서 껍데기. 화면을 세로로 채워 footer 없이도 배경이 끊기지 않게 한다. */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const dict = await getDictionary();

  return (
    <html lang={dict.locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
