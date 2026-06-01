import { getQuizSummaries } from "@/lib/quizzes";
import QuizSessionPage from "./_client";

export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "true") return [];
  return getQuizSummaries().map((q) => ({ quizId: q.id }));
}

export default function Page({ params }: { params: { quizId: string } }) {
  return <QuizSessionPage params={params} />;
}
