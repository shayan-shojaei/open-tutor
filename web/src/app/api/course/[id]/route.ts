export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "force-dynamic";
export function generateStaticParams() { return []; }

import { NextResponse } from "next/server";
import { getCourseConfig } from "@/lib/courses";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const config = getCourseConfig(params.id);
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(config);
}
