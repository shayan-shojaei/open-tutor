"use client";

import { useDeferredValue, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Code,
  SquareCode,
  Sigma,
  SquareSigma,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { useDataProvider } from "@/lib/data";

const CODE_LANGUAGES = [
  "python", "javascript", "typescript", "go", "rust", "java", "c", "cpp",
  "bash", "sql", "html", "css", "json", "yaml", "text",
];

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  /** Enables the image-upload toolbar button. */
  courseId?: string;
  dir?: "ltr" | "rtl";
}

export function MarkdownEditor({ value, onChange, courseId, dir = "ltr" }: MarkdownEditorProps) {
  const dp = useDataProvider();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [codeLang, setCodeLang] = useState("python");
  const preview = useDeferredValue(value);

  /** Replace the current selection, then restore focus/selection. */
  function splice(build: (selected: string) => { text: string; cursorFrom: number; cursorTo: number }) {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const selected = value.slice(start, end);
    const { text, cursorFrom, cursorTo } = build(selected);
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + cursorFrom, start + cursorTo);
    });
  }

  function wrap(before: string, after: string, placeholder: string) {
    splice((sel) => {
      const inner = sel || placeholder;
      return {
        text: before + inner + after,
        cursorFrom: before.length,
        cursorTo: before.length + inner.length,
      };
    });
  }

  /** Prefix each selected line (headings, lists). */
  function prefixLines(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    // extend selection to full lines
    const start = value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
    let end = value.indexOf("\n", ta.selectionEnd);
    if (end === -1) end = value.length;
    const block = value
      .slice(start, end)
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : prefix + l))
      .join("\n");
    onChange(value.slice(0, start) + block + value.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start, start + block.length);
    });
  }

  function insertBlock(text: string, cursorFrom: number, cursorTo: number) {
    splice(() => ({ text, cursorFrom, cursorTo }));
  }

  async function uploadImage(file: File) {
    if (!courseId) return;
    try {
      const { url } = await dp.uploadCourseImage(courseId, file);
      insertBlock(`\n![caption](${url})\n`, 3, 10); // select "caption"
    } catch (e) {
      window.alert(String(e));
    }
  }

  const codeBlock = () =>
    splice((sel) => {
      const inner = sel || "code";
      const before = `\n\`\`\`${codeLang}\n`;
      return {
        text: `${before}${inner}\n\`\`\`\n`,
        cursorFrom: before.length,
        cursorTo: before.length + inner.length,
      };
    });

  return (
    <div className="studio-md">
      <div className="studio-md-toolbar">
        <button type="button" title="Bold" onClick={() => wrap("**", "**", "bold")}><Bold size={15} /></button>
        <button type="button" title="Italic" onClick={() => wrap("*", "*", "italic")}><Italic size={15} /></button>
        <button type="button" title="Heading 2" onClick={() => prefixLines("## ")}><Heading2 size={15} /></button>
        <button type="button" title="Heading 3" onClick={() => prefixLines("### ")}><Heading3 size={15} /></button>
        <button type="button" title="List" onClick={() => prefixLines("- ")}><List size={15} /></button>
        <span className="studio-md-sep" />
        <button type="button" title="Inline code" onClick={() => wrap("`", "`", "code")}><Code size={15} /></button>
        <button type="button" title={`Code block (${codeLang})`} onClick={codeBlock}><SquareCode size={15} /></button>
        <select
          className="studio-md-lang"
          value={codeLang}
          onChange={(e) => setCodeLang(e.target.value)}
          title="Code block language"
        >
          {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="studio-md-sep" />
        <button type="button" title="Inline math" onClick={() => wrap("$", "$", "x^2")}><Sigma size={15} /></button>
        <button type="button" title="Math block" onClick={() => wrap("\n$$\n", "\n$$\n", "f(x) = x^2")}><SquareSigma size={15} /></button>
        {courseId && (
          <>
            <span className="studio-md-sep" />
            <button type="button" title="Insert image" onClick={() => fileRef.current?.click()}><ImageIcon size={15} /></button>
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
      <div className="studio-md-panes">
        <textarea
          ref={taRef}
          className="studio-md-source"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          dir={dir === "rtl" ? "auto" : "ltr"}
        />
        <div className="studio-md-preview">
          <MarkdownRenderer content={preview} dir={dir} />
        </div>
      </div>
    </div>
  );
}

/** Compact markdown field for structured forms: textarea with a preview toggle. */
export function MarkdownField({
  value,
  onChange,
  label,
  rows = 3,
  dir = "ltr",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  rows?: number;
  dir?: "ltr" | "rtl";
}) {
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="studio-field">
      <div className="studio-field-head">
        {label && <span>{label}</span>}
        <button
          type="button"
          className="studio-field-eye"
          title={showPreview ? "Edit" : "Preview"}
          onClick={() => setShowPreview((p) => !p)}
        >
          {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      {showPreview ? (
        <div className="studio-field-preview">
          <MarkdownRenderer content={value} dir={dir} />
        </div>
      ) : (
        <textarea value={value} rows={rows} dir={dir === "rtl" ? "auto" : "ltr"} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
