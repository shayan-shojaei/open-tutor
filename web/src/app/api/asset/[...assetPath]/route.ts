import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getModulesDir } from "@/lib/modulesDir";

const MIME: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: { assetPath: string[] } }
) {
  const segments = params.assetPath;
  const filePath = path.join(getModulesDir(), ...segments);

  // Prevent directory traversal
  const resolved = path.resolve(filePath);
  const modulesRoot = path.resolve(getModulesDir());
  if (!resolved.startsWith(modulesRoot)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(resolved).slice(1).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  const buffer = fs.readFileSync(resolved);

  return new NextResponse(buffer, {
    headers: { "Content-Type": contentType },
  });
}
