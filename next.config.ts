import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** E2E는 개발 서버와 산출물이 섞이지 않도록 다른 디렉터리에 빌드한다. */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  headers() {
    return [
      {
        source: "/fonts/pretendard-1.3.9/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
