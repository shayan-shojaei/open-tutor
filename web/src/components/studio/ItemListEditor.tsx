"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { FlashCard, Problem, QuizQuestion, StandaloneQuizQuestion } from "@/lib/types";
import { MarkdownField } from "./MarkdownEditor";

/** Next free "p3"/"q7"-style id following the skills' naming convention. */
export function nextId(items: { id: string }[], prefix: string): string {
  let max = 0;
  for (const it of items) {
    const m = it.id.match(/(\d+)$/);
    if (it.id.startsWith(prefix) && m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${max + 1}`;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

interface ItemListEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: (items: T[]) => T;
  itemLabel: (item: T, index: number) => string;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel: string;
}

export function ItemListEditor<T extends { id: string }>({
  items,
  onChange,
  newItem,
  itemLabel,
  renderItem,
  addLabel,
}: ItemListEditorProps<T>) {
  return (
    <div className="studio-items">
      {items.length === 0 && <p className="studio-empty">Nothing here yet.</p>}
      {items.map((item, i) => (
        <div key={item.id} className="studio-item studio-form">
          <div className="studio-item-head">
            <span className="studio-item-label">{itemLabel(item, i)}</span>
            <span className="studio-row-id">{item.id}</span>
            <span style={{ flex: 1 }} />
            <button title="Move up" disabled={i === 0} onClick={() => onChange(move(items, i, i - 1))}><ChevronUp size={14} /></button>
            <button title="Move down" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, i + 1))}><ChevronDown size={14} /></button>
            <button
              title="Remove"
              className="studio-danger"
              onClick={() => {
                if (window.confirm(`Remove ${itemLabel(item, i)}?`)) {
                  onChange(items.filter((_, j) => j !== i));
                }
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
          {renderItem(
            item,
            (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))),
            i
          )}
        </div>
      ))}
      <button className="btn-ghost studio-item-add" onClick={() => onChange([...items, newItem(items)])}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

// ── Per-type item forms ───────────────────────────────────────────────────

interface FormProps<T> {
  item: T;
  update: (patch: Partial<T>) => void;
  dir?: "ltr" | "rtl";
}

/** Shared options + correct-answer editor for multiple-choice questions. */
function OptionsEditor({
  options,
  correctIndex,
  onChange,
  dir,
}: {
  options: string[];
  correctIndex: number;
  onChange: (options: string[], correctIndex: number) => void;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="studio-options">
      <span className="studio-options-label">Options (select the correct one)</span>
      {options.map((opt, i) => (
        <div key={i} className="studio-option">
          <input
            type="radio"
            checked={correctIndex === i}
            onChange={() => onChange(options, i)}
            title="Correct answer"
          />
          <div className="studio-option-field">
            <MarkdownField
              value={opt}
              rows={1}
              dir={dir}
              onChange={(v) => onChange(options.map((o, j) => (j === i ? v : o)), correctIndex)}
            />
          </div>
          <button
            title="Remove option"
            className="studio-danger"
            disabled={options.length <= 2}
            onClick={() => {
              const next = options.filter((_, j) => j !== i);
              onChange(next, Math.min(correctIndex > i ? correctIndex - 1 : correctIndex, next.length - 1));
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button className="studio-tree-add" onClick={() => onChange([...options, ""], correctIndex)}>
        <Plus size={12} /> option
      </button>
    </div>
  );
}

export function QuizQuestionForm({ item, update, dir }: FormProps<QuizQuestion>) {
  return (
    <>
      <MarkdownField label="Question" value={item.question} onChange={(v) => update({ question: v })} dir={dir} />
      <OptionsEditor
        options={item.options}
        correctIndex={item.correctIndex}
        onChange={(options, correctIndex) => update({ options, correctIndex })}
        dir={dir}
      />
      <MarkdownField label="Explanation" value={item.explanation} rows={2} onChange={(v) => update({ explanation: v })} dir={dir} />
    </>
  );
}

export function ProblemForm({ item, update, dir }: FormProps<Problem>) {
  return (
    <>
      <MarkdownField label="Statement" value={item.statement} onChange={(v) => update({ statement: v })} dir={dir} />
      <MarkdownField label="Hint (optional)" value={item.hint ?? ""} rows={2} onChange={(v) => update({ hint: v || undefined })} dir={dir} />
      <MarkdownField label="Solution" value={item.solution} rows={4} onChange={(v) => update({ solution: v })} dir={dir} />
      <label className="studio-field">
        Short answer
        <input value={item.answer} onChange={(e) => update({ answer: e.target.value })} />
      </label>
    </>
  );
}

export function FlashCardForm({ item, update, dir }: FormProps<FlashCard>) {
  return (
    <>
      <MarkdownField label="Front" value={item.front} onChange={(v) => update({ front: v })} dir={dir} />
      <MarkdownField label="Back" value={item.back} onChange={(v) => update({ back: v })} dir={dir} />
    </>
  );
}

export function StandaloneQuestionForm({ item, update, dir }: FormProps<StandaloneQuizQuestion>) {
  return (
    <>
      <label className="studio-field" style={{ maxWidth: 220 }}>
        Type
        <select
          value={item.type}
          onChange={(e) => {
            const type = e.target.value as StandaloneQuizQuestion["type"];
            // seed the fields the new type needs; stale ones are dropped on save by
            // being set to undefined
            if (type === "multiple-choice") {
              update({ type, options: item.options ?? ["", "", "", ""], correctIndex: item.correctIndex ?? 0, answer: undefined });
            } else {
              update({ type, answer: item.answer ?? "", options: undefined, correctIndex: undefined });
            }
          }}
        >
          <option value="multiple-choice">multiple-choice</option>
          <option value="written">written</option>
        </select>
      </label>
      <MarkdownField label="Question" value={item.question} onChange={(v) => update({ question: v })} dir={dir} />
      {item.type === "multiple-choice" ? (
        <OptionsEditor
          options={item.options ?? ["", "", "", ""]}
          correctIndex={item.correctIndex ?? 0}
          onChange={(options, correctIndex) => update({ options, correctIndex })}
          dir={dir}
        />
      ) : (
        <MarkdownField label="Expected answer" value={item.answer ?? ""} rows={2} onChange={(v) => update({ answer: v })} dir={dir} />
      )}
      <MarkdownField label="Explanation (optional)" value={item.explanation ?? ""} rows={2} onChange={(v) => update({ explanation: v || undefined })} dir={dir} />
    </>
  );
}
