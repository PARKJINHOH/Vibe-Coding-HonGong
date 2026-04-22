import { Button } from "./ui/Button";

const CATEGORY_BADGES = [
  { name: "한국사", icon: "🏛️" },
  { name: "과학", icon: "🔬" },
  { name: "지리", icon: "🌍" },
  { name: "일반상식", icon: "💡" },
];

interface HomeScreenProps {
  onStart: () => void;
  onLeaderboard: () => void;
}

export function HomeScreen({ onStart, onLeaderboard }: HomeScreenProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-8 py-8">
      {/* Title */}
      <div className="text-center">
        <div className="text-7xl mb-4">🧠</div>
        <h1 className="text-4xl font-black text-indigo-700 mb-2">상식 퀴즈</h1>
        <p className="text-gray-500 text-sm">나의 상식 수준을 테스트해보세요</p>
      </div>

      {/* Category badges (decorative) */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {CATEGORY_BADGES.map(({ name, icon }) => (
          <div
            key={name}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 border border-indigo-100"
          >
            <span className="text-3xl">{icon}</span>
            <span className="text-sm font-semibold text-gray-700">{name}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full">
        <Button onClick={onStart} fullWidth className="py-3.5 text-base">
          게임 시작
        </Button>
        <button
          onClick={onLeaderboard}
          className="text-indigo-500 text-sm font-medium hover:text-indigo-700 transition-colors underline underline-offset-2"
        >
          순위 보기
        </button>
      </div>
    </div>
  );
}
