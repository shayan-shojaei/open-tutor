import Link from "next/link";
import { getQuizSummaries } from "@/lib/quizzes";
import type { QuizConfig } from "@/lib/types";

function QuizCard({ quiz }: { quiz: QuizConfig }) {
  return (
    <Link href={`/quizzes/${quiz.id}`} className="cat-card" dir={quiz.language === "fa" ? "rtl" : "ltr"}>
      <div className="cat-card-top">
        <span className="cat-glyph">📝</span>
        <div className="cat-badges">
          {quiz.language === "fa" && <span className="lang-badge">فارسی</span>}
          <span className={`subject-badge subj-${quiz.subject}`}>
            <span className="subject-dot" />
            {quiz.subject}
          </span>
        </div>
      </div>
      <h2 className="cat-title">{quiz.title}</h2>
      <p className="cat-desc">{quiz.description}</p>
      <div className="cat-foot">
        <span className="cat-stat">{quiz.questionCount} questions</span>
        <span className="cat-sep">·</span>
        <span className="cat-stat">{quiz.questionType}</span>
      </div>
    </Link>
  );
}

export default function QuizzesPage() {
  const quizzes = getQuizSummaries();

  return (
    <div className="app-main">
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Quizzes</h1>
          <p className="page-sub">
            Select a quiz to test your knowledge, or run{" "}
            <code className="cli">/new-quiz</code> to generate one.
          </p>
        </div>

        <div className="cat-grid">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
          <div className="cat-card cat-empty">
            <span className="empty-glyph">📝</span>
            <span className="empty-head">Create a quiz</span>
            <span className="empty-cli">
              Run <code className="cli">/new-quiz</code> in your editor
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
