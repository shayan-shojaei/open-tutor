import Link from "next/link";
import { getFlashCardDecks } from "@/lib/flashcards";
import type { FlashCardDeck } from "@/lib/types";

function DeckCard({ deck }: { deck: FlashCardDeck }) {
  return (
    <Link href={`/flashcards/${deck.id}`} className="cat-card" dir={deck.language === "fa" ? "rtl" : "ltr"}>
      <div className="cat-card-top">
        <span className="cat-glyph">🃏</span>
        <div className="cat-badges">
          {deck.language === "fa" && <span className="lang-badge">فارسی</span>}
          <span className={`subject-badge subj-${deck.subject}`}>
            <span className="subject-dot" />
            {deck.subject}
          </span>
        </div>
      </div>
      <h2 className="cat-title">{deck.title}</h2>
      <p className="cat-desc">{deck.description}</p>
      <div className="cat-foot">
        <span className="cat-stat">{deck.cardCount} cards</span>
      </div>
    </Link>
  );
}

export default function FlashCardsPage() {
  const decks = getFlashCardDecks();

  return (
    <div className="app-main">
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Flash Card Decks</h1>
          <p className="page-sub">
            Select a deck to start a study session, or run{" "}
            <code className="cli">/new-flash-card</code> to generate one.
          </p>
        </div>

        <div className="cat-grid">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
          {decks.length === 0 && (
            <div className="cat-card cat-empty">
              <span className="empty-glyph">🃏</span>
              <span className="empty-head">No decks yet</span>
              <span className="empty-cli">
                Run <code className="cli">/new-flash-card</code> in your editor
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
