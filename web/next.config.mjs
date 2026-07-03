import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

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
      experimental: {
        // Required for pnpm monorepo: traces deps from workspace root so the
        // standalone output includes the real .pnpm/ files, not dangling symlinks.
        outputFileTracingRoot: path.join(__dirname, "../"),
      },
    };

export default nextConfig;
