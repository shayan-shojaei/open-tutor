"use client";

import { useState } from "react";
import type { Problem } from "@/lib/types";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ChevronDown, ArrowRight, ArrowLeft } from "lucide-react";

interface ProblemViewProps {
  problems: Problem[];
  dir: "ltr" | "rtl";
  continueLabel: string;
  onComplete: () => void;
}

export function ProblemView({ problems, dir, continueLabel, onComplete }: ProblemViewProps) {
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
          <MarkdownRenderer content={problem.statement} dir={dir} className="problem-prompt" />
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
              <MarkdownRenderer content={problem.solution} dir={dir} className="step-body" />
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
