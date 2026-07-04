"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDataProvider } from "@/lib/data";
import type { StudioDocRef } from "@/lib/data/DataProvider";

export const SLUG = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

// ── Global unsaved-changes guard ──────────────────────────────────────────
// One window-level guard shared by every mounted doc: warn on tab close and
// on in-app <a> navigation while anything is dirty (the app router has no
// route-change event to hook instead).

const dirtyDocs = new Set<string>();

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = "";
}

function onLinkClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest?.("a[href]");
  if (!a) return;
  if (!window.confirm("You have unsaved changes. Leave without saving?")) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function setDocDirty(id: string, dirty: boolean) {
  const wasEmpty = dirtyDocs.size === 0;
  if (dirty) dirtyDocs.add(id);
  else dirtyDocs.delete(id);
  if (wasEmpty && dirtyDocs.size > 0) {
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onLinkClick, true);
  } else if (!wasEmpty && dirtyDocs.size === 0) {
    window.removeEventListener("beforeunload", onBeforeUnload);
    document.removeEventListener("click", onLinkClick, true);
  }
}

/** True if any mounted studio doc has unsaved changes. */
export function anyDirty(): boolean {
  return dirtyDocs.size > 0;
}

/** Run cb only if there are no unsaved changes, or the user agrees to drop them. */
export function confirmIfDirty(cb: () => void) {
  if (!anyDirty() || window.confirm("You have unsaved changes. Discard them?")) cb();
}

// ── The hook ──────────────────────────────────────────────────────────────

let docCounter = 0;

export interface StudioDoc<T> {
  value: T | null;
  setValue: (v: T) => void;
  /** Doc finished its initial load (value may still be null for a missing optional file). */
  loaded: boolean;
  /** File doesn't exist on disk yet. */
  missing: boolean;
  dirty: boolean;
  saving: boolean;
  conflict: boolean;
  save: (force?: boolean) => Promise<boolean>;
  reload: () => Promise<void>;
}

export function useStudioDoc<T>(
  ref: StudioDocRef | null,
  opts?: {
    /** Register the Cmd/Ctrl+S handler (give it to the visible tab only). */
    active?: boolean;
    /** Used as the value when the file doesn't exist yet. */
    fallback?: T;
  }
): StudioDoc<T> {
  const dp = useDataProvider();
  const refKey = ref ? JSON.stringify(ref) : null;
  const docId = useMemo(() => `doc-${++docCounter}`, []);

  const [value, setValue] = useState<T | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [mtime, setMtime] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);

  const fallbackRef = useRef(opts?.fallback);
  fallbackRef.current = opts?.fallback;

  const load = useCallback(async () => {
    if (!refKey) return;
    const parsedRef = JSON.parse(refKey) as StudioDocRef;
    setLoaded(false);
    setConflict(false);
    const res = await dp.loadStudioDoc(parsedRef);
    const data = (res?.data ?? null) as T | null;
    const v = data ?? fallbackRef.current ?? null;
    setValue(v);
    setSnapshot(v === null ? null : JSON.stringify(v));
    setMtime(res?.mtime ?? null);
    setMissing(data === null);
    setLoaded(true);
  }, [dp, refKey]);

  useEffect(() => {
    setValue(null);
    setSnapshot(null);
    setMtime(null);
    setMissing(false);
    load();
  }, [load]);

  const dirty =
    loaded && value !== null && JSON.stringify(value) !== snapshot;

  useEffect(() => {
    setDocDirty(docId, dirty);
    return () => setDocDirty(docId, false);
  }, [docId, dirty]);

  const save = useCallback(
    async (force = false): Promise<boolean> => {
      if (!refKey || value === null || saving) return false;
      setSaving(true);
      try {
        const res = await dp.saveStudioDoc(
          JSON.parse(refKey) as StudioDocRef,
          value,
          force ? null : mtime
        );
        if (!res.ok) {
          setConflict(true);
          return false;
        }
        setMtime(res.mtime);
        setSnapshot(JSON.stringify(value));
        setMissing(false);
        setConflict(false);
        return true;
      } finally {
        setSaving(false);
      }
    },
    [dp, refKey, value, mtime, saving]
  );

  // Cmd/Ctrl+S on the active doc
  const saveRef = useRef(save);
  saveRef.current = save;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const active = opts?.active ?? true;

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirtyRef.current) saveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return { value, setValue, loaded, missing, dirty, saving, conflict, save, reload: load };
}

/** The value-type-agnostic surface of a StudioDoc (StudioDoc<T> is invariant in T). */
export type DocHandle = Pick<
  StudioDoc<unknown>,
  "dirty" | "saving" | "conflict" | "loaded" | "save" | "reload"
>;

export function ConflictBanner({ doc, what }: { doc: DocHandle; what: string }) {
  if (!doc.conflict) return null;
  return (
    <div className="studio-conflict">
      <span>
        The {what} changed on disk since you loaded it (another tab, a Claude skill, or a hand
        edit).
      </span>
      <button className="btn-ghost" onClick={() => doc.save(true)}>Overwrite</button>
      <button className="btn-ghost" onClick={() => doc.reload()}>Reload theirs</button>
    </div>
  );
}
