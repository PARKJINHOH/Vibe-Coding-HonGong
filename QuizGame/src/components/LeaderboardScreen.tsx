import { useState } from "react";
import type { Category, Score } from "../types";
import { getAllScores } from "../utils/storage";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

const CATEGORIES: Category[] = ["한국사", "과학", "지리", "일반상식"];

const CATEGORY_ICONS: Record<Category, string> = {
  한국사: "🏛️",
  과학: "🔬",
  지리: "🌍",
  일반상식: "💡",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="text-sm font-bold text-gray-400 w-6 text-center block">
      {rank}
    </span>
  );
}

function ScoreRow({ score, rank }: { score: Score; rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <div
      className={[
        "flex items-center gap-3 px-4 py-3",
        isTop3 ? "bg-indigo-50/60" : "",
      ].join(" ")}
    >
      <div className="w-7 flex justify-center shrink-0">
        <RankBadge rank={rank} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-bold truncate text-sm ${
            isTop3 ? "text-indigo-700" : "text-gray-800"
          }`}
        >
          {score.nickname}
        </p>
        <p className="text-xs text-gray-400">{score.date}</p>
      </div>
      <p
        className={`font-black text-base shrink-0 ${
          isTop3 ? "text-indigo-700" : "text-gray-700"
        }`}
      >
        {score.score}점
      </p>
    </div>
  );
}

interface LeaderboardScreenProps {
  initialCategory?: Category;
  onHome: () => void;
}

export function LeaderboardScreen({
  initialCategory,
  onHome,
}: LeaderboardScreenProps) {
  const [activeTab, setActiveTab] = useState<Category>(
    initialCategory ?? "한국사"
  );
  const [allScores] = useState<Record<Category, Score[]>>(() =>
    getAllScores()
  );

  const scores = allScores[activeTab];

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">순위표</h2>
        <p className="text-gray-400 text-sm mt-1">카테고리별 Top 10</p>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={[
              "py-2 px-1 rounded-xl text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-0.5",
              activeTab === cat
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            <span className="text-base">{CATEGORY_ICONS[cat]}</span>
            <span className="truncate w-full text-center leading-tight">
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Scores list */}
      <Card className="overflow-hidden p-0">
        {scores.length === 0 ? (
          <div className="text-center py-14 px-6">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-gray-500 font-semibold">아직 기록이 없어요</p>
            <p className="text-gray-400 text-xs mt-1">
              첫 번째 주인공이 되어보세요!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {scores.map((score, index) => (
              <ScoreRow key={index} score={score} rank={index + 1} />
            ))}
          </div>
        )}
      </Card>

      <Button variant="secondary" onClick={onHome} fullWidth>
        ← 홈으로
      </Button>
    </div>
  );
}
