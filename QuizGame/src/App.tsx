import "./App.css";
import { useGameStore } from "./hooks/useGameStore";
import { HomeScreen } from "./components/HomeScreen";
import { CategoryScreen } from "./components/CategoryScreen";
import { QuizScreen } from "./components/QuizScreen";
import { ResultScreen } from "./components/ResultScreen";
import { LeaderboardScreen } from "./components/LeaderboardScreen";

function App() {
  const store = useGameStore();

  return (
    <div className="min-h-screen bg-indigo-50 px-4 py-6">
      <div className="max-w-lg mx-auto">
        {store.gameState === "idle" && (
          <HomeScreen
            onStart={store.goToCategorySelect}
            onLeaderboard={store.goToLeaderboard}
          />
        )}

        {store.gameState === "category-select" && (
          <CategoryScreen onSelect={store.startGame} onHome={store.goHome} />
        )}

        {store.gameState === "playing" &&
          store.session &&
          store.currentQuestion && (
            <QuizScreen
              session={store.session}
              currentQuestion={store.currentQuestion}
              selectedAnswerIndex={store.selectedAnswerIndex}
              isAnswered={store.isAnswered}
              isCorrect={store.isCorrect}
              progress={store.progress}
              correctCount={store.correctCount}
              onSelectAnswer={store.selectAnswer}
              onNext={store.nextQuestion}
            />
          )}

        {store.gameState === "result" && store.session && (
          <ResultScreen
            session={store.session}
            correctCount={store.correctCount}
            finalScore={store.finalScore}
            onRetry={() => store.startGame(store.session!.category)}
            onOtherCategory={store.resetGame}
            onLeaderboard={store.goToLeaderboard}
          />
        )}

        {store.gameState === "leaderboard" && (
          <LeaderboardScreen
            initialCategory={store.selectedCategory ?? undefined}
            onHome={store.goHome}
          />
        )}
      </div>
    </div>
  );
}

export default App;
