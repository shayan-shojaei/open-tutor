import { NextResponse } from "next/server";
import { getFlashCardDecks } from "@/lib/flashcards";

export async function GET() {
  const decks = getFlashCardDecks();
  return NextResponse.json(decks);
}
