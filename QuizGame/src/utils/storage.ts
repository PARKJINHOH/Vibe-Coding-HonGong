import type { Category, Score } from "../types";

const STORAGE_KEY = "quiz-game-scores";
const TOP_N = 10;

type ScoreStore = Record<Category, Score[]>;

const CATEGORIES: Category[] = ["한국사", "과학", "지리", "일반상식"];

function loadStore(): ScoreStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return JSON.parse(raw) as ScoreStore;
  } catch {
    return emptyStore();
  }
}

function emptyStore(): ScoreStore {
  return {
    한국사: [],
    과학: [],
    지리: [],
    일반상식: [],
  };
}

function persistStore(store: ScoreStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveScore(score: Score): void {
  const store = loadStore();
  const list = [...store[score.category], score];
  list.sort((a, b) => b.score - a.score);
  store[score.category] = list.slice(0, TOP_N);
  persistStore(store);
}

export function getScores(category: Category): Score[] {
  const store = loadStore();
  return [...store[category]].sort((a, b) => b.score - a.score);
}

export function getAllScores(): Record<Category, Score[]> {
  const store = loadStore();
  const result = emptyStore();
  for (const cat of CATEGORIES) {
    result[cat] = [...store[cat]].sort((a, b) => b.score - a.score);
  }
  return result;
}
