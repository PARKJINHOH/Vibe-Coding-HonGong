export function getResultMessage(correctCount: number): string {
  if (correctCount >= 9) return "완벽해요! 🏆 당신은 진정한 상식왕!";
  if (correctCount >= 7) return "훌륭해요! 🎉 아주 높은 수준이에요.";
  if (correctCount >= 5) return "잘 했어요! 👍 평균 이상이에요.";
  if (correctCount >= 3) return "조금 더 공부해봐요! 📚";
  return "아직 갈 길이 멀어요. 다시 도전해봐요! 💪";
}
