# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
cd quiz-game
npm run dev      # 개발 서버 실행 (http://localhost:5173)
npm run build    # 타입 체크 + dist/ 빌드
npm run preview  # 프로덕션 빌드 미리보기
npx tsc --noEmit # 타입 체크만 (emit 없음)
```

> Node.js v18.17.1 환경. ESLint 관련 EBADENGINE 경고는 Node 버전 불일치이며 무시해도 됨.

## Architecture

```
quiz-game/src/
  types/index.ts              # 공유 타입
  data/questions.ts           # 40문제 + questionsByCategory
  utils/storage.ts            # LocalStorage CRUD
  utils/result.ts             # correctCount → 결과 메시지
  hooks/useGameStore.ts       # useReducer 기반 전역 상태 (단일 소스)
  hooks/useLeaderboard.ts     # 점수 저장·조회
  components/
    HomeScreen.tsx            # idle 상태 홈
    CategoryScreen.tsx        # 카테고리 선택
    QuizScreen.tsx            # 퀴즈 진행 (헤더·문제·선택지·피드백)
    ResultScreen.tsx          # 결과 + 점수 등록 폼
    LeaderboardScreen.tsx     # 탭 기반 Top 10 순위표
    ui/
      Button.tsx              # primary / secondary / danger variant
      Card.tsx                # 흰 카드 래퍼
      ProgressBar.tsx         # 인디고 헤더 내 흰색 진행 바
  App.tsx                     # gameState 조건부 렌더링 진입점
```

### 게임 상태 흐름
`idle` → `category-select` → `playing` → `result` → `leaderboard`  
모든 상태는 `useGameStore`의 `useReducer`로 관리. 컴포넌트는 이 훅만 바라보면 됩니다.

### useGameStore 액션 흐름
| 액션 | 트리거 | 전이 |
|---|---|---|
| `startGame(category)` | 카테고리 선택 | → playing |
| `selectAnswer(idx)` | 보기 클릭 | 세션 내 answers/score 갱신 |
| `nextQuestion()` | 다음 버튼 | playing 유지 or → result |
| `resetGame()` | 재도전 | → category-select |
| `goToLeaderboard()` | 순위 보기 | → leaderboard |
| `goHome()` | 홈으로 | → idle |

### 점수 계산
- 정답 1개 = 10점, `finalScore = correctCount × 10` (최대 100점)
- `useLeaderboard`는 `submitScore(nickname)` 호출 시 LocalStorage에 저장 후 상태 재갱신

### 데이터 구조 요점
- `Question.answer`는 `0 | 1 | 2 | 3` (choices 배열 인덱스)
- `Category`는 `"한국사" | "과학" | "지리" | "일반상식"` 리터럴 유니온
- LocalStorage 키: `"quiz-game-scores"` / 카테고리별 Top 10만 유지

## Styling
Tailwind CSS v3. `tailwind.config.js`의 content 경로: `./src/**/*.{js,ts,jsx,tsx}`.

---

## 퀴즈 문제 교차 검증 가이드라인

모든 문제 작성 및 수정 시 아래 사항을 반드시 확인할 것.

1. **정답이 하나뿐인가?**
   - 다른 해석이 가능한 경우 조건을 명시 (예: 면적 기준, 2024년 기준)

2. **최상급 표현에 기준이 있는가?**
   - "가장 큰", "최초의" 등의 표현에 측정 기준 명시

3. **시간과 범위가 명확한가?**
   - 변할 수 있는 정보는 시점 명시
   - 지리적·분류적 범위 한정

4. **교차 검증 했는가?**
   - 의심스러운 정보는 2개 이상 출처 확인
   - 논란 있는 내용은 주류 학설 기준
