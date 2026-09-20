import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve.alias["pdfjs-dist"] = "pdfjs-dist/legacy/build/pdf";

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
