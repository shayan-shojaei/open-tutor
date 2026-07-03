"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CourseConfig } from "@/lib/types";
import { useDataProvider } from "@/lib/data";
import type { CourseProgress } from "@/lib/types";
import { CheckCircle2, Lock, ChevronDown, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { InlineLatex } from "@/components/ui/InlineLatex";

interface SidebarProps {
  course: CourseConfig;
  currentSectionId: string;
  dir: "ltr" | "rtl";
  hasRecap?: boolean;
  isRecap?: boolean;
  recapSectionIds?: string[];
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ course, currentSectionId, dir, hasRecap, isRecap, recapSectionIds, isMobileOpen, onClose }: SidebarProps) {
  const currentChapterId = course.chapters.find((c) =>
    c.sections.some((s) => s.id === currentSectionId)
  )?.id;
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set(currentChapterId ? [currentChapterId] : [])
  );
  const dp = useDataProvider();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [confirmReset, setConfirmReset] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const progress = await dp.getProgress();
      const cp = progress[course.id] as CourseProgress | undefined;
      setCompleted(new Set(cp?.completedSections ?? []));
    }
    load();
  }, [course, dp]);

  function toggle(chapterId: string) {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      next.has(chapterId) ? next.delete(chapterId) : next.add(chapterId);
      return next;
    });
  }

  const allSectionIds = course.chapters.flatMap((c) => c.sections.map((s) => s.id));

  function isSectionLocked(sectionId: string): boolean {
    const idx = allSectionIds.indexOf(sectionId);
    if (idx === 0) return false;
    return !completed.has(allSectionIds[idx - 1]);
  }

  async function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    await dp.resetCourseProgress(course.id);
    setCompleted(new Set());
    setConfirmReset(false);
    const firstChapter = course.chapters[0];
    const firstSection = firstChapter?.sections[0];
    if (firstChapter && firstSection) {
      router.push(`/learn/${course.id}/${firstChapter.id}/${firstSection.id}`);
    }
  }

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <>
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`sidebar${isMobileOpen ? " is-mobile-open" : ""}`} dir={dir}>
      <Link href="/" className="sidebar-back">
        <BackArrow size={16} />
        <span>{dir === "rtl" ? "همه دوره‌ها" : "All Courses"}</span>
      </Link>

      <div className="sidebar-module">
        <span className="sidebar-emoji">{course.icon}</span>
        <span className="sidebar-mtitle">{course.title}</span>
      </div>

      <nav className="sidebar-nav">
        {course.chapters.map((chapter) => {
          const isOpen = openChapters.has(chapter.id);
          return (
            <div key={chapter.id} className="chapter">
              <button className="chapter-head" onClick={() => toggle(chapter.id)}>
                <ChevronDown size={16} className={`chev${isOpen ? " open" : ""}`} />
                <InlineLatex text={chapter.title} className="chapter-title" />
              </button>

              {isOpen && (
                <ul className="section-list">
                  {chapter.sections.map((section) => {
                    const isCurrent = section.id === currentSectionId;
                    const isDone = completed.has(section.id);
                    const locked = isSectionLocked(section.id);

                    const itemClass = `section-item${isCurrent ? " is-active" : ""}${locked ? " is-locked" : ""}`;

                    if (locked) {
                      return (
                        <li key={section.id}>
                          <span className={itemClass}>
                            <span className="section-ic">
                              <Lock size={14} className="ic-lock" />
                            </span>
                            <InlineLatex text={section.title} className="section-label" />
                          </span>
                        </li>
                      );
                    }

                    return (
                      <li key={section.id}>
                        <Link
                          href={`/learn/${course.id}/${chapter.id}/${section.id}`}
                          className={itemClass}
                        >
                          <span className="section-ic">
                            {isDone ? (
                              <CheckCircle2 size={18} className="ic-done" />
                            ) : (
                              <span
                                style={{
                                  width: 18, height: 18, borderRadius: "50%",
                                  border: "2px solid currentColor", display: "inline-block",
                                }}
                                className="ic-todo"
                              />
                            )}
                          </span>
                          <span className="section-label">{section.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {hasRecap && (
        <div className="sidebar-recap-section">
          <Link
            href={`/learn/${course.id}/recap`}
            className={`recap-entry-btn${isRecap ? " is-active" : ""}`}
          >
            <span className="recap-icon">⟳</span>
            <span>{dir === "rtl" ? "مرور کلی" : "Recap"}</span>
          </Link>

          {isRecap && recapSectionIds && (
            <ul className="section-list">
              {recapSectionIds.map((sid) => {
                const meta = course.chapters.flatMap((c) => c.sections).find((s) => s.id === sid);
                const isCurrent = sid === currentSectionId;
                return (
                  <li key={sid}>
                    <Link
                      href={`/learn/${course.id}/recap/${sid}`}
                      className={`section-item${isCurrent ? " is-active" : ""}`}
                    >
                      <InlineLatex text={meta?.title ?? sid} className="section-label" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {completed.size > 0 && <div className="sidebar-reset">
        {confirmReset ? (
          <>
            <button className="sidebar-reset-confirm" onClick={handleReset}>
              {dir === "rtl" ? "مطمئنی؟ تأیید کن" : "Sure? Confirm reset"}
            </button>
            <button className="sidebar-reset-cancel" onClick={() => setConfirmReset(false)}>
              {dir === "rtl" ? "لغو" : "Cancel"}
            </button>
          </>
        ) : (
          <button className="sidebar-reset-btn" onClick={handleReset}>
            <RotateCcw size={14} />
            <span>{dir === "rtl" ? "بازنشانی پیشرفت" : "Reset progress"}</span>
          </button>
        )}
      </div>}
    </aside>
    </>
  );
}
