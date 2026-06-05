"use client";

import { useState, useEffect } from "react";

const SIZES = [12, 14, 16, 19, 22, 25, 28];
const DEFAULT_IDX = 3; // 19px
const LS_KEY = "tutor-lesson-font-size";

export function useFontSize() {
  const [idx, setIdx] = useState<number>(DEFAULT_IDX);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored !== null) {
      const px = parseInt(stored, 10);
      const i = SIZES.indexOf(px);
      if (i >= 0) setIdx(i);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--lesson-font-size", SIZES[idx] + "px");
  }, [idx]);

  const changeSize = (next: number) => {
    setIdx(next);
    localStorage.setItem(LS_KEY, String(SIZES[next]));
  };

  return {
    currentSize: SIZES[idx],
    canDecrease: idx > 0,
    canIncrease: idx < SIZES.length - 1,
    decrease: () => changeSize(Math.max(0, idx - 1)),
    increase: () => changeSize(Math.min(SIZES.length - 1, idx + 1)),
  };
}
