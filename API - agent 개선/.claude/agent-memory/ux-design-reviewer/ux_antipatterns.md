---
name: UX anti-patterns fixed
description: Recurring UX/security issues found and fixed in the first full review pass (2026-04-23)
type: project
---

## 1. innerHTML with unescaped AI/user content (XSS + display corruption)
All four HTML files were inserting AI-generated strings (titles, descriptions, ingredient names, step text, tags, memo) directly into innerHTML via template literals. Fixed by adding `esc()` helper in every file.

**Pattern to watch:** Any `element.innerHTML = \`...\${variable}...\`` where the variable originates from AI output, user input, or the database.

**Fix applied:** `function esc(s)` (replace &, <, >, ") added to index.html, recipe.html, myrecipes.html. profile.html avoids the issue via `setAttribute`.

## 2. Silent patchRecipe in myrecipes.html
`patchRecipe` had no error handling — server errors and network failures were swallowed. Users believed their star rating or memo was saved when it was not.

**Fix applied:** `patchRecipe` now returns `boolean`. Callers (star rating click on card and modal, memo save) do optimistic update then revert on `false`. `showModalError()` helper injects an inline error message near the modal action buttons (auto-clears after 4 s). `alert()` removed from memo save path.

## 3. Duplicate document click listeners in header.js _renderAuth()
`_renderAuth()` is called on every login/logout cycle. Each call added a new `document.addEventListener('click', ...)` for dropdown close without removing the previous one.

**Fix applied:** Store handler reference in `window._hdrDropdownCloseHandler`; call `removeEventListener` before adding the new one.

## 4. myrecipes.html not using paginated API
`loadRecipes` was fetching `/api/saved-recipes` with no pagination params and ignoring `total`. UI showed no recipe count and no way to navigate beyond the first page.

**Fix applied:**
- `loadRecipes(offset)` now fetches with `?limit=20&offset=N`
- `totalCount` tracked from `data.total`
- Info bar shows "전체 N개의 레시피" and "페이지 X / Y"
- Prev/Next buttons rendered when `totalCount > PAGE_SIZE`

## 5. profile.html value injection via template literal
`<input value="${d.email}">` breaks if email contains `"`. Also a minor XSS vector.

**Fix applied:** Template renders inputs without value attributes (`id="f-email"` only), then `document.getElementById('f-email').setAttribute('value', d.email || '')` sets the value safely after innerHTML is parsed.

## 6. Empty state copy was generic
"저장된 레시피가 없습니다" gave no call to action. "검색 결과가 없습니다" gave no guidance.

**Fix applied:** Improved to "아직 저장된 레시피가 없어요. 첫 레시피를 만들어 볼까요?" with CTA link to `/` (ingredient recognition), and "검색 결과가 없어요. 다른 키워드로 찾아보세요."
