/** @type {import('next').NextConfig} */
const isDemoMode = process.env.NEXT_PUBLIC_DEMO === "true";

const nextConfig = isDemoMode
  ? {
      output: "export",
      basePath: "/open-tutor",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      output: "standalone",
    };

export default nextConfig;
