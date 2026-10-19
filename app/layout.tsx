import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSS Agent · Content Screening System",
  description: "LG U+ 브랜드 콘텐츠 사전 검수 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
