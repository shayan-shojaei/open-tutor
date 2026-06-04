"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useFontSize } from "@/lib/useFontSize";

export default function NavBar() {
  const pathname = usePathname();
  const { currentSize, canDecrease, canIncrease, decrease, increase } = useFontSize();

  const isCourses = pathname === "/" || pathname.startsWith("/learn");
  const isFlashCards = pathname.startsWith("/flashcards");
  const isQuizzes = pathname.startsWith("/quizzes");
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
        </nav>
        {isLearnPage && (
          <div className="font-size-controls">
            <button onClick={decrease} disabled={!canDecrease} aria-label="Decrease font size">A−</button>
            <span className="font-size-label">{currentSize}px</span>
            <button onClick={increase} disabled={!canIncrease} aria-label="Increase font size">A+</button>
          </div>
        )}
      </div>
    </header>
  );
}
