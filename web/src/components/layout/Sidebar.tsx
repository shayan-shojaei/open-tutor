"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CourseConfig } from "@/lib/types";
import { isSectionComplete } from "@/lib/progress";
import { CheckCircle2, Lock, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";

interface SidebarProps {
  course: CourseConfig;
  currentSectionId: string;
  dir: "ltr" | "rtl";
  hasRecap?: boolean;
  isRecap?: boolean;
  recapSectionIds?: string[];
}

export function Sidebar({ course, currentSectionId, dir, hasRecap, isRecap, recapSectionIds }: SidebarProps) {
  const currentChapterId = course.chapters.find((c) =>
    c.sections.some((s) => s.id === currentSectionId)
  )?.id;
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set(currentChapterId ? [currentChapterId] : [])
  );
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const s = new Set(
      course.chapters
        .flatMap((c) => c.sections)
        .filter((sec) => isSectionComplete(course.id, sec.id))
        .map((sec) => sec.id)
    );
    setCompleted(s);
  }, [course]);

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

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <aside className="sidebar" dir={dir}>
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
                <span className="chapter-title">{chapter.title}</span>
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
                            <span className="section-label">{section.title}</span>
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
                      <span className="section-label">{meta?.title ?? sid}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
