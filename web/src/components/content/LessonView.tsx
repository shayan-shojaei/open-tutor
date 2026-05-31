"use client";

import { MarkdownRenderer } from "./MarkdownRenderer";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface LessonViewProps {
  markdown: string;
  dir: "ltr" | "rtl";
  continueLabel: string;
  onContinue: () => void;
}

export function LessonView({ markdown, dir, continueLabel, onContinue }: LessonViewProps) {
  const FwdIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="phase-body">
      <MarkdownRenderer content={markdown} dir={dir} className="lesson-body" />
      <div className="phase-actions">
        <button className="continue-btn" onClick={onContinue}>
          <span>{continueLabel}</span>
          <FwdIcon size={18} />
        </button>
      </div>
    </div>
  );
}
