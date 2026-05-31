export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSectionData } from "@/lib/courses";

export async function GET(
  _req: Request,
  { params }: { params: { courseId: string; sectionId: string } }
) {
  const data = getSectionData(params.courseId, params.sectionId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
