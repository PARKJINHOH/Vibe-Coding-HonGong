import { useState } from "react";
import type { GameSession } from "../types";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { getResultMessage } from "../utils/result";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

interface ResultScreenProps {
  session: GameSession;
  correctCount: number;
  finalScore: number;
  onRetry: () => void;
  onOtherCategory: () => void;
  onLeaderboard: () => void;
}

export function ResultScreen({
  session,
  correctCount,
  finalScore,
  onRetry,
  onOtherCategory,
  onLeaderboard,
}: ResultScreenProps) {
  const [nickname, setNickname] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { submitScore } = useLeaderboard({
    category: session.category,
    finalScore,
  });

  const message = getResultMessage(correctCount);

  function handleSubmit() {
    if (!nickname.trim() || submitted) return;
    submitScore(nickname);
    setSubmitted(true);
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Score card */}
      <Card className="p-6 text-center">
        <p className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-4">
          {session.category} 결과
        </p>
        <div className="flex items-end justify-center gap-2 mb-1">
          <span className="text-7xl font-black text-indigo-700">
            {correctCount}
          </span>
          <span className="text-3xl font-bold text-gray-400 mb-2">/ 10</span>
        </div>
        <p className="text-2xl font-bold text-gray-600 mb-5">{finalScore}점</p>
        <div className="bg-indigo-50 rounded-xl py-3 px-4">
          <p className="text-gray-700 text-sm font-medium">{message}</p>
        </div>
      </Card>

      {/* Score submission */}
      <Card className="p-5">
        <p className="text-sm font-bold text-gray-700 mb-3">🏆 점수 등록</p>
        {submitted ? (
          <div className="text-center py-3">
            <p className="text-green-600 font-bold text-base">✅ 등록 완료!</p>
            <p className="text-gray-400 text-xs mt-1">순위표에서 확인하세요</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="닉네임을 입력하세요"
              maxLength={12}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <Button
              onClick={handleSubmit}
              disabled={!nickname.trim() || submitted}
            >
              등록
            </Button>
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button onClick={onRetry} fullWidth>
          🔄 다시 하기
        </Button>
        <Button variant="secondary" onClick={onOtherCategory} fullWidth>
          다른 카테고리
        </Button>
        <Button variant="secondary" onClick={onLeaderboard} fullWidth>
          순위 보기
        </Button>
      </div>
    </div>
  );
}
