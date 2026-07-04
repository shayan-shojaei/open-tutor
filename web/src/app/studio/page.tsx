"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Layers, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { useDataProvider } from "@/lib/data";
import type { ModuleType } from "@/lib/data/DataProvider";
import type { CourseSummary, FlashCardDeck, QuizConfig } from "@/lib/types";

// Next.js page files only allow framework exports, so these stay unexported.
const SLUG = /^[a-z0-9][a-z0-9._-]{0,63}$/;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

interface ModuleRow {
  id: string;
  title: string;
  description: string;
  language: "en" | "fa";
}

function ModuleList({
  title,
  icon,
  editHref,
  items,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  editHref: (id: string) => string;
  items: ModuleRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <section className="studio-group">
      <h2 className="studio-group-title">
        {icon} {title}
      </h2>
      {items.length === 0 ? (
        <p className="studio-empty">None yet.</p>
      ) : (
        <ul className="studio-list">
          {items.map((m) => (
            <li key={m.id} className="studio-row" dir={m.language === "fa" ? "rtl" : "ltr"}>
              <Link href={editHref(m.id)} className="studio-row-main">
                <span className="studio-row-title">{m.title}</span>
                <span className="studio-row-id">{m.id}</span>
              </Link>
              <Link href={editHref(m.id)} className="btn-ghost studio-row-btn" aria-label={`Edit ${m.title}`}>
                <Pencil size={14} />
              </Link>
              <button
                className="btn-ghost studio-row-btn studio-danger"
                aria-label={`Delete ${m.title}`}
                onClick={() => onDelete(m.id)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const TYPE_LABEL: Record<ModuleType, string> = {
  course: "Course",
  flashcards: "Flashcard deck",
  quizzes: "Quiz",
};

function NewModuleForm({ onCreated }: { onCreated: (type: ModuleType, id: string) => void }) {
  const dp = useDataProvider();
  const [type, setType] = useState<ModuleType>("course");
  const [title, setTitle] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("general");
  const [language, setLanguage] = useState<"en" | "fa">("en");
  const [icon, setIcon] = useState("📘");
  const [questionType, setQuestionType] = useState("multiple-choice");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveId = idTouched ? id : slugify(title);
  const idValid = SLUG.test(effectiveId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!idValid || busy) return;
    setBusy(true);
    setError(null);
    const config: Record<string, unknown> = { id: effectiveId, title, description, subject, language };
    if (type === "course") config.icon = icon;
    if (type === "quizzes") config.questionType = questionType;
    const res = await dp.createModule(type, config);
    setBusy(false);
    if (res.ok) onCreated(type, effectiveId);
    else setError(res.error ?? "Create failed");
  }

  return (
    <form className="studio-new" onSubmit={submit}>
      <h2 className="studio-group-title">
        <Plus size={16} /> New module
      </h2>
      <div className="studio-new-grid">
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as ModuleType)}>
            {Object.entries(TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Linear Algebra" />
        </label>
        <label>
          Id
          <input
            value={effectiveId}
            onChange={(e) => { setIdTouched(true); setId(e.target.value); }}
            placeholder="linear-algebra"
            className={effectiveId && !idValid ? "studio-invalid" : undefined}
          />
        </label>
        <label>
          Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="math">math</option>
            <option value="programming">programming</option>
            <option value="general">general</option>
          </select>
        </label>
        <label>
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value as "en" | "fa")}>
            <option value="en">English</option>
            <option value="fa">فارسی</option>
          </select>
        </label>
        {type === "course" && (
          <label>
            Icon
            <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
          </label>
        )}
        {type === "quizzes" && (
          <label>
            Question type
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
              <option value="multiple-choice">multiple-choice</option>
              <option value="written">written</option>
              <option value="mixed">mixed</option>
            </select>
          </label>
        )}
        <label className="studio-new-desc">
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        </label>
      </div>
      {error && <p className="studio-error">{error}</p>}
      <button type="submit" className="btn-ghost" disabled={!title || !idValid || busy}>
        {busy ? "Creating…" : `Create ${TYPE_LABEL[type].toLowerCase()}`}
      </button>
    </form>
  );
}

export default function StudioHome() {
  const dp = useDataProvider();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [decks, setDecks] = useState<FlashCardDeck[]>([]);
  const [quizzes, setQuizzes] = useState<QuizConfig[]>([]);

  const reload = useCallback(() => {
    dp.getCourseSummaries().then(setCourses);
    dp.getFlashCardDecks().then(setDecks);
    dp.getQuizSummaries().then(setQuizzes);
  }, [dp]);

  useEffect(reload, [reload]);

  const editorPath = useMemo(
    () => ({
      course: (id: string) => `/studio/course/${id}`,
      flashcards: (id: string) => `/studio/flashcards/${id}`,
      quizzes: (id: string) => `/studio/quizzes/${id}`,
    }),
    []
  );

  if (!dp.canEdit) return null;

  function confirmDelete(type: ModuleType, id: string, title: string) {
    if (!window.confirm(`Delete ${TYPE_LABEL[type].toLowerCase()} "${title}"?\n\nThis permanently removes its files.`)) return;
    dp.deleteModule(type, id).then(reload, (e) => window.alert(String(e)));
  }

  return (
    <div className="app-main">
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Studio</h1>
          <p className="page-sub">Create and edit courses, flashcard decks, and quizzes. Changes write straight to your modules directory.</p>
        </div>

        <NewModuleForm onCreated={(type, id) => router.push(editorPath[type](id))} />

        <ModuleList
          title="Courses"
          icon={<GraduationCap size={16} />}
          editHref={editorPath.course}
          items={courses}
          onDelete={(id) => confirmDelete("course", id, courses.find((c) => c.id === id)?.title ?? id)}
        />
        <ModuleList
          title="Flashcard decks"
          icon={<Layers size={16} />}
          editHref={editorPath.flashcards}
          items={decks}
          onDelete={(id) => confirmDelete("flashcards", id, decks.find((d) => d.id === id)?.title ?? id)}
        />
        <ModuleList
          title="Quizzes"
          icon={<ListChecks size={16} />}
          editHref={editorPath.quizzes}
          items={quizzes}
          onDelete={(id) => confirmDelete("quizzes", id, quizzes.find((q) => q.id === id)?.title ?? id)}
        />
      </div>
    </div>
  );
}
