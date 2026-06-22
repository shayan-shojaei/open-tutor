"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { SelectionToolbar } from "./SelectionToolbar";
import { AnnotationPopover } from "./AnnotationPopover";
import { useDataProvider } from "@/lib/data";
import type { Annotation } from "@/lib/types";

interface AnnotatableContentProps {
  content: string;
  dir?: "ltr" | "rtl";
  className?: string;
  courseId: string;
  sectionId: string;
  surface: Annotation["surface"];
}

export interface PlainRect {
  top: number; left: number; bottom: number; right: number; width: number; height: number;
}

function toPlainRect(r: DOMRect): PlainRect {
  return { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height };
}

interface PendingSelection {
  rect: PlainRect;
  startOffset: number;
  endOffset: number;
  prefix: string;
  suffix: string;
  selectedText: string;
}

// Index entries: normal text nodes OR entire KaTeX elements treated as atomic units.
// Wrapping KaTeX internals breaks rendering; wrapping the whole .katex span is safe.
type IndexEntry =
  | { kind: "text"; node: Text;        start: number; end: number }
  | { kind: "katex"; el: HTMLElement;  start: number; end: number };

function buildTextIndex(container: HTMLElement): IndexEntry[] {
  const result: IndexEntry[] = [];
  let offset = 0;

  function walk(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      // Skip code blocks entirely — they have no annotatable prose
      if (el.tagName === "PRE") return;
      // Treat each .katex element as an opaque unit with the length of its visible text
      if (el.classList.contains("katex")) {
        const htmlPart = el.querySelector(".katex-html");
        const len = (htmlPart ?? el).textContent?.length ?? 0;
        if (len > 0) {
          result.push({ kind: "katex", el, start: offset, end: offset + len });
          offset += len;
        }
        return; // don't recurse into KaTeX internals
      }
      for (const child of Array.from(node.childNodes)) walk(child);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const len = text.textContent?.length ?? 0;
      if (len > 0) {
        result.push({ kind: "text", node: text, start: offset, end: offset + len });
        offset += len;
      }
    }
  }

  walk(container);
  return result;
}

// Maps a DOM boundary point (node, offset) to an absolute char position in the index stream.
// snapEnd: when the boundary lands inside a KaTeX element, snap to its end (include it fully)
// rather than its start.
function pointToTextOffset(
  container: HTMLElement,
  node: Node,
  nodeOffset: number,
  index: IndexEntry[],
  snapEnd = false,
): number {
  // If the boundary is inside a KaTeX subtree, find that KaTeX entry and snap
  let p = node instanceof Text ? node.parentElement : (node as HTMLElement | null);
  while (p && p !== container) {
    if (p.classList.contains("katex")) {
      const entry = index.find(e => e.kind === "katex" && e.el === p);
      if (!entry) return -1;
      return snapEnd ? entry.end : entry.start;
    }
    p = p.parentElement;
  }

  // Fast path: text node boundary
  if (node.nodeType === Node.TEXT_NODE) {
    const entry = index.find(e => e.kind === "text" && e.node === (node as Text));
    return entry ? entry.start + nodeOffset : -1;
  }

  // Element boundary: create a measuring range from container start to this point
  const measure = document.createRange();
  try {
    measure.setStart(container, 0);
    measure.setEnd(node, nodeOffset);
  } catch {
    return -1;
  }

  let result = 0;
  for (const entry of index) {
    try {
      if (entry.kind === "text") {
        const atStart = measure.comparePoint(entry.node, 0);
        if (atStart > 0) break;
        const atEnd = measure.comparePoint(entry.node, entry.node.length);
        if (atEnd <= 0) {
          result = entry.end;
        } else {
          result = measure.endContainer === entry.node
            ? entry.start + measure.endOffset
            : entry.end;
          break;
        }
      } else {
        // KaTeX entry: check if it's entirely before the boundary
        const atStart = measure.comparePoint(entry.el, 0);
        if (atStart > 0) break;
        result = entry.end;
      }
    } catch { continue; }
  }
  return result;
}

