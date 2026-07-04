export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "force-dynamic";
export function generateStaticParams() { return []; }

import QuizEditor from "./_client";

export default function Page({ params }: { params: { quizId: string } }) {
  return <QuizEditor quizId={params.quizId} />;
}
