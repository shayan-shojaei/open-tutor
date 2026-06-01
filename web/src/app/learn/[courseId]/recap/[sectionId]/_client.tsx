"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CourseConfig, SectionData } from "@/lib/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonView } from "@/components/content/LessonView";
import { QuizView } from "@/components/interactive/QuizView";
import { ChevronRight, ArrowRight, ArrowLeft, Menu } from "lucide-react";
import { apiUrl } from "@/lib/api-url";

type Phase = "summary" | "quiz" | "done";

export default function RecapSectionPage() {
  const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>();
  const router = useRouter();

  const [courseConfig, setCourseConfig] = useState<CourseConfig | null>(null);
  const [recapData, setRecapData] = useState<SectionData | null>(null);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("summary");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [courseRes, recapMetaRes, dataRes] = await Promise.all([
        fetch(apiUrl(`course/${courseId}`)),
        fetch(apiUrl(`recap/${courseId}`)),
        fetch(apiUrl(`recap/${courseId}/${sectionId}`)),
      ]);
      if (courseRes.ok) setCourseConfig(await courseRes.json());
      if (recapMetaRes.ok) {
        const meta = await recapMetaRes.json();
        setSectionIds(meta.sectionIds ?? []);
      }
      if (dataRes.ok) setRecapData(await dataRes.json());
      setLoading(false);
    }
    load();
  }, [courseId, sectionId]);

  useEffect(() => {
    setPhase("summary");
  }, [sectionId]);

  const dir = courseConfig?.language === "fa" ? "rtl" : "ltr";
  const FwdArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const currentSection = courseConfig?.chapters
    .flatMap((c) => c.sections)
    .find((s) => s.id === sectionId);

  function handleQuizComplete(_score: number) {
    setPhase("done");
  }

  function navigateNext() {
    const idx = sectionIds.indexOf(sectionId);
    if (idx !== -1 && idx + 1 < sectionIds.length) {
      router.push(`/learn/${courseId}/recap/${sectionIds[idx + 1]}`);
    } else {
      router.push(`/learn/${courseId}`);
    }
  }

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!courseConfig || !recapData) {
    return (
      <div className="spinner-page" style={{ color: "var(--ink-3)", fontSize: 16 }}>
        {dir === "rtl" ? "مرور یافت نشد." : "Recap not found."}
      </div>
    );
  }

  const hasQuiz = (recapData.quiz?.length ?? 0) > 0;
  const isLast = sectionIds.indexOf(sectionId) === sectionIds.length - 1;

  const summaryLabel = dir === "rtl"
    ? (hasQuiz ? "ادامه به آزمون" : "بخش بعدی")
    : (hasQuiz ? "Continue to Quiz" : "Next Section");

  const phaseBadge =
    phase === "summary"
      ? (dir === "rtl" ? "خلاصه" : "Summary")
      : phase === "quiz"
      ? "Quiz"
      : (dir === "rtl" ? "تکمیل شد" : "Done");

  return (
    <div className="app-shell has-sidebar" dir={dir}>
      <Sidebar
        course={courseConfig}
        currentSectionId={sectionId}
        dir={dir}
        hasRecap={true}
        isRecap={true}
        recapSectionIds={sectionIds}
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
            <span className="crumb-chapter">{dir === "rtl" ? "مرور" : "Recap"}</span>
            <ChevronRight size={15} className="crumb-sep" />
            <span className="crumb-section">{currentSection?.title}</span>
            <span className="phase-badge">{phaseBadge}</span>
          </div>

          <h1 className="section-title">{currentSection?.title}</h1>

          {phase === "summary" && (
            <LessonView
              markdown={recapData.lessonMarkdown}
              dir={dir}
              continueLabel={summaryLabel}
              onContinue={() => hasQuiz ? setPhase("quiz") : navigateNext()}
            />
          )}

          {phase === "quiz" && (
            <QuizView
              questions={recapData.quiz}
              dir={dir}
              onComplete={handleQuizComplete}
            />
          )}

          {phase === "done" && (
            <div className="complete-state">
              <div className="complete-emoji">✓</div>
              <div className="complete-head">
                {dir === "rtl" ? "بخش مرور شد!" : "Section Reviewed!"}
              </div>
              <div className="complete-sub" style={{ marginTop: 24 }}>
                <button className="continue-btn" onClick={navigateNext}>
                  <span>
                    {isLast
                      ? (dir === "rtl" ? "بازگشت به دوره" : "Back to Course")
                      : (dir === "rtl" ? "بخش بعدی" : "Next Section")}
                  </span>
                  <FwdArrow size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
