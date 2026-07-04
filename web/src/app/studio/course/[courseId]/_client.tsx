"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { CourseConfig, Problem, QuizQuestion } from "@/lib/types";
import { useDataProvider } from "@/lib/data";
import {
  useStudioDoc,
  slugify,
  ConflictBanner,
  type DocHandle,
} from "@/components/studio/useStudioDoc";
import { MarkdownEditor } from "@/components/studio/MarkdownEditor";
import {
  ItemListEditor,
  ProblemForm,
  QuizQuestionForm,
  nextId,
} from "@/components/studio/ItemListEditor";

type Tab = "lesson" | "problems" | "quiz" | "recap" | "recap-quiz";
const TABS: { id: Tab; label: string }[] = [
  { id: "lesson", label: "Lesson" },
  { id: "problems", label: "Problems" },
  { id: "quiz", label: "Quiz" },
  { id: "recap", label: "Recap" },
  { id: "recap-quiz", label: "Recap Quiz" },
];

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function CourseEditor({ courseId }: { courseId: string }) {
  const dp = useDataProvider();
  const router = useRouter();

  const config = useStudioDoc<CourseConfig>(
    useMemo(() => ({ kind: "course-config", courseId }), [courseId]),
    { active: false }
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("lesson");

  // Section docs — all mounted so edits survive tab switches within a section.
  const secRef = (kind: "lesson" | "section-quiz" | "problems" | "recap-lesson" | "recap-quiz") =>
    selected ? { kind, courseId, sectionId: selected } : null;
  const lesson = useStudioDoc<string>(
    useMemo(() => secRef("lesson"), [courseId, selected]), // eslint-disable-line react-hooks/exhaustive-deps
    { active: false, fallback: "" }
  );
  const problems = useStudioDoc<Problem[]>(
    useMemo(() => secRef("problems"), [courseId, selected]), // eslint-disable-line react-hooks/exhaustive-deps
    { active: false, fallback: [] }
  );
  const quiz = useStudioDoc<QuizQuestion[]>(
    useMemo(() => secRef("section-quiz"), [courseId, selected]), // eslint-disable-line react-hooks/exhaustive-deps
    { active: false, fallback: [] }
  );
  const recapLesson = useStudioDoc<string>(
    useMemo(() => secRef("recap-lesson"), [courseId, selected]), // eslint-disable-line react-hooks/exhaustive-deps
    { active: false, fallback: "" }
  );
  const recapQuiz = useStudioDoc<QuizQuestion[]>(
    useMemo(() => secRef("recap-quiz"), [courseId, selected]), // eslint-disable-line react-hooks/exhaustive-deps
    { active: false, fallback: [] }
  );

  const sectionDocs: DocHandle[] = [lesson, problems, quiz, recapLesson, recapQuiz];
  const allDocs: DocHandle[] = [config, ...sectionDocs];
  const anyDocDirty = allDocs.some((d) => d.dirty);
  const anySaving = allDocs.some((d) => d.saving);

  // Default selection: first section of the course.
  useEffect(() => {
    if (!selected && config.value) {
      const first = config.value.chapters.flatMap((c) => c.sections)[0];
      if (first) setSelected(first.id);
    }
  }, [config.value, selected]);

  async function saveAll() {
    for (const d of allDocs) {
      if (d.dirty) await d.save();
    }
  }

  // Cmd/Ctrl+S saves everything dirty (config + current section docs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveAll();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // no deps: re-binds each render so saveAll sees fresh state; cheap.

  if (!dp.canEdit) return null;
  if (!config.loaded) return <div className="app-main"><div className="page"><p className="studio-empty">Loading…</p></div></div>;
  if (!config.value) return <div className="app-main"><div className="page"><p className="studio-error">Course “{courseId}” not found.</p></div></div>;

  const cfg = config.value;
  const dir = cfg.language === "fa" ? "rtl" : "ltr";
  const selectedMeta = cfg.chapters.flatMap((c) => c.sections).find((s) => s.id === selected);

  function updateConfig(mutate: (draft: CourseConfig) => void) {
    const draft = structuredClone(cfg);
    mutate(draft);
    config.setValue(draft);
  }

  function selectSection(id: string) {
    if (id === selected) return;
    const sectionDirty = sectionDocs.some((d) => d.dirty);
    if (sectionDirty && !window.confirm("This section has unsaved changes. Discard them?")) return;
    setSelected(id);
  }

  function uniqueSlug(title: string, taken: Set<string>): string {
    const base = slugify(title) || "untitled";
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    return id;
  }

  function addChapter() {
    const title = window.prompt("Chapter title:");
    if (!title) return;
    const taken = new Set(cfg.chapters.map((c) => c.id));
    taken.add("recap"); // reserved: collides with /learn/{courseId}/recap
    const id = uniqueSlug(title, taken);
    updateConfig((d) => d.chapters.push({ id, title, sections: [] }));
  }

  function addSection(chapterId: string) {
    const title = window.prompt("Section title:");
    if (!title) return;
    const taken = new Set(cfg.chapters.flatMap((c) => c.sections.map((s) => s.id)));
    const id = uniqueSlug(title, taken);
    updateConfig((d) => {
      d.chapters.find((c) => c.id === chapterId)!.sections.push({ id, title, chapterId });
    });
    setSelected(id);
  }

  function removeChapter(chapterId: string, title: string) {
    if (!window.confirm(`Delete chapter "${title}" and all its section files?`)) return;
    dp.deleteChapter(courseId, chapterId).then(() => {
      if (selectedMeta?.chapterId === chapterId) setSelected(null);
      config.reload();
    }, (e) => window.alert(String(e)));
  }

  function removeSection(sectionId: string, title: string) {
    if (!window.confirm(`Delete section "${title}" and its lesson/quiz/problem files?`)) return;
    dp.deleteSection(courseId, sectionId).then(() => {
      if (selected === sectionId) setSelected(null);
      config.reload();
    }, (e) => window.alert(String(e)));
  }

  // Recap exists once its .md is on disk (or drafted); the two recap tabs share this.
  const recapMissing =
    (tab === "recap" || tab === "recap-quiz") && recapLesson.missing && !recapLesson.dirty;

  function removeRecap() {
    if (!selected) return;
    if (!window.confirm("Delete this section's recap (summary and recap quiz)?")) return;
    dp.deleteRecap(courseId, selected).then(() => {
      recapLesson.reload();
      recapQuiz.reload();
    }, (e) => window.alert(String(e)));
  }

  const activeDoc: DocHandle =
    tab === "lesson" ? lesson : tab === "problems" ? problems : tab === "quiz" ? quiz : tab === "recap" ? recapLesson : recapQuiz;

  return (
    <div className="app-main">
      <div className="studio-editor">
        <aside className="studio-rail studio-form">
          <div className="studio-rail-head">
            <Link href="/studio" className="btn-ghost studio-row-btn" title="Back to Studio">
              <ArrowLeft size={14} />
            </Link>
            <Link href={`/learn/${courseId}`} className="btn-ghost studio-row-btn" title="View as learner">
              <ExternalLink size={14} />
            </Link>
            <span className="studio-row-id">{courseId}</span>
          </div>

          <label>
            Title
            <input value={cfg.title} onChange={(e) => updateConfig((d) => { d.title = e.target.value; })} />
          </label>
          <label>
            Description
            <textarea rows={3} value={cfg.description} onChange={(e) => updateConfig((d) => { d.description = e.target.value; })} />
          </label>
          <div className="studio-rail-row">
            <label>
              Subject
              <select value={cfg.subject} onChange={(e) => updateConfig((d) => { d.subject = e.target.value as CourseConfig["subject"]; })}>
                <option value="math">math</option>
                <option value="programming">programming</option>
                <option value="general">general</option>
              </select>
            </label>
            <label>
              Icon
              <input value={cfg.icon} maxLength={4} onChange={(e) => updateConfig((d) => { d.icon = e.target.value; })} />
            </label>
            <label>
              Language
              <select value={cfg.language} onChange={(e) => updateConfig((d) => { d.language = e.target.value as CourseConfig["language"]; })}>
                <option value="en">en</option>
                <option value="fa">fa</option>
              </select>
            </label>
          </div>

          <div className="studio-tree">
            {cfg.chapters.map((ch, ci) => (
              <div key={ch.id} className="studio-tree-chapter">
                <div className="studio-tree-row studio-tree-chapter-row">
                  <input
                    value={ch.title}
                    onChange={(e) => updateConfig((d) => { d.chapters[ci].title = e.target.value; })}
                  />
                  <button title="Move up" disabled={ci === 0} onClick={() => updateConfig((d) => { d.chapters = move(d.chapters, ci, ci - 1); })}><ChevronUp size={13} /></button>
                  <button title="Move down" disabled={ci === cfg.chapters.length - 1} onClick={() => updateConfig((d) => { d.chapters = move(d.chapters, ci, ci + 1); })}><ChevronDown size={13} /></button>
                  <button title="Delete chapter" className="studio-danger" onClick={() => removeChapter(ch.id, ch.title)}><Trash2 size={13} /></button>
                </div>
                {ch.sections.map((s, si) => (
                  <div
                    key={s.id}
                    className={`studio-tree-row studio-tree-section${s.id === selected ? " is-active" : ""}`}
                    onClick={() => selectSection(s.id)}
                  >
                    <input
                      value={s.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateConfig((d) => { d.chapters[ci].sections[si].title = e.target.value; })}
                    />
                    <button title="Move up" disabled={si === 0} onClick={(e) => { e.stopPropagation(); updateConfig((d) => { d.chapters[ci].sections = move(d.chapters[ci].sections, si, si - 1); }); }}><ChevronUp size={13} /></button>
                    <button title="Move down" disabled={si === ch.sections.length - 1} onClick={(e) => { e.stopPropagation(); updateConfig((d) => { d.chapters[ci].sections = move(d.chapters[ci].sections, si, si + 1); }); }}><ChevronDown size={13} /></button>
                    <button title="Delete section" className="studio-danger" onClick={(e) => { e.stopPropagation(); removeSection(s.id, s.title); }}><Trash2 size={13} /></button>
                  </div>
                ))}
                <button className="studio-tree-add" onClick={() => addSection(ch.id)}>
                  <Plus size={12} /> section
                </button>
              </div>
            ))}
            <button className="studio-tree-add" onClick={addChapter}>
              <Plus size={12} /> chapter
            </button>
          </div>
        </aside>

        <main className="studio-editor-main">
          <div className="studio-editor-head">
            <div className="studio-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`studio-tab${tab === t.id ? " is-active" : ""}`}
                  onClick={() => setTab(t.id)}
                  disabled={!selected}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button className="btn-ghost studio-save" onClick={saveAll} disabled={!anyDocDirty || anySaving}>
              <Save size={14} />
              {anySaving ? "Saving…" : anyDocDirty ? "Save" : "Saved"}
            </button>
          </div>

          <ConflictBanner doc={config} what="course structure" />
          <ConflictBanner doc={activeDoc} what={TABS.find((t) => t.id === tab)!.label.toLowerCase()} />

          {!selected || !selectedMeta ? (
            <p className="studio-empty">Select or add a section to start writing.</p>
          ) : !activeDoc.loaded ? (
            <p className="studio-empty">Loading…</p>
          ) : tab === "lesson" ? (
            <MarkdownEditor
              value={lesson.value ?? ""}
              onChange={lesson.setValue}
              courseId={courseId}
              dir={dir}
            />
          ) : tab === "problems" ? (
            <ItemListEditor
              items={problems.value ?? []}
              onChange={problems.setValue}
              newItem={(items) => ({ id: nextId(items, "p"), statement: "", solution: "", answer: "" })}
              itemLabel={(_, i) => `Problem ${i + 1}`}
              addLabel="Add problem"
              renderItem={(item, update) => <ProblemForm item={item} update={update} dir={dir} />}
            />
          ) : tab === "quiz" ? (
            <ItemListEditor
              items={quiz.value ?? []}
              onChange={quiz.setValue}
              newItem={(items) => ({
                id: nextId(items, "q"),
                type: "multiple-choice" as const,
                question: "",
                options: ["", "", "", ""],
                correctIndex: 0,
                explanation: "",
              })}
              itemLabel={(_, i) => `Question ${i + 1}`}
              addLabel="Add question"
              renderItem={(item, update) => <QuizQuestionForm item={item} update={update} dir={dir} />}
            />
          ) : recapMissing ? (
            <div className="studio-recap-empty">
              <p className="studio-empty">
                No recap for this section yet. A recap is a condensed summary with its own quiz,
                shown under the course&apos;s Recap button.
              </p>
              <button
                className="btn-ghost"
                onClick={() => {
                  recapLesson.setValue(`# ${selectedMeta.title} — Recap\n\n`);
                  setTab("recap");
                }}
              >
                Create recap
              </button>
            </div>
          ) : tab === "recap" ? (
            <>
              <MarkdownEditor
                value={recapLesson.value ?? ""}
                onChange={recapLesson.setValue}
                courseId={courseId}
                dir={dir}
              />
              <button className="btn-ghost studio-danger studio-recap-delete" onClick={removeRecap}>
                <Trash2 size={14} /> Delete this section&apos;s recap
              </button>
            </>
          ) : (
            <ItemListEditor
              items={recapQuiz.value ?? []}
              onChange={recapQuiz.setValue}
              newItem={(items) => ({
                id: nextId(items, "rq"),
                type: "multiple-choice" as const,
                question: "",
                options: ["", "", "", ""],
                correctIndex: 0,
                explanation: "",
              })}
              itemLabel={(_, i) => `Question ${i + 1}`}
              addLabel="Add question"
              renderItem={(item, update) => <QuizQuestionForm item={item} update={update} dir={dir} />}
            />
          )}
        </main>
      </div>
    </div>
  );
}
