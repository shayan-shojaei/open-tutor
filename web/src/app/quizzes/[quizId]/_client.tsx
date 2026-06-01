"use client";

import { useState, useEffect } from "react";
import { SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import type { QuizConfig, StandaloneQuizQuestion } from "@/lib/types";
import { QuizSessionView } from "@/components/interactive/QuizSessionView";
import { apiUrl } from "@/lib/api-url";

interface QuizResponse {
  quiz: QuizConfig;
  questions: StandaloneQuizQuestion[];
}

export default function QuizSessionPage({ params }: { params: { quizId: string } }) {
  const router = useRouter();
  const [data, setData] = useState<QuizResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl(`quiz/${params.quizId}`))
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        setData(await res.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.quizId]);

  if (loading) {
    return (
      <div className="app-main spinner-page">
        <div className="spinner" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="app-main spinner-page" style={{ flexDirection: "column", gap: 16 }}>
        <SearchX size={48} color="var(--ink-3)" />
        <p style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>Quiz not found</p>
        <button className="fc-back" style={{ marginBottom: 0 }} onClick={() => router.push("/quizzes")}>
          ← Back to Quizzes
        </button>
      </div>
    );
  }

  const { quiz, questions } = data;

  return (
    <div className="app-main">
      <QuizSessionView
        questions={questions}
        quizId={quiz.id}
        quizTitle={quiz.title}
        quizDescription={quiz.description}
        language={quiz.language}
        onBack={() => router.push("/quizzes")}
      />
    </div>
  );
}
