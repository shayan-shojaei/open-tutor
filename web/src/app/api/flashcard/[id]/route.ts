export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "auto";
export function generateStaticParams() { return []; }

import { NextResponse } from "next/server";
import { getFlashCardDeck, getFlashCards } from "@/lib/flashcards";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const deck = getFlashCardDeck(params.id);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const cards = getFlashCards(params.id);
  return NextResponse.json({ deck, cards });
}
