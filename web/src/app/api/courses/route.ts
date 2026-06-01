export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "force-dynamic";

import { NextResponse } from "next/server";
import { getCourseSummaries } from "@/lib/courses";

export async function GET() {
  const courses = getCourseSummaries();
  return NextResponse.json(courses);
}
