import type { Metadata } from "next";
import { QueryProvider } from "@/_app/layout/ui/query-provider";
import "../../styles/globals.css";

export const metadata: Metadata = {
  title: "Patchwork",
  description: "GitHub 기여 내역과 진행 중인 PR 상태를 추적합니다.",
};

/** 문서 껍데기. 화면을 세로로 채워 footer 없이도 배경이 끊기지 않게 한다. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
