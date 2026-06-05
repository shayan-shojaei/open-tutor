"use client";

import { AnnotatableContent } from "@/components/annotations/AnnotatableContent";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface LessonViewProps {
  markdown: string;
  dir: "ltr" | "rtl";
  continueLabel: string;
  onContinue: () => void;
  courseId: string;
  sectionId: string;
}

export function LessonView({
  markdown,
  dir,
  continueLabel,
  onContinue,
  courseId,
  sectionId,
}: LessonViewProps) {
  const FwdIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="phase-body">
      <AnnotatableContent
        content={markdown}
        dir={dir}
        className="lesson-body"
        courseId={courseId}
        sectionId={sectionId}
        surface="lesson"
      />
      <div className="phase-actions">
        <button className="continue-btn" onClick={onContinue}>
          <span>{continueLabel}</span>
          <FwdIcon size={18} />
        </button>
      </div>
    </div>
  );
}
