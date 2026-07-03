"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CourseConfig, SectionData } from "@/lib/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonView } from "@/components/content/LessonView";
import { ProblemView } from "@/components/interactive/ProblemView";
import { QuizView } from "@/components/interactive/QuizView";
import { useDataProvider } from "@/lib/data";
import type { CourseProgress } from "@/lib/types";
import { ChevronRight, Menu, PartyPopper } from "lucide-react";

import type { DataProvider } from "@/lib/data";

type Phase = "lesson" | "practice" | "quiz" | "complete";

const phaseLabels: Record<Phase, string> = {
  lesson: "Lesson",
  practice: "Practice",
  quiz: "Quiz",
  complete: "Complete",
};

function CourseProgressBar({
  courseConfig,
  courseId,
  dp,
}: {
  courseConfig: CourseConfig;
  courseId: string;
  dp: DataProvider;
}) {
  const [completedCount, setCompletedCount] = useState(0);
  const allSections = courseConfig.chapters.flatMap((c) => c.sections);

  useEffect(() => {
    dp.getProgress().then((progress) => {
      const cp = progress[courseId] as CourseProgress | undefined;
      setCompletedCount(cp?.completedSections?.length ?? 0);
    });
  }, [courseId, dp]);

  const pct = Math.min(100, Math.round((completedCount / allSections.length) * 100));
  return (
    <div className="course-progress" title={`${pct}% complete`}>
      <div className="course-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SectionPage() {
  const dp = useDataProvider();
  const { courseId, chapterId, sectionId } = useParams<{
    courseId: string;
    chapterId: string;
    sectionId: string;
  }>();
  const router = useRouter();

  const [courseConfig, setCourseConfig] = useState<CourseConfig | null>(null);
  const [sectionData, setSectionData] = useState<SectionData | null>(null);
  const [phase, setPhaseState] = useState<Phase>("lesson");
  const [loading, setLoading] = useState(true);
  const [courseHasRecap, setCourseHasRecap] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [config, section, hasRecap] = await Promise.all([
        dp.getCourseConfig(courseId),
        dp.getSectionData(courseId, sectionId),
        dp.hasRecap(courseId),
      ]);
      if (config) setCourseConfig(config);
      if (section) setSectionData(section);
      setCourseHasRecap(hasRecap);
      setLoading(false);
    }
    load();
  }, [courseId, sectionId, dp]);

  useEffect(() => {
    setPhaseState("lesson");
  }, [sectionId]);

  const dir = courseConfig?.language === "fa" ? "rtl" : "ltr";

  function advanceTo(next: Phase) {
    setPhaseState(next);
    void dp.setPhase(courseId, sectionId, next);
  }

  function handleLessonContinue() {
    if (sectionData?.problems?.length) advanceTo("practice");
    else if (sectionData?.quiz?.length) advanceTo("quiz");
    else finishSection();
  }

  function handlePracticeComplete() {
    if (sectionData?.quiz?.length) advanceTo("quiz");
    else finishSection();
  }

  function handleQuizComplete(score: number) {
    if (score >= 70) {
      void dp.markSectionComplete(courseId, sectionId, score);
      finishSection();
    }
  }

  function finishSection() {
    advanceTo("complete");
    setTimeout(() => navigateToNext(), 1900);
  }

  function navigateToNext() {
    if (!courseConfig) return;
    const allSections = courseConfig.chapters.flatMap((c) => c.sections);
    const idx = allSections.findIndex((s) => s.id === sectionId);
    if (idx !== -1 && idx + 1 < allSections.length) {
      const next = allSections[idx + 1];
      router.push(`/learn/${courseId}/${next.chapterId}/${next.id}`);
    } else {
      router.push("/");
    }
  }

  const currentChapter = courseConfig?.chapters.find((c) => c.id === chapterId);
  const currentSection = courseConfig?.chapters
    .flatMap((c) => c.sections)
    .find((s) => s.id === sectionId);

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!courseConfig || !sectionData) {
    return (
      <div className="spinner-page" style={{ color: "var(--ink-3)", fontSize: 16 }}>
        Section not found.
      </div>
    );
  }

  const hasPractice = (sectionData.problems?.length ?? 0) > 0;
  const hasQuiz = (sectionData.quiz?.length ?? 0) > 0;

  const lessonContinueLabel =
    hasPractice
      ? dir === "rtl" ? "ادامه به تمرین" : "Continue to Practice"
      : hasQuiz
      ? dir === "rtl" ? "ادامه به آزمون" : "Continue to Quiz"
      : dir === "rtl" ? "تکمیل بخش" : "Complete section";

  return (
    <div className="app-shell has-sidebar" dir={dir}>
      <Sidebar
        course={courseConfig}
        currentSectionId={sectionId}
        dir={dir}
        hasRecap={courseHasRecap}
        isMobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="app-main">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu size={16} />
          {dir === "rtl" ? "فهرست" : "Menu"}
        </button>
        <div className="section-page">
          <div className="breadcrumb">
            <span className="crumb-chapter">{currentChapter?.title}</span>
            <ChevronRight size={15} className="crumb-sep" />
            <span className="crumb-section">{currentSection?.title}</span>
            <span className={`phase-badge${phase === "complete" ? " phase-complete" : ""}`}>
              {phaseLabels[phase]}
            </span>
          </div>

          <h1 className="section-title">{currentSection?.title}</h1>

          <CourseProgressBar courseConfig={courseConfig} courseId={courseId} dp={dp} />

          {phase === "lesson" && (
            <LessonView
              markdown={sectionData.lessonMarkdown}
              dir={dir}
              continueLabel={lessonContinueLabel}
              onContinue={handleLessonContinue}
              courseId={courseId}
              sectionId={sectionId}
            />
          )}

          {phase === "practice" && (
            <ProblemView
              problems={sectionData.problems}
              dir={dir}
              continueLabel={hasQuiz
                ? (dir === "rtl" ? "ادامه به آزمون" : "Continue to Quiz")
                : (dir === "rtl" ? "تکمیل بخش" : "Complete section")}
              onComplete={handlePracticeComplete}
              courseId={courseId}
              sectionId={sectionId}
            />
          )}

          {phase === "quiz" && (
            <QuizView
              questions={sectionData.quiz}
              dir={dir}
              onComplete={handleQuizComplete}
            />
          )}

          {phase === "complete" && (
            <div className="complete-state">
              <div className="complete-emoji"><PartyPopper size={64} /></div>
              <div className="complete-head">
                {dir === "rtl" ? "بخش تکمیل شد!" : "Section Complete!"}
              </div>
              <div className="complete-sub">
                {dir === "rtl" ? "در حال رفتن به بخش بعدی…" : "Moving to the next section…"}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
