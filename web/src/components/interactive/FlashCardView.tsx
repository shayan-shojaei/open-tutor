"use client";

import { useState, useEffect, useRef } from "react";
import type { FlashCard } from "@/lib/types";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { useDataProvider } from "@/lib/data";
import { Check, Minus, X, RotateCcw, BookOpen, Layers, ArrowLeft, ArrowRight } from "lucide-react";

interface FlashCardViewProps {
  cards: FlashCard[];
  deckId: string;
  deckTitle: string;
  deckDescription: string;
  sourceCourse?: string;
  language: "en" | "fa";
  onBack: () => void;
}

type Bucket = "easy" | "hard" | "unknown";

export function FlashCardView({
  cards, deckId, deckTitle, deckDescription, sourceCourse, language, onBack,
}: FlashCardViewProps) {
  const isRtl = language === "fa";
  const dir = isRtl ? "rtl" : "ltr";
  const L = (en: string, fa: string) => (isRtl ? fa : en);
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const [queue, setQueue] = useState<FlashCard[]>(cards);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({ easy: 0, hard: 0, miss: 0 });
  const [missed, setMissed] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const xpAwarded = useRef(false);

  const dp = useDataProvider();
  const [easy, setEasy] = useState<string[]>([]);
  const [hard, setHard] = useState<string[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);

  useEffect(() => {
    dp.getFlashCardProgress(deckId).then((saved) => {
      setEasy(saved.easy);
      setHard(saved.hard);
      setUnknown(saved.unknown);
    });
  }, [deckId, dp]);

  const total = queue.length;
  const card = queue[pos];
  const pct = Math.round((pos / total) * 100);

  function rate(kind: Bucket) {
    if (!card) return;

    const newEasy = kind === "easy" ? [...easy, card.id] : easy;
    const newHard = kind === "hard" ? [...hard, card.id] : hard;
    const newUnknown = kind === "unknown" ? [...unknown, card.id] : unknown;
    setEasy(newEasy);
    setHard(newHard);
    setUnknown(newUnknown);
    void dp.saveFlashCardProgress(deckId, newEasy, newHard, newUnknown);

    setRatings((r) => ({ ...r, [kind === "unknown" ? "miss" : kind]: r[kind === "unknown" ? "miss" : kind] + 1 }));
    if (kind !== "easy") setMissed((m) => [...m, pos]);

    const nextPos = pos + 1;
    setFlipped(false);
    setTimeout(() => {
      if (nextPos >= total) {
        setDone(true);
        if (!xpAwarded.current && nextPos >= 5) {
          void dp.awardXP(10, "flashcard-session");
          xpAwarded.current = true;
        }
      } else {
        setPos(nextPos);
      }
    }, 180);
  }

  function restart(onlyMissed: boolean) {
    const q = onlyMissed && missed.length > 0 ? missed.map((i) => queue[i]) : cards;
    setQueue(q);
    setPos(0);
    setFlipped(false);
    setDone(false);
    setRatings({ easy: 0, hard: 0, miss: 0 });
    setMissed([]);
    setEasy([]);
    setHard([]);
    setUnknown([]);
    xpAwarded.current = false;
    void dp.saveFlashCardProgress(deckId, [], [], []);
  }

  const backBtn = (
    <button className="fc-back" onClick={onBack}>
      <BackArrow size={16} />
      <span>{L("Back", "بازگشت")}</span>
    </button>
  );

  if (done) {
    return (
      <div className="fc-page" dir={dir}>
        {backBtn}
        <div className="fc-done">
          <div className="fc-done-ic"><BookOpen size={34} /></div>
          <h2 className="fc-done-title">{L("Session Complete!", "جلسه تمام شد!")}</h2>
          {total >= 5 && <p className="fc-xp-earned">+10 XP earned ⚡</p>}
          <div className="fc-stats">
            <div className="fc-stat easy">
              <span className="fc-stat-n">{ratings.easy}</span>
              <span className="fc-stat-l">{L("Easy", "آسان")}</span>
            </div>
            <div className="fc-stat hard">
              <span className="fc-stat-n">{ratings.hard}</span>
              <span className="fc-stat-l">{L("Hard", "سخت")}</span>
            </div>
            <div className="fc-stat miss">
              <span className="fc-stat-n">{ratings.miss}</span>
              <span className="fc-stat-l">{L("Don't know", "بلد نیستم")}</span>
            </div>
          </div>
          <div className="fc-done-actions">
            <button className="continue-btn" onClick={() => restart(false)}>
              <RotateCcw size={16} />
              <span>{L("Study again", "مطالعه دوباره")}</span>
            </button>
            {missed.length > 0 && (
              <button className="btn-ghost" onClick={() => restart(true)}>
                <Layers size={16} />
                <span>{L(`Study missed (${missed.length})`, `مرور اشتباه‌ها (${missed.length})`)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fc-page" dir={dir}>
      {backBtn}
      <div className="fc-header">
        <h1 className="fc-title">{deckTitle}</h1>
        <p className="fc-desc">{deckDescription}</p>
        {sourceCourse && (
          <div className="fc-source">{L("based on", "بر اساس")}: {sourceCourse}</div>
        )}
      </div>
      <div className="fc-progress-row">
        <span className="fc-count">{L(`Card ${pos + 1} of ${total}`, `کارت ${pos + 1} از ${total}`)}</span>
        <span className="fc-pct">{pct}%</span>
      </div>
      <div className="fc-bar">
        <div className="fc-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="fc-stage">
        <div className={`fc-card${flipped ? " flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
          <div className="fc-face fc-front">
            <span className="fc-side-badge">{L("Front", "جلو")}</span>
            <MarkdownRenderer content={card.front} dir={dir} className="fc-content" />
            <span className="fc-hint">{L("Click to reveal", "برای نمایش پشت کلیک کنید")}</span>
          </div>
          <div className="fc-face fc-back-face">
            <span className="fc-side-badge back">{L("Back", "پشت")}</span>
            <MarkdownRenderer content={card.back} dir={dir} className="fc-content" />
          </div>
        </div>
      </div>
      <div className={`fc-ratings${flipped ? " show" : ""}`}>
        <button className="rate-btn easy" disabled={!flipped} onClick={() => rate("easy")}>
          <Check size={18} /><span>{L("Easy", "آسان")}</span>
        </button>
        <button className="rate-btn hard" disabled={!flipped} onClick={() => rate("hard")}>
          <Minus size={18} /><span>{L("Hard", "سخت")}</span>
        </button>
        <button className="rate-btn miss" disabled={!flipped} onClick={() => rate("unknown")}>
          <X size={18} /><span>{L("Don't know", "بلد نیستم")}</span>
        </button>
      </div>
    </div>
  );
}
