"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Flame, Zap, BarChart2 } from "lucide-react";
import { useFontSize } from "@/lib/useFontSize";
import { useEffect, useState } from "react";
import { getGamification, isStreakAtRisk } from "@/lib/gamification";
import type { GamificationState } from "@/lib/types";

function GamificationBadge() {
  const [state, setState] = useState<GamificationState | null>(null);

  useEffect(() => {
    setState(getGamification());
    const id = setInterval(() => setState(getGamification()), 5000);
    return () => clearInterval(id);
  }, []);

  if (!state || (state.xp === 0 && state.streak === 0)) return null;

  const atRisk = isStreakAtRisk(state);

  return (
    <div className="gamif-badge">
      {state.streak > 0 && (
        <span className={`gamif-streak${atRisk ? " at-risk" : ""}`} title={`${state.streak}-day streak${atRisk ? " — study today to keep it!" : ""}`}>
          <Flame size={14} />
          {state.streak}
        </span>
      )}
      <span className="gamif-xp" title={`Level ${state.level} · ${state.xp} XP total`}>
        <Zap size={13} />
        {state.xp.toLocaleString()} · Lv.{state.level}
      </span>
    </div>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const { currentSize, canDecrease, canIncrease, decrease, increase } = useFontSize();

  const isCourses = pathname === "/" || pathname.startsWith("/learn");
  const isFlashCards = pathname.startsWith("/flashcards");
  const isQuizzes = pathname.startsWith("/quizzes");
  const isStats = pathname.startsWith("/stats");
  const isLearnPage = pathname.startsWith("/learn/") && pathname.split("/").length > 3;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true"><BookOpen size={22} /></span>
          <span className="brand-name">Open Tutor</span>
        </Link>
        <nav className="nav-pills">
          <Link href="/" className={`nav-pill${isCourses ? " is-active" : ""}`}>
            Courses
          </Link>
          <Link href="/flashcards" className={`nav-pill${isFlashCards ? " is-active" : ""}`}>
            Flash Cards
          </Link>
          <Link href="/quizzes" className={`nav-pill${isQuizzes ? " is-active" : ""}`}>
            Quizzes
          </Link>
          <Link href="/stats" className={`nav-pill${isStats ? " is-active" : ""}`}>
            <BarChart2 size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Stats
          </Link>
        </nav>
        <div className="navbar-right">
          <GamificationBadge />
          {isLearnPage && (
            <div className="font-size-controls">
              <button onClick={decrease} disabled={!canDecrease} aria-label="Decrease font size">A−</button>
              <span className="font-size-label">{currentSize}px</span>
              <button onClick={increase} disabled={!canIncrease} aria-label="Increase font size">A+</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
