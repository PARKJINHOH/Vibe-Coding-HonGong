# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 안내 문서입니다.

## 프로젝트 개요

빌드 시스템이나 외부 의존성 없이 순수 HTML/CSS/JS로 만들어진 **할일 관리** 웹 앱입니다. 두 가지 버전이 있습니다:

- `index.html` — CSS와 JS가 모두 인라인으로 포함된 모바일 우선 단일 파일 버전
- `web_version/index.html` + `web_version/script.js` — 사이드바 레이아웃과 별도 JS 파일을 사용하는 데스크탑 버전

두 버전의 데이터 로직과 기능은 동일하며, web_version은 JS를 `script.js`로 분리하고 가로 탭 대신 세로 사이드바 내비게이션을 사용합니다.

## 앱 실행 방법

`index.html` 또는 `web_version/index.html`을 브라우저에서 바로 열면 됩니다. 별도 서버 불필요. 모든 상태는 `localStorage`의 `todos` 키에 저장됩니다.

## 아키텍처

### 데이터 레이어 (프레임워크 없음)
모든 데이터 함수(`addTodo`, `updateTodo`, `deleteTodo`, `toggleTodo`, `getStats`)는 모듈 레벨의 `todos` 배열을 조작하고, 변경 후 `saveTodos()` → `localStorage`를 호출합니다. `id`와 `createdAt`은 불변값으로, `updateTodo`는 `changes` 객체에서 이 두 필드를 제거한 후 적용합니다.

### UI 레이어
모든 변경 시 `renderTodos()`로 UI를 전체 재렌더링합니다. 내부적으로 `updateProgressUI()`, `updateBadges()`, (web_version만) `updateListHeading()`을 호출합니다. 사용자 인터랙션은 `#todo-list`의 이벤트 위임으로 처리하며, `data-action` 속성(`toggle`, `delete`, `edit`)을 기준으로 분기합니다.

### 자동 카테고리 분류
`classifyCategory(text)`에서 `KEYWORD_MAP`(업무·개인·공부에 대한 한국어+영어 키워드)과 대조해 키워드 매칭을 수행합니다. 결과에 따라 카테고리 `<select>` 값이 자동 변경되고 `.auto-hint` 배너가 표시됩니다(150ms 디바운스). 사용자가 직접 select를 변경하면 `userPickedCategory = true`로 설정되어 입력창이 비워질 때까지 자동 분류가 잠깁니다.

### 할일 스키마
```js
{ id: string, text: string, category: 'work'|'personal'|'study', completed: boolean, createdAt: ISO8601 }
```

### 다크 모드
`localStorage`의 `'theme'` 키에 저장됩니다. `<html>`의 `data-theme="dark"` 속성으로 적용되며, `applyTheme()`으로 전환합니다.

### 데이터 내보내기 / 가져오기
JSON 내보내기는 Blob URL 다운로드로, 가져오기는 `FileReader`로 처리합니다. 가져오기 시 전체 스키마 유효성 검사 후 덮어씁니다.

## 두 버전의 주요 차이점

| 항목 | `index.html` | `web_version/` |
|---|---|---|
| 레이아웃 | 단일 컬럼, 모바일 우선 | 사이드바 + 메인 패널, 앱 셸 구조 |
| 탭 | 가로 스크롤 탭 | 세로 사이드바 내비게이션 |
| JS | 인라인 `<script>` | 외부 `script.js` |
| 목록 레이아웃 | `flex-direction: column` | CSS Grid `auto-fill` |
| 목록 헤딩 | 없음 | `#list-title` / `#list-sub` (`updateListHeading()`으로 갱신) |
