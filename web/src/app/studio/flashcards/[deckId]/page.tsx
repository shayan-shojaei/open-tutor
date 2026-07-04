export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "force-dynamic";
export function generateStaticParams() { return []; }

import DeckEditor from "./_client";

export default function Page({ params }: { params: { deckId: string } }) {
  return <DeckEditor deckId={params.deckId} />;
}
