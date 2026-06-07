"use client";

import { useEffect, useState } from "react";
import type { CourseConfig, FlashCardDeck, GamificationState } from "@/lib/types";
import { getProgress } from "@/lib/progress";
import { getGamification, xpToNextLevel, levelProgress } from "@/lib/gamification";
import Link from "next/link";
import { Flame, Zap, BookOpen, Layers, Trophy } from "lucide-react";

interface Props {
  courses: CourseConfig[];
  decks: FlashCardDeck[];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLast12Weeks(): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 83);
  for (let i = 0; i < 84; i++) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function StatsClient({ courses, decks }: Props) {
  const [gami, setGami] = useState<GamificationState | null>(null);
  const [progress, setProgress] = useState<ReturnType<typeof getProgress> | null>(null);

  useEffect(() => {
    setGami(getGamification());
    setProgress(getProgress());
  }, []);

  if (!gami || !progress) return <div className="app-main"><div className="page"><p>Loading…</p></div></div>;

  const totalSections = courses.reduce((s, c) => s + c.chapters.reduce((a, ch) => a + ch.sections.length, 0), 0);
  const completedSections = courses.reduce((s, c) => {
    const cp = progress[c.id] as { completedSections?: string[] } | undefined;
    return s + (cp?.completedSections?.length ?? 0);
  }, 0);

  const activeDates = new Set(gami.xpLog.map((e) => e.date));
  const days12 = getLast12Weeks();

  const courseRows = courses.map((c) => {
    const cp = progress[c.id] as { completedSections?: string[]; quizScores?: Record<string, number> } | undefined;
    const done = cp?.completedSections?.length ?? 0;
    const total = c.chapters.reduce((a, ch) => a + ch.sections.length, 0);
    const scores = Object.values(cp?.quizScores ?? {});
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const worst = scores.length ? Math.min(...scores) : null;
    const worstId = worst !== null && cp?.quizScores
      ? Object.entries(cp.quizScores).find(([, v]) => v === worst)?.[0]
      : null;
    return { c, done, total, avg, worst, worstId };
  });

  const allTimeWeakest = courseRows
    .filter((r) => r.avg !== null)
    .sort((a, b) => (a.avg ?? 100) - (b.avg ?? 100))[0];

  return (
    <div className="app-main">
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Your Stats</h1>
          <p className="page-sub">Track your learning progress and streaks.</p>
        </div>

        {/* Overview cards */}
        <div className="stats-overview">
          <div className="stat-card">
            <BookOpen size={22} className="stat-card-icon" />
            <div className="stat-card-val">{completedSections}<span className="stat-card-of">/{totalSections}</span></div>
            <div className="stat-card-label">Sections completed</div>
          </div>
          <div className="stat-card">
            <Flame size={22} className="stat-card-icon streak-icon" />
            <div className="stat-card-val">{gami.streak}</div>
            <div className="stat-card-label">Day streak{gami.longestStreak > gami.streak ? ` (best: ${gami.longestStreak})` : ""}</div>
          </div>
          <div className="stat-card">
            <Zap size={22} className="stat-card-icon xp-icon" />
            <div className="stat-card-val">{gami.xp.toLocaleString()}</div>
            <div className="stat-card-label">Total XP · Level {gami.level}</div>
          </div>
          <div className="stat-card">
            <Trophy size={22} className="stat-card-icon" />
            <div className="stat-card-val">{courses.filter((c) => {
              const cp = progress[c.id] as { completedSections?: string[] } | undefined;
              const total = c.chapters.reduce((a, ch) => a + ch.sections.length, 0);
              return (cp?.completedSections?.length ?? 0) >= total && total > 0;
            }).length}</div>
            <div className="stat-card-label">Courses finished</div>
          </div>
        </div>

        {/* XP level bar */}
        {gami.xp > 0 && (
          <div className="stats-section">
            <h2 className="stats-section-title">Level Progress</h2>
            <div className="level-bar-row">
              <span className="level-label">Lv.{gami.level}</span>
              <div className="level-bar">
                <div className="level-bar-fill" style={{ width: `${levelProgress(gami)}%` }} />
              </div>
              <span className="level-label">Lv.{gami.level + 1}</span>
            </div>
            <p className="level-sub">{xpToNextLevel(gami)} XP to next level</p>
          </div>
        )}

        {/* Activity heatmap */}
        <div className="stats-section">
          <h2 className="stats-section-title">Activity — last 12 weeks</h2>
          <div className="heatmap">
            {days12.map((d) => (
              <div
                key={d}
                className={`heatmap-cell${activeDates.has(d) ? " active" : ""}${d === today() ? " today" : ""}`}
                title={d}
              />
            ))}
          </div>
        </div>

        {/* Weakest area */}
        {allTimeWeakest && (
          <div className="stats-section">
            <h2 className="stats-section-title">Focus area</h2>
            <div className="weak-card">
              <span className="weak-label">Lowest avg score:</span>
              <span className="weak-course">{allTimeWeakest.c.icon} {allTimeWeakest.c.title}</span>
              <span className="weak-score">{allTimeWeakest.avg}%</span>
              <Link href={`/learn/${allTimeWeakest.c.id}`} className="weak-link">Revisit →</Link>
            </div>
          </div>
        )}

        {/* Per-course table */}
        {courseRows.length > 0 && (
          <div className="stats-section">
            <h2 className="stats-section-title">Courses</h2>
            <div className="stats-table">
              <div className="stats-table-head">
                <span>Course</span><span>Progress</span><span>Avg score</span>
              </div>
              {courseRows.map(({ c, done, total, avg }) => (
                <Link key={c.id} href={`/learn/${c.id}`} className="stats-table-row">
                  <span className="strow-title">{c.icon} {c.title}</span>
                  <span className="strow-prog">
                    <span className="strow-bar-wrap">
                      <span className="strow-bar-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                    </span>
                    {done}/{total}
                  </span>
                  <span className={`strow-score${avg !== null && avg < 70 ? " low" : ""}`}>
                    {avg !== null ? `${avg}%` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Flashcard breakdown */}
        {decks.length > 0 && (
          <div className="stats-section">
            <h2 className="stats-section-title">Flashcard Decks</h2>
            <div className="stats-table">
              <div className="stats-table-head">
                <span>Deck</span><span>Easy / Hard / Unknown</span>
              </div>
              {decks.map((deck) => {
                const fp = progress.flashcards?.[deck.id] ?? { easy: [], hard: [], unknown: [] };
                const total = fp.easy.length + fp.hard.length + fp.unknown.length;
                const easyPct = total ? (fp.easy.length / total) * 100 : 0;
                const hardPct = total ? (fp.hard.length / total) * 100 : 0;
                const unknownPct = total ? (fp.unknown.length / total) * 100 : 0;
                return (
                  <Link key={deck.id} href={`/flashcards/${deck.id}`} className="stats-table-row">
                    <span className="strow-title"><Layers size={14} /> {deck.title}</span>
                    <span className="strow-fc-bar">
                      {total > 0 ? (
                        <span className="fc-tri-bar">
                          <span style={{ width: `${easyPct}%` }} className="fc-tri-easy" />
                          <span style={{ width: `${hardPct}%` }} className="fc-tri-hard" />
                          <span style={{ width: `${unknownPct}%` }} className="fc-tri-unknown" />
                        </span>
                      ) : <span className="strow-score">Not started</span>}
                      {total > 0 && <span className="fc-tri-labels">{fp.easy.length}e · {fp.hard.length}h · {fp.unknown.length}?</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
