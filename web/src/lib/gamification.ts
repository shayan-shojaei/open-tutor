"use client";

import type { GamificationState, XPLogEntry } from "./types";
import { getProgress, setProgress } from "./progress";

const XP_PER_LEVEL = 500;
const LOG_MAX_DAYS = 90;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

export function defaultGamification(): GamificationState {
  return { streak: 0, longestStreak: 0, xp: 0, level: 0, lastActiveDate: "", xpLog: [] };
}

export function getGamification(): GamificationState {
  const p = getProgress();
  return p.gamification ?? defaultGamification();
}

function computeLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL);
}

function pruneLog(log: XPLogEntry[]): XPLogEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOG_MAX_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return log.filter((e) => e.date >= cutoffStr);
}

function touchStreak(state: GamificationState): GamificationState {
  const t = today();
  if (state.lastActiveDate === t) return state;
  const diff = state.lastActiveDate ? diffDays(t, state.lastActiveDate) : 999;
  const newStreak = diff === 1 ? state.streak + 1 : 1;
  return {
    ...state,
    streak: newStreak,
    longestStreak: Math.max(newStreak, state.longestStreak),
    lastActiveDate: t,
  };
}

export function awardXP(amount: number, reason: string): GamificationState {
  const p = getProgress();
  const current = p.gamification ?? defaultGamification();
  const withStreak = touchStreak(current);
  const newXP = withStreak.xp + amount;
  const entry: XPLogEntry = { date: today(), amount, reason };
  const updated: GamificationState = {
    ...withStreak,
    xp: newXP,
    level: computeLevel(newXP),
    xpLog: pruneLog([...withStreak.xpLog, entry]),
  };
  p.gamification = updated;
  setProgress(p);
  return updated;
}

export function xpToNextLevel(state: GamificationState): number {
  return XP_PER_LEVEL - (state.xp % XP_PER_LEVEL);
}

export function levelProgress(state: GamificationState): number {
  return ((state.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}

export function isStreakAtRisk(state: GamificationState): boolean {
  if (!state.lastActiveDate || state.streak === 0) return false;
  const t = today();
  if (state.lastActiveDate === t) return false;
  const diff = diffDays(t, state.lastActiveDate);
  return diff === 1 && new Date().getHours() >= 12;
}
