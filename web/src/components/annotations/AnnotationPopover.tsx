"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import type { Annotation } from "@/lib/types";

interface PlainRect {
  top: number; left: number; bottom: number; right: number; width: number; height: number;
}

interface AnnotationPopoverProps {
  annotation: Annotation;
  rect: PlainRect;
  onUpdate: (changes: Partial<Pick<Annotation, "note" | "color">>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const COLORS: { value: Annotation["color"]; label: string }[] = [
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
];

export function AnnotationPopover({
  annotation,
  rect,
  onUpdate,
  onDelete,
  onClose,
}: AnnotationPopoverProps) {
  const [note, setNote] = useState(annotation.note ?? "");
  const [color, setColor] = useState<Annotation["color"]>(annotation.color);

  const top = rect.bottom + 8;
  const left = Math.max(8, rect.left + rect.width / 2 - 150);

  function handleSave() {
    onUpdate({ note: note.trim() || undefined, color });
    onClose();
  }

  function handleColorChange(c: Annotation["color"]) {
    setColor(c);
    onUpdate({ color: c, note: note.trim() || undefined });
  }

  return (
    <div
      className="annotation-popover"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="annotation-popover-header">
        <div className="annotation-popover-swatches">
          {COLORS.map(({ value }) => (
            <button
              key={value}
              className={`annotation-swatch annotation-swatch-${value}${color === value ? " is-active" : ""}`}
              onClick={() => handleColorChange(value)}
              title={value}
            />
          ))}
        </div>
        <button className="annotation-toolbar-icon" onClick={onClose} title="Close">
          <X size={14} />
        </button>
      </div>

      <div className="annotation-popover-body">
        <blockquote className="annotation-popover-quote">
          {annotation.selectedText.length > 120
            ? annotation.selectedText.slice(0, 120) + "…"
            : annotation.selectedText}
        </blockquote>

        <textarea
          className="annotation-note-textarea"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>

      <div className="annotation-popover-actions">
        <button className="annotation-delete-btn" onClick={onDelete} title="Delete annotation">
          <Trash2 size={13} />
          Delete
        </button>
        <button className="annotation-save-btn" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
