"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/types";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { Check, X, Trophy, Target, RotateCcw, ArrowRight, ArrowLeft } from "lucide-react";

interface QuizViewProps {
  questions: QuizQuestion[];
  dir: "ltr" | "rtl";
  onComplete: (score: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E"];

export function QuizView({ questions, dir, onComplete }: QuizViewProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const L = (en: string, fa: string) => (dir === "rtl" ? fa : en);
  const FwdIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const q = questions[index];
  const answered = picked !== null;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= 70;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === q.correctIndex) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  }

  function retry() {
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="quiz-result">
        <div className={`result-medal ${passed ? "pass" : "fail"}`}>
          {passed ? <Trophy size={34} /> : <Target size={34} />}
        </div>
        <div className="result-score">
          <span className="result-pct">{score}%</span>
          <span className="result-frac">
            {L(`${correctCount} of ${questions.length} correct`, `${correctCount} از ${questions.length} درست`)}
          </span>
        </div>
        <p className="result-msg">
          {passed
            ? L("Nicely done — you passed. On to the next section.", "آفرین — قبول شدید. به بخش بعدی می‌رویم.")
            : L("Almost there. Review the lesson and try again — you need 70% to pass.", "نزدیک بود. درس را مرور کنید و دوباره امتحان کنید — برای قبولی ۷۰٪ لازم است.")}
        </p>
        <div className="result-actions">
          {!passed && (
            <button className="btn-ghost" onClick={retry}>
              <RotateCcw size={16} />
              {L("Try again", "تلاش دوباره")}
            </button>
          )}
          {passed && (
            <button className="continue-btn" onClick={() => onComplete(score)}>
              <span>{L("Complete section", "تکمیل بخش")}</span>
              <FwdIcon size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="phase-body">
      <div className="quiz-progress">
        {questions.map((_, i) => (
          <span
            key={i}
            className={`qdot${i < index ? " done" : ""}${i === index ? " current" : ""}`}
          />
        ))}
        <span className="quiz-count">
          {L(`Question ${index + 1} of ${questions.length}`, `پرسش ${index + 1} از ${questions.length}`)}
        </span>
      </div>

      <MarkdownRenderer content={q.question} dir={dir} className="quiz-q" />

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let state = "";
          if (answered) {
            if (i === q.correctIndex) state = " correct";
            else if (i === picked) state = " wrong";
            else state = " dim";
          }
          return (
            <button
              key={i}
              className={`quiz-opt${state}`}
              disabled={answered}
              onClick={() => pick(i)}
            >
              <span className="opt-letter">
                {answered && i === q.correctIndex ? (
                  <Check size={16} />
                ) : answered && i === picked ? (
                  <X size={16} />
                ) : (
                  LETTERS[i]
                )}
              </span>
              <MarkdownRenderer content={opt} dir={dir} className="opt-text" />
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`quiz-why ${picked === q.correctIndex ? "good" : "bad"}`}>
          <span className="why-tag">
            {picked === q.correctIndex ? L("Correct", "درست") : L("Not quite", "نادرست")}
          </span>
          <MarkdownRenderer content={q.explanation} dir={dir} className="why-body" />
        </div>
      )}

      {answered && (
        <div className="phase-actions">
          <button className="continue-btn" onClick={next}>
            <span>
              {index + 1 < questions.length
                ? L("Next question", "پرسش بعدی")
                : L("See results", "مشاهده نتیجه")}
            </span>
            <FwdIcon size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
