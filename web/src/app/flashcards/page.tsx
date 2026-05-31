export const dynamic = "force-dynamic";

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

function GettingStarted() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🃏</div>
      <h2 className="empty-state-title">No flash card decks yet</h2>
      <p className="empty-state-sub">Add your first deck in one of two ways:</p>
      <div className="empty-state-options">
        <div className="empty-option">
          <div className="empty-option-label">Install from a repository</div>
          <p className="empty-option-desc">
            Add a community module repo, then install any deck from it:
          </p>
          <pre className="empty-code">{`tutor repo add https://github.com/user/modules
tutor module search vocabulary
tutor module install user/modules vocab-deck`}</pre>
        </div>
        <div className="empty-option-divider">or</div>
        <div className="empty-option">
          <div className="empty-option-label">Create with Claude Code skills</div>
          <p className="empty-option-desc">
            Open this project in Claude Code and run a skill to generate a deck from scratch:
          </p>
          <pre className="empty-code">{`/new-flash-card`}</pre>
        </div>
      </div>
    </div>
  );
}

export default function FlashCardsPage() {
  const decks = getFlashCardDecks();

  return (
    <div className="app-main">
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Flash Card Decks</h1>
          {decks.length > 0 && (
            <p className="page-sub">
              Select a deck to start a study session, or run{" "}
              <code className="cli">/new-flash-card</code> to generate one.
            </p>
          )}
        </div>

        {decks.length === 0 ? (
          <GettingStarted />
        ) : (
          <div className="cat-grid">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
            <div className="cat-card cat-empty">
              <span className="empty-glyph">✦</span>
              <span className="empty-head">Create a deck</span>
              <span className="empty-cli">
                Run <code className="cli">/new-flash-card</code> in Claude Code
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
