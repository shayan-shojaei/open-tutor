"use client";

import { useState } from "react";
import type { Problem } from "@/lib/types";
import { AnnotatableContent } from "@/components/annotations/AnnotatableContent";
import { ChevronDown, ArrowRight, ArrowLeft } from "lucide-react";

interface ProblemViewProps {
  problems: Problem[];
  dir: "ltr" | "rtl";
  continueLabel: string;
  onComplete: () => void;
  courseId: string;
  sectionId: string;
}

export function ProblemView({
  problems,
  dir,
  continueLabel,
  onComplete,
  courseId,
  sectionId,
}: ProblemViewProps) {
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const FwdIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const L = (en: string, fa: string) => (dir === "rtl" ? fa : en);

  return (
    <div className="phase-body">
      {problems.map((problem, idx) => (
        <div key={idx} className="problem">
          <div className="problem-num">
            {L("Problem ", "مسئله ")}
            {idx + 1}
          </div>
          <AnnotatableContent
            content={problem.statement}
            dir={dir}
            className="problem-prompt"
            courseId={courseId}
            sectionId={sectionId}
            surface={`problem-${problem.id}`}
          />
          <button
            className="solution-toggle"
            onClick={() => setShown((s) => ({ ...s, [idx]: !s[idx] }))}
          >
            <ChevronDown
              size={15}
              style={{
                transform: shown[idx] ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform .2s",
              }}
            />
            {shown[idx] ? L("Hide solution", "پنهان کردن راه‌حل") : L("Show solution", "نمایش راه‌حل")}
          </button>
          {shown[idx] && (
            <div className="solution">
              <AnnotatableContent
                content={problem.solution}
                dir={dir}
                className="step-body"
                courseId={courseId}
                sectionId={sectionId}
                surface={`problem-${problem.id}-solution`}
              />
            </div>
          )}
        </div>
      ))}

      <div className="phase-actions">
        <button className="continue-btn" onClick={onComplete}>
          <span>{continueLabel}</span>
          <FwdIcon size={18} />
        </button>
      </div>
    </div>
  );
}
