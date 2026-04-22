export type Category = "한국사" | "과학" | "지리" | "일반상식";

export type GameState = "idle" | "category-select" | "playing" | "result" | "leaderboard";

export interface Question {
  id: number;
  category: Category;
  question: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface Score {
  nickname: string;
  score: number;
  category: Category;
  date: string;
}

export interface GameSession {
  category: Category;
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  score: number;
}
