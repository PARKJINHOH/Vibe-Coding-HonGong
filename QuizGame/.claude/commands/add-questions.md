# add-questions

`src/data/questions.ts`에 새 퀴즈 문제를 추가합니다.

## 사용법

```
/add-questions <카테고리> <문제수>
```

예: `/add-questions 과학 5`

## 절차

1. `src/data/questions.ts`의 현재 문제 목록과 최대 ID를 확인한다.
2. 지정한 카테고리(`한국사` | `과학` | `지리` | `일반상식`)로 지정한 개수만큼 문제를 생성한다.
3. CLAUDE.md의 **퀴즈 문제 교차 검증 가이드라인**을 준수한다.
   - 정답이 하나뿐인지 확인
   - 최상급 표현에 기준 명시
   - 시간·범위 명확화
4. `Question` 타입에 맞게 작성한다:
   ```ts
   { id, category, question, choices: [4개], answer: 0|1|2|3 }
   ```
5. `questions` 배열과 `questionsByCategory[카테고리]` 양쪽에 추가한다.
6. `npx tsc --noEmit`으로 타입 오류가 없는지 확인한다.
