export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "auto" : "force-dynamic";

import Link from "next/link";
import { getCourseSummaries } from "@/lib/courses";
import type { CourseSummary } from "@/lib/types";

function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link href={`/learn/${course.id}`} className="cat-card" dir={course.language === "fa" ? "rtl" : "ltr"}>
      <div className="cat-card-top">
        <span className="cat-glyph">{course.icon}</span>
        <div className="cat-badges">
          {course.language === "fa" && <span className="lang-badge">فارسی</span>}
          <span className={`subject-badge subj-${course.subject}`}>
            <span className="subject-dot" />
            {course.subject}
          </span>
        </div>
      </div>
      <h2 className="cat-title">{course.title}</h2>
      <p className="cat-desc">{course.description}</p>
      <div className="cat-foot">
        <span className="cat-stat">{course.chapterCount} chapters</span>
        <span className="cat-sep">·</span>
        <span className="cat-stat">{course.sectionCount} sections</span>
        {course.language === "fa" && (
          <>
            <span className="cat-sep">·</span>
            <span className="cat-stat">فارسی</span>
          </>
        )}
      </div>
    </Link>
  );
}

function GettingStarted() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📚</div>
      <h2 className="empty-state-title">No courses yet</h2>
      <p className="empty-state-sub">
        Add your first course in one of two ways:
      </p>
      <div className="empty-state-options">
        <div className="empty-option">
          <div className="empty-option-label">Install from a repository</div>
          <p className="empty-option-desc">
            Add a community module repo, then install any course from it:
          </p>
          <pre className="empty-code">{`tutor repo add https://github.com/user/modules
tutor module search calculus
tutor module install user/modules calculus-101`}</pre>
        </div>
        <div className="empty-option-divider">or</div>
        <div className="empty-option">
          <div className="empty-option-label">Create with Claude Code skills</div>
          <p className="empty-option-desc">
            Open this project in Claude Code and run a skill to generate a course from scratch:
          </p>
          <pre className="empty-code">{`/new-course
/new-flash-card
/new-quiz`}</pre>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const courses = getCourseSummaries();

  return (
    <div className="app-main">
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Your Courses</h1>
          {courses.length > 0 && (
            <p className="page-sub">
              Select a course to start learning, or run{" "}
              <code className="cli">/new-course</code> in Claude Code to create a new one.
            </p>
          )}
        </div>

        {courses.length === 0 ? (
          <GettingStarted />
        ) : (
          <div className="cat-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            <div className="cat-card cat-empty">
              <span className="empty-glyph">✦</span>
              <span className="empty-head">Create a course</span>
              <span className="empty-cli">
                Run <code className="cli">/new-course</code> in Claude Code
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