function selectionToOffsets(
  container: HTMLElement,
  range: Range,
): { startOffset: number; endOffset: number; prefix: string; suffix: string } | null {
  const index = buildTextIndex(container);
  const startOffset = pointToTextOffset(container, range.startContainer, range.startOffset, index, false);
  const endOffset   = pointToTextOffset(container, range.endContainer,   range.endOffset,   index, true);
  if (startOffset < 0 || endOffset < 0 || startOffset >= endOffset) return null;

  const fullText = index
    .map(e => e.kind === "text" ? e.node.textContent! : (e.el.querySelector(".katex-html") ?? e.el).textContent!)
    .join("");
  return {
    startOffset,
    endOffset,
    prefix: fullText.slice(Math.max(0, startOffset - 30), startOffset),
    suffix: fullText.slice(endOffset, endOffset + 30),
  };
}

function makeMark(ann: Annotation): HTMLElement {
  const mark = document.createElement("mark");
  mark.className = `annotation-mark annotation-${ann.color}`;
  mark.dataset.annotationId = ann.id;
  if (ann.note) mark.dataset.hasNote = "true";
  return mark;
}

// Wrap every index entry overlapping [ann.startOffset, ann.endOffset].
// Text entries: split the text node and wrap the segment.
// KaTeX entries: wrap the entire .katex element (preserves rendering).
// Processes right-to-left so earlier offsets stay stable after splits.
function wrapSegments(container: HTMLElement, ann: Annotation) {
  const index = buildTextIndex(container);
  if (!index.length) return;
  const totalLen = index[index.length - 1].end;
  if (ann.startOffset >= ann.endOffset || ann.endOffset > totalLen) return;

  const overlapping = index
    .filter(e => e.end > ann.startOffset && e.start < ann.endOffset)
    .reverse();

  for (const entry of overlapping) {
    if (entry.kind === "text") {
      const { node, start, end } = entry;
      const localStart = Math.max(ann.startOffset, start) - start;
      const localEnd   = Math.min(ann.endOffset,   end)   - start;
      if (localStart >= localEnd) continue;

      let target: Text = node;
      if (localEnd < node.length) target.splitText(localEnd);
      if (localStart > 0) target = target.splitText(localStart);

      const mark = makeMark(ann);
      target.parentNode!.insertBefore(mark, target);
      mark.appendChild(target);
    } else {
      // KaTeX: wrap the whole element without touching its internals
      const mark = makeMark(ann);
      mark.style.display = "inline";
      entry.el.parentNode!.insertBefore(mark, entry.el);
      mark.appendChild(entry.el);
    }
  }
}

function applyAnnotationMarks(container: HTMLElement, annotations: Annotation[]) {
  container.normalize();

  container.querySelectorAll(".annotation-mark").forEach(mark => {
    const parent = mark.parentNode!;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });

  container.normalize();

  if (!annotations.length) return;

  [...annotations]
    .sort((a, b) => b.startOffset - a.startOffset)
    .forEach(ann => wrapSegments(container, ann));
}

// Only block selections inside <pre> (code blocks). KaTeX is now annotatable.
function isInsidePre(node: Node | null, container: HTMLElement): boolean {
  let p = node instanceof Text ? node.parentElement : (node as HTMLElement | null);
  while (p && p !== container) {
    if (p.tagName === "PRE") return true;
    p = p.parentElement;
  }
  return false;
}

