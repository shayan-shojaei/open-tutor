export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "auto";
export function generateStaticParams() { return []; }

import { NextResponse } from "next/server";
import { getQuizConfig, getQuizQuestions } from "@/lib/quizzes";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const quiz = getQuizConfig(params.id);
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const questions = getQuizQuestions(params.id);
  return NextResponse.json({ quiz, questions });
}
