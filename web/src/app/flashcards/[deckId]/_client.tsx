"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FlashCardDeck, FlashCard } from "@/lib/types";
import { FlashCardView } from "@/components/interactive/FlashCardView";
import { apiUrl } from "@/lib/api-url";

interface DeckResponse {
  deck: FlashCardDeck;
  cards: FlashCard[];
}

export default function DeckStudyPage({ params }: { params: { deckId: string } }) {
  const router = useRouter();
  const [data, setData] = useState<DeckResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl(`flashcard/${params.deckId}`))
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        setData(await res.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.deckId]);

  if (loading) {
    return (
      <div className="app-main spinner-page">
        <div className="spinner" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="app-main spinner-page" style={{ flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 48 }}>🔍</p>
        <p style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>Deck not found</p>
        <button className="fc-back" style={{ marginBottom: 0 }} onClick={() => router.push("/flashcards")}>
          ← Back to Flash Card Decks
        </button>
      </div>
    );
  }

  const { deck, cards } = data;

  return (
    <div className="app-main">
      <FlashCardView
        cards={cards}
        deckId={deck.id}
        deckTitle={deck.title}
        deckDescription={deck.description}
        sourceCourse={deck.sourceCourse}
        language={deck.language}
        onBack={() => router.push("/flashcards")}
      />
    </div>
  );
}
