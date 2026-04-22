import { useState, useCallback } from "react";
import type { Category, Score } from "../types";
import { saveScore, getScores, getAllScores } from "../utils/storage";

interface UseLeaderboardOptions {
  category: Category | null;
  finalScore: number;
}

export function useLeaderboard({ category, finalScore }: UseLeaderboardOptions) {
  const [scores, setScores] = useState<Score[]>(
    () => (category ? getScores(category) : [])
  );
  const [allScores, setAllScores] = useState<Record<Category, Score[]>>(
    () => getAllScores()
  );

  const submitScore = useCallback(
    (nickname: string) => {
      if (!category) return;
      const entry: Score = {
        nickname: nickname.trim(),
        score: finalScore,
        category,
        date: new Date().toLocaleDateString("ko-KR"),
      };
      saveScore(entry);
      setScores(getScores(category));
      setAllScores(getAllScores());
    },
    [category, finalScore]
  );

  const refresh = useCallback(() => {
    if (!category) return;
    setScores(getScores(category));
    setAllScores(getAllScores());
  }, [category]);

  return { submitScore, scores, allScores, refresh };
}
