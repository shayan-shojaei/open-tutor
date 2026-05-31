export const dynamic = "force-dynamic";

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

function GettingStarted() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <h2 className="empty-state-title">No quizzes yet</h2>
      <p className="empty-state-sub">Add your first quiz in one of two ways:</p>
      <div className="empty-state-options">
        <div className="empty-option">
          <div className="empty-option-label">Install from a repository</div>
          <p className="empty-option-desc">
            Add a community module repo, then install any quiz from it:
          </p>
          <pre className="empty-code">{`tutor repo add https://github.com/user/modules
tutor module search calculus
tutor module install user/modules calculus-quiz`}</pre>
        </div>
        <div className="empty-option-divider">or</div>
        <div className="empty-option">
          <div className="empty-option-label">Create with Claude Code skills</div>
          <p className="empty-option-desc">
            Open this project in Claude Code and run a skill to generate a quiz from scratch:
          </p>
          <pre className="empty-code">{`/new-quiz`}</pre>
        </div>
      </div>
    </div>
  );
}

export default function QuizzesPage() {
  const quizzes = getQuizSummaries();

  return (
    <div className="app-main">
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Quizzes</h1>
          {quizzes.length > 0 && (
            <p className="page-sub">
              Select a quiz to test your knowledge, or run{" "}
              <code className="cli">/new-quiz</code> to generate one.
            </p>
          )}
        </div>

        {quizzes.length === 0 ? (
          <GettingStarted />
        ) : (
          <div className="cat-grid">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
            <div className="cat-card cat-empty">
              <span className="empty-glyph">✦</span>
              <span className="empty-head">Create a quiz</span>
              <span className="empty-cli">
                Run <code className="cli">/new-quiz</code> in Claude Code
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
