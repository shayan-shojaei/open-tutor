"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import type { QuizConfig, StandaloneQuizQuestion } from "@/lib/types";
import { useDataProvider } from "@/lib/data";
import { useStudioDoc, ConflictBanner, type DocHandle } from "@/components/studio/useStudioDoc";
import { ItemListEditor, StandaloneQuestionForm, nextId } from "@/components/studio/ItemListEditor";

export default function QuizEditor({ quizId }: { quizId: string }) {
  const dp = useDataProvider();

  const config = useStudioDoc<QuizConfig>(
    useMemo(() => ({ kind: "quiz-config", quizId }), [quizId]),
    { active: false }
  );
  const questions = useStudioDoc<StandaloneQuizQuestion[]>(
    useMemo(() => ({ kind: "quiz-questions", quizId }), [quizId]),
    { active: false, fallback: [] }
  );

  const docs: DocHandle[] = [config, questions];
  const anyDocDirty = docs.some((d) => d.dirty);
  const anySaving = docs.some((d) => d.saving);

  async function saveAll() {
    for (const d of docs) if (d.dirty) await d.save();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveAll();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!dp.canEdit) return null;
  if (!config.loaded) return <div className="app-main"><div className="page"><p className="studio-empty">Loading…</p></div></div>;
  if (!config.value) return <div className="app-main"><div className="page"><p className="studio-error">Quiz “{quizId}” not found.</p></div></div>;

  const cfg = config.value;
  const dir = cfg.language === "fa" ? "rtl" : "ltr";

  function update(patch: Partial<QuizConfig>) {
    config.setValue({ ...cfg, ...patch });
  }

  const defaultQuestionType = cfg.questionType === "written" ? "written" : "multiple-choice";

  return (
    <div className="app-main">
      <div className="page">
        <div className="studio-editor-head" style={{ marginBottom: 20 }}>
          <div className="studio-rail-head">
            <Link href="/studio" className="btn-ghost studio-row-btn" title="Back to Studio"><ArrowLeft size={14} /></Link>
            <Link href={`/quizzes/${quizId}`} className="btn-ghost studio-row-btn" title="View quiz"><ExternalLink size={14} /></Link>
            <span className="studio-row-id">{quizId}</span>
          </div>
          <button className="btn-ghost studio-save" onClick={saveAll} disabled={!anyDocDirty || anySaving}>
            <Save size={14} />
            {anySaving ? "Saving…" : anyDocDirty ? "Save" : "Saved"}
          </button>
        </div>

        <ConflictBanner doc={config} what="quiz config" />
        <ConflictBanner doc={questions} what="question list" />

        <div className="studio-new studio-form">
          <div className="studio-new-grid">
            <label>
              Title
              <input value={cfg.title} onChange={(e) => update({ title: e.target.value })} />
            </label>
            <label>
              Subject
              <select value={cfg.subject} onChange={(e) => update({ subject: e.target.value as QuizConfig["subject"] })}>
                <option value="math">math</option>
                <option value="programming">programming</option>
                <option value="general">general</option>
              </select>
            </label>
            <label>
              Language
              <select value={cfg.language} onChange={(e) => update({ language: e.target.value as QuizConfig["language"] })}>
                <option value="en">en</option>
                <option value="fa">fa</option>
              </select>
            </label>
            <label>
              Question type
              <select value={cfg.questionType} onChange={(e) => update({ questionType: e.target.value as QuizConfig["questionType"] })}>
                <option value="multiple-choice">multiple-choice</option>
                <option value="written">written</option>
                <option value="mixed">mixed</option>
              </select>
            </label>
            <label className="studio-new-desc">
              Description
              <input value={cfg.description} onChange={(e) => update({ description: e.target.value })} />
            </label>
          </div>
        </div>

        <ItemListEditor
          items={questions.value ?? []}
          onChange={questions.setValue}
          newItem={(items) =>
            defaultQuestionType === "written"
              ? { id: nextId(items, "q"), type: "written" as const, question: "", answer: "" }
              : {
                  id: nextId(items, "q"),
                  type: "multiple-choice" as const,
                  question: "",
                  options: ["", "", "", ""],
                  correctIndex: 0,
                }
          }
          itemLabel={(_, i) => `Question ${i + 1}`}
          addLabel="Add question"
          renderItem={(item, update) => <StandaloneQuestionForm item={item} update={update} dir={dir} />}
        />
      </div>
    </div>
  );
}
