import { useReducer, useMemo } from "react";
import type { Category, GameState, GameSession } from "../types";
import { questionsByCategory } from "../data/questions";

// ── State ──────────────────────────────────────────────────────────────────

interface State {
  gameState: GameState;
  session: GameSession | null;
  selectedCategory: Category | null;
}

const initialState: State = {
  gameState: "idle",
  session: null,
  selectedCategory: null,
};

// ── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: "START_GAME"; category: Category }
  | { type: "SELECT_ANSWER"; answerIndex: number }
  | { type: "NEXT_QUESTION" }
  | { type: "RESET_GAME" }
  | { type: "GO_TO_CATEGORY_SELECT" }
  | { type: "GO_TO_LEADERBOARD" }
  | { type: "GO_HOME" };

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_GAME": {
      const questions = shuffle(questionsByCategory[action.category]);
      return {
        gameState: "playing",
        selectedCategory: action.category,
        session: {
          category: action.category,
          questions,
          currentIndex: 0,
          answers: new Array(questions.length).fill(null),
          score: 0,
        },
      };
    }

    case "SELECT_ANSWER": {
      if (!state.session) return state;
      const { session } = state;
      const { currentIndex, questions, answers } = session;

      // 이미 답변한 문제는 무시
      if (answers[currentIndex] !== null) return state;

      const isCorrect = action.answerIndex === questions[currentIndex].answer;
      const newAnswers = [...answers];
      newAnswers[currentIndex] = action.answerIndex;

      return {
        ...state,
        session: {
          ...session,
          answers: newAnswers,
          score: isCorrect ? session.score + 10 : session.score,
        },
      };
    }

    case "NEXT_QUESTION": {
      if (!state.session) return state;
      const { session } = state;
      const nextIndex = session.currentIndex + 1;

      if (nextIndex >= session.questions.length) {
        return { ...state, gameState: "result" };
      }

      return {
        ...state,
        session: { ...session, currentIndex: nextIndex },
      };
    }

    case "RESET_GAME":
      return { ...initialState, gameState: "category-select" };

    case "GO_TO_CATEGORY_SELECT":
      return { ...initialState, gameState: "category-select" };

    case "GO_TO_LEADERBOARD":
      return { ...state, gameState: "leaderboard" };

    case "GO_HOME":
      return initialState;

    default:
      return state;
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGameStore() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { gameState, session, selectedCategory } = state;

  // 액션 함수
  const startGame = (category: Category) =>
    dispatch({ type: "START_GAME", category });

  const selectAnswer = (answerIndex: number) =>
    dispatch({ type: "SELECT_ANSWER", answerIndex });

  const nextQuestion = () => dispatch({ type: "NEXT_QUESTION" });

  const resetGame = () => dispatch({ type: "RESET_GAME" });

  const goToCategorySelect = () => dispatch({ type: "GO_TO_CATEGORY_SELECT" });

  const goToLeaderboard = () => dispatch({ type: "GO_TO_LEADERBOARD" });

  const goHome = () => dispatch({ type: "GO_HOME" });

  // 파생 상태
  const currentQuestion = useMemo(
    () => (session ? session.questions[session.currentIndex] : null),
    [session]
  );

  const selectedAnswerIndex = useMemo(
    () =>
      session ? (session.answers[session.currentIndex] ?? null) : null,
    [session]
  );

  const isAnswered = selectedAnswerIndex !== null;

  const isCorrect = useMemo(() => {
    if (!currentQuestion || selectedAnswerIndex === null) return false;
    return selectedAnswerIndex === currentQuestion.answer;
  }, [currentQuestion, selectedAnswerIndex]);

  const progress = useMemo(
    () => ({
      current: session ? session.currentIndex + 1 : 0,
      total: session ? session.questions.length : 0,
    }),
    [session]
  );

  const correctCount = useMemo(() => {
    if (!session) return 0;
    return session.answers.reduce<number>((acc, answer, idx) => {
      if (answer === null) return acc;
      return answer === session.questions[idx].answer ? acc + 1 : acc;
    }, 0);
  }, [session]);

  const finalScore = correctCount * 10;

  return {
    // 상태
    gameState,
    session,
    selectedCategory,
    // 파생 상태
    currentQuestion,
    isAnswered,
    isCorrect,
    selectedAnswerIndex,
    progress,
    finalScore,
    correctCount,
    // 액션
    startGame,
    selectAnswer,
    nextQuestion,
    resetGame,
    goToCategorySelect,
    goToLeaderboard,
    goHome,
  };
}
