import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.prokatik.by",
          },
        ],
        destination: "https://prokatik.by/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
