import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  async redirects() {
    // Netlify can handle old installed apps opening / before starting Next.js.
    return [{ source: '/', destination: '/students', permanent: false }];
  },
  experimental: {
    serverActions: {
      // Leave headroom for multipart framing while staying under Netlify's request cap.
      bodySizeLimit: '4.5mb',
    },
  },
  turbopack: {},
};

export default withSerwist(nextConfig);
