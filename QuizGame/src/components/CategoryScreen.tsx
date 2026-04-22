import type { Category } from "../types";
import { Button } from "./ui/Button";

const CATEGORIES: { name: Category; icon: string; desc: string }[] = [
  { name: "한국사", icon: "🏛️", desc: "삼국시대부터 근현대사까지" },
  { name: "과학", icon: "🔬", desc: "물리·화학·생물·지구과학" },
  { name: "지리", icon: "🌍", desc: "세계 수도·지형·한국 지리" },
  { name: "일반상식", icon: "💡", desc: "시사·문화·스포츠·언어" },
];

interface CategoryScreenProps {
  onSelect: (category: Category) => void;
  onHome: () => void;
}

export function CategoryScreen({ onSelect, onHome }: CategoryScreenProps) {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">카테고리를 선택하세요</h2>
        <p className="text-gray-400 text-sm mt-1">각 카테고리당 10문제</p>
      </div>

      <div className="flex flex-col gap-3">
        {CATEGORIES.map(({ name, icon, desc }) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 border-2 border-transparent hover:border-indigo-400 hover:shadow-md transition-all duration-200 hover:scale-[1.01] text-left group"
          >
            <span className="text-4xl">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base group-hover:text-indigo-700 transition-colors">
                {name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-full shrink-0">
              10문제
            </span>
          </button>
        ))}
      </div>

      <Button variant="secondary" onClick={onHome} fullWidth>
        ← 홈으로
      </Button>
    </div>
  );
}
