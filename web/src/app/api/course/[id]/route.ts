export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCourseConfig } from "@/lib/courses";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const config = getCourseConfig(params.id);
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(config);
}
