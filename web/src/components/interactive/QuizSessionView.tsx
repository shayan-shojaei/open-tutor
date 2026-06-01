"use client";

import { useState } from "react";
import type { StandaloneQuizQuestion } from "@/lib/types";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ArrowLeft, ArrowRight, RotateCcw, BookOpen, Check, X } from "lucide-react";

interface QuizSessionViewProps {
  questions: StandaloneQuizQuestion[];
  quizId: string;
  quizTitle: string;
  quizDescription: string;
  language: "en" | "fa";
  onBack: () => void;
}

type AnswerState =
  | { kind: "unanswered" }
  | { kind: "mc-answered"; selectedIndex: number; correct: boolean }
  | { kind: "written-submitted" }
  | { kind: "written-rated"; gotIt: boolean };

export function QuizSessionView({
  questions,
  quizTitle,
  quizDescription,
  language,
  onBack,
}: QuizSessionViewProps) {
  const isRtl = language === "fa";
  const dir = isRtl ? "rtl" : "ltr";
  const L = (en: string, fa: string) => (isRtl ? fa : en);
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const [pos, setPos] = useState(0);
  // Per-question state so navigating back restores the prior answer/selection.
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    questions.map(() => ({ kind: "unanswered" }))
  );
  const [writtenTexts, setWrittenTexts] = useState<string[]>(() => questions.map(() => ""));
  const [done, setDone] = useState(false);

  const total = questions.length;
  const question = questions[pos];
  const pct = Math.round((pos / total) * 100);

  const answerState = answers[pos];
  const writtenText = writtenTexts[pos];

  // Scores are derived from the per-question answers so revisiting a question
  // never double-counts (answers are locked once given).
  const mcAnswers = answers.filter(
    (a): a is Extract<AnswerState, { kind: "mc-answered" }> => a.kind === "mc-answered"
  );
  const mcTotal = mcAnswers.length;
  const mcCorrect = mcAnswers.filter((a) => a.correct).length;
  const writtenTotal = answers.filter(
    (a) => a.kind === "written-submitted" || a.kind === "written-rated"
  ).length;
  const writtenGot = answers.filter(
    (a) => a.kind === "written-rated" && a.gotIt
  ).length;

  function setAnswerAt(state: AnswerState) {
    setAnswers((prev) => prev.map((a, i) => (i === pos ? state : a)));
  }

  function advance() {
    const next = pos + 1;
    if (next >= total) {
      setDone(true);
    } else {
      setPos(next);
    }
  }

  function goBack() {
    setPos((p) => Math.max(0, p - 1));
  }

  function handleMcSelect(index: number) {
    if (answerState.kind !== "unanswered") return;
    const correct = index === question.correctIndex;
    setAnswerAt({ kind: "mc-answered", selectedIndex: index, correct });
  }

  function handleWrittenSubmit() {
    if (answerState.kind !== "unanswered") return;
    setAnswerAt({ kind: "written-submitted" });
  }

  function handleWrittenRate(gotIt: boolean) {
    setAnswerAt({ kind: "written-rated", gotIt });
  }

  function restart() {
    setPos(0);
    setAnswers(questions.map(() => ({ kind: "unanswered" })));
    setWrittenTexts(questions.map(() => ""));
    setDone(false);
  }

  const backBtn = (
    <button className="fc-back" onClick={onBack}>
      <BackArrow size={16} />
      <span>{L("Back", "بازگشت")}</span>
    </button>
  );

  if (done) {
    const hasMc = mcTotal > 0;
    const hasWritten = writtenTotal > 0;

    return (
      <div className="qz-page" dir={dir}>
        {backBtn}
        <div className="qz-done">
          <div className="fc-done-ic">
            <BookOpen size={34} />
          </div>
          <h2 className="fc-done-title">{L("Quiz Complete!", "آزمون تمام شد!")}</h2>
          <div className="fc-stats">
            {hasMc && (
              <div className={`fc-stat ${mcCorrect / mcTotal >= 0.7 ? "easy" : "miss"}`}>
                <span className="fc-stat-n">{mcCorrect}/{mcTotal}</span>
                <span className="fc-stat-l">{L("Correct", "درست")}</span>
              </div>
            )}
            {hasWritten && (
              <div className={`fc-stat ${writtenGot / writtenTotal >= 0.7 ? "easy" : "miss"}`}>
                <span className="fc-stat-n">{writtenGot}/{writtenTotal}</span>
                <span className="fc-stat-l">{L("Got it", "بلد بودم")}</span>
              </div>
            )}
          </div>
          <div className="fc-done-actions">
            <button className="continue-btn" onClick={restart}>
              <RotateCcw size={16} />
              <span>{L("Try again", "دوباره امتحان")}</span>
            </button>
            <button className="btn-ghost" onClick={onBack}>
              <BackArrow size={16} />
              <span>{L("Back to Quizzes", "بازگشت به آزمون‌ها")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAnswered =
    answerState.kind === "mc-answered" ||
    answerState.kind === "written-submitted" ||
    answerState.kind === "written-rated";

  const showNextBtn =
    answerState.kind === "mc-answered" || answerState.kind === "written-rated";

  const mcAnswered = answerState.kind === "mc-answered" ? answerState : null;
  const writtenSubmitted =
    answerState.kind === "written-submitted" || answerState.kind === "written-rated";

  return (
    <div className="qz-page" dir={dir}>
      {backBtn}

      <div className="fc-header">
        <h1 className="fc-title">{quizTitle}</h1>
        <p className="fc-desc">{quizDescription}</p>
      </div>

      <div className="fc-progress-row">
        <span className="fc-count">
          {L(`Question ${pos + 1} of ${total}`, `سوال ${pos + 1} از ${total}`)}
        </span>
        <span className="fc-pct">{pct}%</span>
      </div>
      <div className="fc-bar">
        <div className="fc-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="qz-question-wrap">
        <div className="qz-q-label">
          {question.type === "multiple-choice"
            ? L("Multiple Choice", "چند گزینه‌ای")
            : L("Written", "تشریحی")}
        </div>
        <div className="quiz-q">
          <MarkdownRenderer content={question.question} dir={dir} className="md" />
        </div>

        {/* Multiple Choice */}
        {question.type === "multiple-choice" && question.options && (
          <div className="quiz-options">
            {question.options.map((opt, i) => {
              const letters = ["A", "B", "C", "D", "E", "F"];
              let cls = "quiz-opt";
              if (mcAnswered) {
                if (i === question.correctIndex) cls += " correct";
                else if (i === mcAnswered.selectedIndex && !mcAnswered.correct) cls += " wrong";
                else cls += " dim";
              }
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={!!mcAnswered}
                  onClick={() => handleMcSelect(i)}
                >
                  <span className="opt-letter">{letters[i]}</span>
                  <span className="opt-text">
                    <MarkdownRenderer content={opt} dir={dir} className="md" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Written */}
        {question.type === "written" && (
          <div className="qz-written">
            <textarea
              className="qz-textarea"
              dir={dir}
              disabled={writtenSubmitted}
              value={writtenText}
              onChange={(e) =>
                setWrittenTexts((prev) => prev.map((t, i) => (i === pos ? e.target.value : t)))
              }
              placeholder={L("Type your answer here…", "پاسخ خود را اینجا بنویسید…")}
              rows={4}
            />
            {!writtenSubmitted && (
              <button
                className="continue-btn"
                style={{ marginTop: 14 }}
                onClick={handleWrittenSubmit}
                disabled={writtenText.trim().length === 0}
              >
                {L("Submit", "ثبت پاسخ")}
              </button>
            )}
          </div>
        )}

        {/* Explanation — shown after MC answer */}
        {mcAnswered && (
          <div className={`quiz-why ${mcAnswered.correct ? "good" : "bad"}`}>
            <span className="why-tag">
              {mcAnswered.correct ? L("Correct!", "درست!") : L("Incorrect", "نادرست")}
            </span>
            {question.explanation && (
              <div className="why-body">
                <MarkdownRenderer content={question.explanation} dir={dir} className="md" />
              </div>
            )}
          </div>
        )}

        {/* Correct answer reveal — shown after written submit */}
        {writtenSubmitted && question.answer && (
          <div className="qz-answer-reveal">
            <span className="qz-answer-label">{L("Correct answer", "پاسخ صحیح")}</span>
            <div className="qz-answer-body">
              <MarkdownRenderer content={question.answer} dir={dir} className="md" />
            </div>
            {question.explanation && (
              <div className="qz-answer-explanation">
                <MarkdownRenderer content={question.explanation} dir={dir} className="md" />
              </div>
            )}
            {answerState.kind === "written-submitted" && (
              <div className="qz-self-rate">
                <span className="qz-rate-label">{L("How did you do?", "چطور بود؟")}</span>
                <div className="qz-rate-btns">
                  <button className="qz-rate-btn got" onClick={() => handleWrittenRate(true)}>
                    <Check size={16} />
                    {L("Got it", "بلد بودم")}
                  </button>
                  <button className="qz-rate-btn miss" onClick={() => handleWrittenRate(false)}>
                    <X size={16} />
                    {L("Didn't get it", "بلد نبودم")}
                  </button>
                </div>
              </div>
            )}
            {answerState.kind === "written-rated" && (
              <div className={`quiz-why ${answerState.gotIt ? "good" : "bad"}`} style={{ marginTop: 12 }}>
                <span className="why-tag">
                  {answerState.gotIt
                    ? L("Marked as correct", "علامت‌گذاری شد: درست")
                    : L("Marked for review", "علامت‌گذاری شد: مرور")}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="qz-nav-row">
          <button className="btn-ghost" onClick={goBack} disabled={pos === 0}>
            <BackArrow size={16} />
            <span>{L("Previous", "سوال قبلی")}</span>
          </button>
          {showNextBtn && (
            <button className="continue-btn" onClick={advance}>
              {pos + 1 < total
                ? L("Next question →", "سوال بعدی ←")
                : L("Finish quiz →", "پایان آزمون ←")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
