import { NextResponse } from "next/server";
import { getQuizSummaries } from "@/lib/quizzes";

export async function GET() {
  const quizzes = getQuizSummaries();
  return NextResponse.json(quizzes);
}
