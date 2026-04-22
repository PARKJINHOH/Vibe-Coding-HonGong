import type { GameSession, Question } from "../types";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";

const LABELS = ["①", "②", "③", "④"] as const;

interface QuizScreenProps {
  session: GameSession;
  currentQuestion: Question;
  selectedAnswerIndex: number | null;
  isAnswered: boolean;
  isCorrect: boolean;
  progress: { current: number; total: number };
  correctCount: number;
  onSelectAnswer: (idx: number) => void;
  onNext: () => void;
}

function getChoiceClass(
  idx: number,
  selectedAnswerIndex: number | null,
  correctAnswer: number,
  isAnswered: boolean
): string {
  const base =
    "w-full text-left px-4 py-3 rounded-xl border-2 transition-colors duration-200 flex items-center gap-3 text-sm font-medium";

  if (!isAnswered) {
    return `${base} bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-800 cursor-pointer`;
  }
  if (idx === selectedAnswerIndex && idx === correctAnswer) {
    return `${base} bg-green-500 border-green-500 text-white cursor-not-allowed`;
  }
  if (idx === selectedAnswerIndex) {
    return `${base} bg-red-500 border-red-500 text-white cursor-not-allowed`;
  }
  if (idx === correctAnswer) {
    return `${base} bg-green-50 border-green-400 text-green-700 cursor-not-allowed`;
  }
  return `${base} bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed`;
}

export function QuizScreen({
  session,
  currentQuestion,
  selectedAnswerIndex,
  isAnswered,
  isCorrect,
  progress,
  correctCount,
  onSelectAnswer,
  onNext,
}: QuizScreenProps) {
  const isLastQuestion = progress.current === progress.total;

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Header */}
      <div className="bg-indigo-600 text-white rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="bg-indigo-500 text-xs px-3 py-1 rounded-full font-semibold">
            {session.category}
          </span>
          <span className="text-sm font-bold">
            {progress.current} / {progress.total}
          </span>
          <span className="bg-indigo-500 text-xs px-3 py-1 rounded-full font-semibold">
            {correctCount * 10}점
          </span>
        </div>
        <ProgressBar current={progress.current} total={progress.total} />
      </div>

      {/* Question */}
      <Card className="p-6">
        <p className="text-xs font-bold text-indigo-400 mb-3 tracking-widest uppercase">
          문제 {progress.current}
        </p>
        <p className="text-lg font-bold text-gray-900 leading-relaxed">
          {currentQuestion.question}
        </p>
      </Card>

      {/* Choices */}
      <div className="flex flex-col gap-2">
        {currentQuestion.choices.map((choice, idx) => (
          <button
            key={idx}
            onClick={() => onSelectAnswer(idx)}
            disabled={isAnswered}
            className={getChoiceClass(
              idx,
              selectedAnswerIndex,
              currentQuestion.answer,
              isAnswered
            )}
          >
            <span className="text-base shrink-0 w-6 text-center">
              {LABELS[idx]}
            </span>
            <span className="flex-1 text-left">{choice}</span>
            {isAnswered && idx === currentQuestion.answer && (
              <span className="ml-auto shrink-0 font-black text-base">✓</span>
            )}
            {isAnswered &&
              idx === selectedAnswerIndex &&
              idx !== currentQuestion.answer && (
                <span className="ml-auto shrink-0 font-black text-base">✗</span>
              )}
          </button>
        ))}
      </div>

      {/* Feedback panel */}
      {isAnswered && (
        <Card className="animate-fade-in p-5">
          <p
            className={`text-base font-bold mb-2 ${
              isCorrect ? "text-green-600" : "text-red-500"
            }`}
          >
            {isCorrect ? "✅ 정답입니다!" : "❌ 오답입니다"}
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            {currentQuestion.explanation}
          </p>
          <Button onClick={onNext} fullWidth>
            {isLastQuestion ? "결과 보기" : "다음 문제 →"}
          </Button>
        </Card>
      )}
    </div>
  );
}
