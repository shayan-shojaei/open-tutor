import { getFlashCardDecks } from "@/lib/flashcards";
import DeckStudyPage from "./_client";

export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "true") return [];
  return getFlashCardDecks().map((d) => ({ deckId: d.id }));
}

export default function Page({ params }: { params: { deckId: string } }) {
  return <DeckStudyPage params={params} />;
}
