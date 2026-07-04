"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import type { FlashCard, FlashCardDeck } from "@/lib/types";
import { useDataProvider } from "@/lib/data";
import { useStudioDoc, ConflictBanner, type DocHandle } from "@/components/studio/useStudioDoc";
import { ItemListEditor, FlashCardForm, nextId } from "@/components/studio/ItemListEditor";

export default function DeckEditor({ deckId }: { deckId: string }) {
  const dp = useDataProvider();

  const config = useStudioDoc<FlashCardDeck>(
    useMemo(() => ({ kind: "deck-config", deckId }), [deckId]),
    { active: false }
  );
  const cards = useStudioDoc<FlashCard[]>(
    useMemo(() => ({ kind: "cards", deckId }), [deckId]),
    { active: false, fallback: [] }
  );

  const docs: DocHandle[] = [config, cards];
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
  if (!config.value) return <div className="app-main"><div className="page"><p className="studio-error">Deck “{deckId}” not found.</p></div></div>;

  const cfg = config.value;
  const dir = cfg.language === "fa" ? "rtl" : "ltr";

  function update(patch: Partial<FlashCardDeck>) {
    config.setValue({ ...cfg, ...patch });
  }

  return (
    <div className="app-main">
      <div className="page">
        <div className="studio-editor-head" style={{ marginBottom: 20 }}>
          <div className="studio-rail-head">
            <Link href="/studio" className="btn-ghost studio-row-btn" title="Back to Studio"><ArrowLeft size={14} /></Link>
            <Link href={`/flashcards/${deckId}`} className="btn-ghost studio-row-btn" title="View deck"><ExternalLink size={14} /></Link>
            <span className="studio-row-id">{deckId}</span>
          </div>
          <button className="btn-ghost studio-save" onClick={saveAll} disabled={!anyDocDirty || anySaving}>
            <Save size={14} />
            {anySaving ? "Saving…" : anyDocDirty ? "Save" : "Saved"}
          </button>
        </div>

        <ConflictBanner doc={config} what="deck config" />
        <ConflictBanner doc={cards} what="card list" />

        <div className="studio-new studio-form">
          <div className="studio-new-grid">
            <label>
              Title
              <input value={cfg.title} onChange={(e) => update({ title: e.target.value })} />
            </label>
            <label>
              Subject
              <select value={cfg.subject} onChange={(e) => update({ subject: e.target.value as FlashCardDeck["subject"] })}>
                <option value="math">math</option>
                <option value="programming">programming</option>
                <option value="general">general</option>
              </select>
            </label>
            <label>
              Language
              <select value={cfg.language} onChange={(e) => update({ language: e.target.value as FlashCardDeck["language"] })}>
                <option value="en">en</option>
                <option value="fa">fa</option>
              </select>
            </label>
            <label className="studio-new-desc">
              Description
              <input value={cfg.description} onChange={(e) => update({ description: e.target.value })} />
            </label>
          </div>
        </div>

        <ItemListEditor
          items={cards.value ?? []}
          onChange={cards.setValue}
          newItem={(items) => ({ id: nextId(items, "c"), front: "", back: "" })}
          itemLabel={(_, i) => `Card ${i + 1}`}
          addLabel="Add card"
          renderItem={(item, update) => <FlashCardForm item={item} update={update} dir={dir} />}
        />
      </div>
    </div>
  );
}
