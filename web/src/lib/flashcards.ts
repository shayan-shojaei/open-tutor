import fs from "fs";
import path from "path";
import { FlashCard, FlashCardDeck } from "./types";
import { flashcardsDir } from "./modulesDir";

export function getFlashCardDecks(): FlashCardDeck[] {
  const dir = flashcardsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const configPath = path.join(dir, d.name, "config.json");
      if (!fs.existsSync(configPath)) return null;
      const config: Omit<FlashCardDeck, "cardCount"> = JSON.parse(
        fs.readFileSync(configPath, "utf-8")
      );
      const cardsPath = path.join(dir, d.name, "cards.json");
      const cardCount = fs.existsSync(cardsPath)
        ? (JSON.parse(fs.readFileSync(cardsPath, "utf-8")) as FlashCard[]).length
        : 0;
      return { ...config, cardCount } satisfies FlashCardDeck;
    })
    .filter(Boolean) as FlashCardDeck[];
}

export function getFlashCardDeck(id: string): FlashCardDeck | null {
  const dir = flashcardsDir();
  const configPath = path.join(dir, id, "config.json");
  if (!fs.existsSync(configPath)) return null;
  const config: Omit<FlashCardDeck, "cardCount"> = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  );
  const cardsPath = path.join(dir, id, "cards.json");
  const cardCount = fs.existsSync(cardsPath)
    ? (JSON.parse(fs.readFileSync(cardsPath, "utf-8")) as FlashCard[]).length
    : 0;
  return { ...config, cardCount };
}

export function getFlashCards(id: string): FlashCard[] {
  const cardsPath = path.join(flashcardsDir(), id, "cards.json");
  if (!fs.existsSync(cardsPath)) return [];
  return JSON.parse(fs.readFileSync(cardsPath, "utf-8"));
}
