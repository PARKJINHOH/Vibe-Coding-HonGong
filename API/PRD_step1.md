# PRD Step 1 — 냉장고 이미지 인식

## 개요

사용자가 냉장고 사진을 업로드하면, AI 비전 모델이 이미지를 분석하여 식재료 목록을 추출하는 기능이다.

---

## 목표

- 사용자가 냉장고 사진을 간단히 업로드할 수 있는 인터페이스 제공
- `nvidia/nemotron-nano-12b-v2-vl:free` 모델을 통해 이미지에서 식재료를 자동 인식
- 인식된 재료 목록을 Step 2(레시피 생성)로 전달할 수 있는 구조화된 데이터로 반환

---

## 사용자 스토리

> "나는 냉장고 사진을 찍어서 올리면, 어떤 재료가 있는지 자동으로 알고 싶다."

---

## 기능 요구사항

### FR-1-1. 이미지 업로드
- 사용자는 파일 선택(input[type=file]) 또는 드래그 앤 드롭으로 이미지를 업로드할 수 있다.
- 지원 포맷: JPEG, PNG, WEBP
- 최대 파일 크기: 10MB
- 업로드 전 이미지 미리보기를 제공한다.

### FR-1-2. 이미지 인식 API 호출
- 업로드된 이미지를 base64로 인코딩하여 OpenRouter API에 전달한다.
- 사용 모델: `nvidia/nemotron-nano-12b-v2-vl:free`
- 프롬프트: 이미지에서 식재료만 추출하도록 지시하는 정형화된 시스템 프롬프트 사용
- API 엔드포인트: `POST /api/recognize`

### FR-1-3. 인식 결과 반환
- 인식된 재료를 구조화된 JSON으로 반환한다.
  ```json
  {
    "ingredients": ["계란", "당근", "우유", "버터", "치즈"],
    "confidence": "high",
    "raw_response": "..."
  }
  ```
- 재료 목록은 화면에 태그(chip) 형태로 표시한다.
- 사용자가 잘못 인식된 재료를 직접 수정(추가/삭제)할 수 있다.

### FR-1-4. 상태 처리
- 업로드 중, 분석 중 상태를 로딩 스피너로 표시한다.
- API 오류(rate limit, 네트워크 오류)시 사용자에게 재시도 안내 메시지를 표시한다.

---

## 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 응답 시간 | 이미지 인식 완료까지 30초 이내 |
| 보안 | API 키는 서버 사이드에서만 관리, 클라이언트에 노출 금지 |
| 파일 저장 | 업로드된 이미지는 서버에 영구 저장하지 않음 (메모리/임시 처리) |

---

## API 명세

### POST /api/recognize

**Request**
```
Content-Type: multipart/form-data
Body: image (file)
```

**Response 200**
```json
{
  "success": true,
  "ingredients": ["계란", "당근", "우유"],
  "raw_response": "모델 원문 응답"
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

## 시스템 프롬프트 (이미지 인식용)

```
You are a food ingredient recognition assistant.
Analyze the provided refrigerator image and list all visible food ingredients.
Return ONLY a JSON array of ingredient names in Korean.
Example: ["계란", "당근", "우유", "버터"]
Do not include packaging, containers, or non-food items.
```

---

## UI 흐름

```
[이미지 업로드 영역]
      ↓ (파일 선택 또는 드래그 앤 드롭)
[이미지 미리보기]
      ↓ (분석하기 버튼 클릭)
[로딩: 이미지 분석 중...]
      ↓
[인식된 재료 목록 표시 - 태그 형태]
[재료 수정 가능 (추가/삭제)]
      ↓
[레시피 추천받기 버튼] → Step 2로 이동
```

---

## 완료 기준 (Definition of Done)

- [ ] 이미지 업로드 및 미리보기 동작 확인
- [ ] OpenRouter API 호출 및 재료 목록 정상 반환
- [ ] 재료 태그 표시 및 수정(추가/삭제) 동작 확인
- [ ] API 오류 시 사용자 안내 메시지 표시 확인
- [ ] API 키 서버 사이드 보관 확인

---

## 기술 스택 (제안)

| 영역 | 기술 |
|------|------|
| 프론트엔드 | HTML / CSS / Vanilla JS (또는 React) |
| 백엔드 | Python FastAPI 또는 Node.js Express |
| AI 모델 | nvidia/nemotron-nano-12b-v2-vl:free (OpenRouter) |
| 환경변수 | `.env` — OPENROUTER_API_KEY |
