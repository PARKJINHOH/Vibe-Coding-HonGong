# PRD Step 2 — 레시피 생성

## 개요

Step 1에서 인식된 식재료 목록을 바탕으로, AI 언어 모델이 실현 가능한 레시피를 생성하여 사용자에게 제안하는 기능이다.

---

## 목표

- Step 1의 재료 목록을 입력으로 받아 `google/gemma-4-31b-it:free` 모델로 레시피 생성
- 복수의 레시피 후보를 카드 형태로 제시
- 각 레시피의 상세 정보(재료, 조리 순서, 시간, 난이도)를 명확하게 표시
- Step 3(레시피 저장)으로 연결되는 저장 액션 제공

---

## 사용자 스토리

> "인식된 재료로 만들 수 있는 레시피를 추천받고, 마음에 드는 것을 저장하고 싶다."

---

## 기능 요구사항

### FR-2-1. 레시피 생성 요청
- Step 1에서 확정된 재료 목록을 자동으로 수신한다.
- 사용자가 선택적으로 다음 필터를 지정할 수 있다.
  - 조리 시간: 15분 이내 / 30분 이내 / 제한 없음
  - 난이도: 쉬움 / 보통 / 어려움
  - 인원수: 1인 / 2인 / 4인
- `레시피 생성` 버튼 클릭 시 API를 호출한다.
- API 엔드포인트: `POST /api/recipe`

### FR-2-2. 레시피 생성 API 호출
- 사용 모델: `google/gemma-4-31b-it:free`
- 재료 목록 + 사용자 필터를 포함한 구조화된 프롬프트로 요청한다.
- 모델 응답을 파싱하여 아래 JSON 구조로 정규화한다.

```json
{
  "recipes": [
    {
      "id": "uuid",
      "title": "계란 볶음밥",
      "description": "간단하고 빠르게 만들 수 있는 한 끼",
      "cooking_time": 15,
      "difficulty": "쉬움",
      "servings": 1,
      "ingredients": [
        { "name": "계란", "amount": "2개" },
        { "name": "밥", "amount": "1공기" }
      ],
      "steps": [
        "팬을 달군 후 기름을 두른다.",
        "계란을 풀어 스크램블 한다.",
        "밥을 넣고 함께 볶는다.",
        "소금, 후추로 간한다."
      ],
      "tags": ["간단", "한식", "볶음"]
    }
  ]
}
```

### FR-2-3. 레시피 목록 표시
- 생성된 레시피를 카드 형태로 최대 3개 표시한다.
- 각 카드에는 다음 정보를 포함한다.
  - 레시피 이름
  - 한 줄 설명
  - 조리 시간 / 난이도 / 인원수
  - 사용 재료 목록 (현재 보유 재료는 초록색, 부족한 재료는 회색으로 구분)
  - 상세 보기 버튼

### FR-2-4. 레시피 상세 보기
- 카드 클릭 또는 상세 보기 버튼 클릭 시 모달 또는 상세 페이지로 전환한다.
- 상세 페이지에는 전체 조리 순서를 단계별로 표시한다.
- 각 단계를 체크하며 조리 진행 상황을 추적할 수 있다.

### FR-2-5. 저장 액션
- 각 레시피 카드에 `저장하기` 버튼을 제공한다.
- 비로그인 상태에서는 로그인/회원가입 유도 모달을 표시한다.
- 로그인 상태에서는 Step 3의 사용자 프로필에 저장한다.

### FR-2-6. 재생성 기능
- 결과가 마음에 들지 않을 경우 `다시 생성` 버튼으로 새로운 레시피를 요청할 수 있다.

---

## 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 응답 시간 | 레시피 생성 완료까지 30초 이내 |
| 파싱 안정성 | 모델 응답이 JSON 형식이 아닐 경우 fallback 파싱 처리 |
| Rate Limit | 429 오류 시 "잠시 후 다시 시도해주세요" 안내 및 자동 재시도 (최대 2회) |

---

## API 명세

### POST /api/recipe

**Request**
```json
{
  "ingredients": ["계란", "당근", "우유"],
  "filters": {
    "cooking_time": 30,
    "difficulty": "쉬움",
    "servings": 2
  }
}
```

**Response 200**
```json
{
  "success": true,
  "recipes": [ /* 레시피 배열 */ ]
}
```

**Response 4xx / 5xx**
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

---

## 시스템 프롬프트 (레시피 생성용)

```
You are a professional chef and recipe recommendation assistant.
Given the following ingredients, suggest up to 3 practical Korean recipes.

Ingredients: {ingredients}
Filters: cooking time under {time} minutes, difficulty: {difficulty}, servings: {servings}

Return ONLY a valid JSON object matching this exact structure:
{
  "recipes": [
    {
      "title": "...",
      "description": "...",
      "cooking_time": <number in minutes>,
      "difficulty": "쉬움 | 보통 | 어려움",
      "servings": <number>,
      "ingredients": [{ "name": "...", "amount": "..." }],
      "steps": ["...", "..."],
      "tags": ["..."]
    }
  ]
}

Write all text in Korean. Do not include any explanation outside the JSON.
```

---

## UI 흐름

```
[Step 1 재료 목록 표시 (읽기 전용)]
[필터 선택: 시간 / 난이도 / 인원수]
      ↓ (레시피 생성 버튼 클릭)
[로딩: 레시피 생성 중...]
      ↓
[레시피 카드 3개 표시]
  ├─ [카드 클릭] → 상세 모달 (단계별 조리법)
  └─ [저장하기 클릭] → Step 3 저장 또는 로그인 유도
[다시 생성 버튼]
```

---

## 완료 기준 (Definition of Done)

- [ ] Step 1 재료 목록을 정상 수신하여 프롬프트에 반영
- [ ] 레시피 카드 3개 정상 표시
- [ ] 보유 재료 / 부족 재료 색상 구분 표시
- [ ] 상세 보기 모달에서 단계별 조리법 표시
- [ ] 저장하기 버튼 클릭 시 Step 3 연동 또는 로그인 유도
- [ ] 다시 생성 버튼 동작 확인
- [ ] Rate limit 오류 시 재시도 처리 확인

---

## 기술 스택 (제안)

| 영역 | 기술 |
|------|------|
| AI 모델 | google/gemma-4-31b-it:free (OpenRouter) |
| 응답 파싱 | JSON.parse + regex fallback |
| 상태 관리 | 세션 스토리지 (재료 목록 임시 보관) |
