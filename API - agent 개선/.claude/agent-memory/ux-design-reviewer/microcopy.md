---
name: Microcopy conventions
description: Established Korean copy style for loading states, errors, empty states, and buttons in this codebase
type: project
---

## Tone
- 해요체 throughout (warmer than 합쇼체): "해 주세요", "있어요", "볼까요?"
- Avoid blaming language. Prefer "잠시 후 다시 시도해 주세요" over "오류가 발생했습니다".

## Loading messages
- index.html: "냉장고 속 재료를 분석하고 있어요… 잠깐만 기다려 주세요."
- recipe.html: "AI가 레시피를 생성하고 있어요… 최대 30초 정도 걸릴 수 있어요."
- myrecipes.html spinner: "불러오는 중…"

## Error messages (inline, not alert())
Format: "⚠️ " + plain-language problem + solution hint.
- Network: "네트워크 오류가 발생했어요. 인터넷 연결을 확인해 주세요."
- Save failure: "저장에 실패했어요. 잠시 후 다시 시도해 주세요."
- 429/서버 혼잡: "현재 AI 서버가 혼잡합니다. 잠시 후 다시 시도해주세요."
- Memo too long: "메모는 500자 이내로 작성해 주세요."

## Empty states
- No saved recipes: "아직 저장된 레시피가 없어요. 첫 레시피를 만들어 볼까요?" + CTA "재료 인식하러 가기" → /
- No search results: "검색 결과가 없어요. 다른 키워드로 찾아보세요."
- Not logged in on protected page: "로그인 후 저장된 레시피를 확인할 수 있습니다."

## Buttons
- Primary action: verb + 하기/보기 (e.g., "레시피 추천받기", "이미지 분석하기", "프로필 저장")
- In-progress state: "저장 중…", "로그인 중…", "가입 중…"
- Success state: "✓ 저장됨" (auto-reverts after ~1.8 s on save-btn)
- Destructive: red border + light red background, explicit label ("계정 삭제", "삭제")

## alert() policy
Replaced `alert('저장되었습니다.')` in memo save with inline button feedback ("✓ 저장됨").
Native `confirm()` is still acceptable for destructive confirms (delete recipe, delete account) — no inline alternative was introduced here.
