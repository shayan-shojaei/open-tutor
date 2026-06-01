"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();

  const isCourses = pathname === "/" || pathname.startsWith("/learn");
  const isFlashCards = pathname.startsWith("/flashcards");
  const isQuizzes = pathname.startsWith("/quizzes");

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
      </div>
    </header>
  );
}
