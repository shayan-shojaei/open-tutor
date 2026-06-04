"use client";

import { useState, useEffect } from "react";

const SIZES = [12, 14, 16, 19, 22, 25, 28];
const DEFAULT_IDX = 3; // 19px
const LS_KEY = "tutor-lesson-font-size";

export function useFontSize() {
  const [idx, setIdx] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_IDX;
    const stored = localStorage.getItem(LS_KEY);
    if (stored !== null) {
      const px = parseInt(stored, 10);
      const i = SIZES.indexOf(px);
      if (i >= 0) return i;
    }
    return DEFAULT_IDX;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--lesson-font-size", SIZES[idx] + "px");
    localStorage.setItem(LS_KEY, String(SIZES[idx]));
  }, [idx]);

  return {
    currentSize: SIZES[idx],
    canDecrease: idx > 0,
    canIncrease: idx < SIZES.length - 1,
    decrease: () => setIdx((i) => Math.max(0, i - 1)),
    increase: () => setIdx((i) => Math.min(SIZES.length - 1, i + 1)),
  };
}
