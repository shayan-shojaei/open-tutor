"use client";

import { useState } from "react";
import { X, MessageSquare } from "lucide-react";
import type { Annotation } from "@/lib/types";

interface PlainRect {
  top: number; left: number; bottom: number; right: number; width: number; height: number;
}

interface SelectionToolbarProps {
  rect: PlainRect;
  onAnnotate: (color: Annotation["color"], note?: string) => void;
  onDismiss: () => void;
}

const COLORS: { value: Annotation["color"]; label: string }[] = [
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
];

export function SelectionToolbar({ rect, onAnnotate, onDismiss }: SelectionToolbarProps) {
  const [noteMode, setNoteMode] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pendingColor, setPendingColor] = useState<Annotation["color"]>("yellow");

  const top = rect.bottom + 8;
  const left = Math.max(8, rect.left + rect.width / 2 - 120);

  function handleColorClick(color: Annotation["color"]) {
    if (noteMode) {
      onAnnotate(color, noteText.trim() || undefined);
    } else {
      onAnnotate(color);
    }
  }

  function handleNoteIcon(e: React.MouseEvent) {
    e.stopPropagation();
    setPendingColor("yellow");
    setNoteMode((m) => !m);
    setNoteText("");
  }

  function handleNoteSubmit() {
    onAnnotate(pendingColor, noteText.trim() || undefined);
  }

  return (
    <div
      className="annotation-toolbar"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {noteMode ? (
        <div className="annotation-toolbar-note">
          <div className="annotation-toolbar-swatches">
            {COLORS.map(({ value }) => (
              <button
                key={value}
                className={`annotation-swatch annotation-swatch-${value}${pendingColor === value ? " is-active" : ""}`}
                onClick={() => setPendingColor(value)}
                title={value}
              />
            ))}
          </div>
          <input
            className="annotation-note-input"
            placeholder="Add a note…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNoteSubmit()}
            autoFocus
          />
          <button className="annotation-toolbar-btn" onClick={handleNoteSubmit} title="Save">
            Save
          </button>
          <button className="annotation-toolbar-icon" onClick={onDismiss} title="Cancel">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="annotation-toolbar-row">
          {COLORS.map(({ value }) => (
            <button
              key={value}
              className={`annotation-swatch annotation-swatch-${value}`}
              onClick={() => handleColorClick(value)}
              title={`Highlight ${value}`}
            />
          ))}
          <div className="annotation-toolbar-divider" />
          <button
            className="annotation-toolbar-icon"
            onClick={handleNoteIcon}
            title="Highlight with note"
          >
            <MessageSquare size={14} />
          </button>
          <button className="annotation-toolbar-icon" onClick={onDismiss} title="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
