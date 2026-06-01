export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "force-dynamic";
export function generateStaticParams() { return []; }

import { NextResponse } from "next/server";
import { getRecapData } from "@/lib/courses";

export async function GET(
  _req: Request,
  { params }: { params: { courseId: string; sectionId: string } }
) {
  const data = getRecapData(params.courseId, params.sectionId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
