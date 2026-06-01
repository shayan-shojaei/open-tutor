export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "force-dynamic";
export function generateStaticParams() { return []; }

import { NextResponse } from "next/server";
import { hasRecap, getRecapSectionIds } from "@/lib/courses";

export async function GET(
  _req: Request,
  { params }: { params: { courseId: string } }
) {
  const recap = hasRecap(params.courseId);
  const sectionIds = recap ? getRecapSectionIds(params.courseId) : [];
  return NextResponse.json({ hasRecap: recap, sectionIds });
}