export function AnnotatableContent({
  content,
  dir = "ltr",
  className,
  courseId,
  sectionId,
  surface,
}: AnnotatableContentProps) {
  const dp = useDataProvider();
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [toolbar, setToolbar] = useState<PendingSelection | null>(null);
  const [popover, setPopover] = useState<{ annotation: Annotation; rect: PlainRect } | null>(null);

  useEffect(() => {
    dp.getAnnotationsForSurface(courseId, sectionId, surface).then(setAnnotations);
  }, [courseId, sectionId, surface, dp]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    applyAnnotationMarks(el, annotations);
  }, [annotations, content]);

  // Coordinate hover highlight across all mark segments belonging to the same annotation.
  // CSS :hover only fires on one element at a time; this syncs the .is-hovered class across all.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let currentId: string | null = null;

    function syncHover(newId: string | null) {
      if (newId === currentId) return;
      if (currentId) {
        container!.querySelectorAll(`[data-annotation-id="${currentId}"]`)
          .forEach(el => el.classList.remove("is-hovered"));
      }
      currentId = newId;
      if (newId) {
        container!.querySelectorAll(`[data-annotation-id="${newId}"]`)
          .forEach(el => el.classList.add("is-hovered"));
      }
    }

    function onMouseOver(e: MouseEvent) {
      const mark = (e.target as HTMLElement).closest(".annotation-mark") as HTMLElement | null;
      syncHover(mark?.dataset.annotationId ?? null);
    }

    container.addEventListener("mouseover", onMouseOver);
    return () => container.removeEventListener("mouseover", onMouseOver);
  }, []); // container ref is stable

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest(".annotation-toolbar") || t.closest(".annotation-popover") || t.closest(".annotation-mark")) return;
      setToolbar(null);
      setPopover(null);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const refreshAnnotations = useCallback(() => {
    dp.getAnnotationsForSurface(courseId, sectionId, surface).then(setAnnotations);
  }, [courseId, sectionId, surface, dp]);

  function handleMouseUp(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const mark = target.closest(".annotation-mark") as HTMLElement | null;
    if (mark) {
      const ann = annotations.find(a => a.id === mark.dataset.annotationId);
      if (ann) {
        setToolbar(null);
        setPopover({ annotation: ann, rect: toPlainRect(mark.getBoundingClientRect()) });
        return;
      }
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setToolbar(null); return; }

    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) { setToolbar(null); return; }

    if (isInsidePre(range.startContainer, container) || isInsidePre(range.endContainer, container)) {
      setToolbar(null);
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText) { setToolbar(null); return; }

    const offsets = selectionToOffsets(container, range);
    if (!offsets) { setToolbar(null); return; }

    setPopover(null);
    setToolbar({ rect: toPlainRect(range.getBoundingClientRect()), selectedText, ...offsets });
  }

  async function handleAnnotate(color: Annotation["color"], note?: string) {
    if (!toolbar) return;
    await dp.saveAnnotation({
      id: crypto.randomUUID(),
      courseId, sectionId, surface,
      selectedText: toolbar.selectedText,
      note, color,
      createdAt: Date.now(),
      startOffset: toolbar.startOffset,
      endOffset: toolbar.endOffset,
      prefix: toolbar.prefix,
      suffix: toolbar.suffix,
    });
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
    refreshAnnotations();
  }

  async function handleUpdate(changes: Partial<Pick<Annotation, "note" | "color">>) {
    if (!popover) return;
    await dp.updateAnnotation(popover.annotation.id, changes);
    refreshAnnotations();
  }

  async function handleDelete() {
    if (!popover) return;
    await dp.deleteAnnotation(popover.annotation.id);
    setPopover(null);
    refreshAnnotations();
  }

  return (
    <>
      <div key={content} ref={containerRef} onMouseUp={handleMouseUp}>
        <MarkdownRenderer content={content} dir={dir} className={className} />
      </div>

      {toolbar && createPortal(
        <SelectionToolbar
          rect={toolbar.rect}
          onAnnotate={handleAnnotate}
          onDismiss={() => { window.getSelection()?.removeAllRanges(); setToolbar(null); }}
        />,
        document.body
      )}

      {popover && createPortal(
        <AnnotationPopover
          annotation={popover.annotation}
          rect={popover.rect}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setPopover(null)}
        />,
        document.body
      )}
    </>
  );
}
