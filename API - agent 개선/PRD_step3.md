# PRD Step 3 — 사용자 프로필 및 레시피 저장

## 개요

사용자가 계정을 만들고, Step 2에서 생성된 레시피를 저장·관리할 수 있는 개인 프로필 기능이다.

---

## 목표

- 이메일 기반 회원가입 / 로그인 기능 제공
- 마음에 드는 레시피를 저장하고 언제든 다시 볼 수 있도록 관리
- 사용자별 식재료 선호/기피 설정을 프로필에 저장하여 이후 레시피 생성에 반영
- 저장된 레시피에 메모를 추가하거나 별점을 매길 수 있는 개인화 기능

---

## 사용자 스토리

> "마음에 드는 레시피를 저장해두고, 나중에 다시 꺼내보고 싶다."
> "내가 못 먹는 재료(알레르기)를 설정해두면 그걸 피한 레시피만 추천받고 싶다."

---

## 기능 요구사항

### FR-3-1. 회원가입 / 로그인

- 이메일 + 비밀번호 방식의 회원가입을 지원한다.
- 비밀번호는 bcrypt로 해시하여 저장한다.
- 로그인 성공 시 JWT 토큰을 발급하여 클라이언트 로컬 스토리지에 저장한다.
- 토큰 만료 시간: 7일
- 로그아웃 시 토큰을 삭제한다.

**API 엔드포인트**
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 |

### FR-3-2. 사용자 프로필 관리

사용자는 아래 정보를 설정할 수 있다.

| 필드 | 타입 | 설명 |
|------|------|------|
| nickname | string | 표시 이름 |
| allergies | string[] | 알레르기 식재료 목록 |
| disliked_ingredients | string[] | 기피 식재료 목록 |
| preferred_cuisine | string[] | 선호 요리 종류 (한식, 양식 등) |
| default_servings | number | 기본 인원수 |

- 프로필에 설정된 알레르기/기피 식재료는 Step 2 레시피 생성 프롬프트에 자동으로 포함된다.
- API 엔드포인트: `GET /api/profile`, `PUT /api/profile`

### FR-3-3. 레시피 저장

- 사용자는 Step 2의 레시피 카드에서 `저장하기` 버튼으로 레시피를 저장할 수 있다.
- 저장 시 다음 데이터를 DB에 기록한다.

```json
{
  "user_id": "uuid",
  "recipe_id": "uuid",
  "saved_at": "ISO8601",
  "rating": null,
  "memo": null,
  "recipe_data": { /* Step 2의 레시피 전체 JSON */ }
}
```

- API 엔드포인트:
  - `POST /api/saved-recipes` — 저장
  - `GET /api/saved-recipes` — 목록 조회
  - `DELETE /api/saved-recipes/:id` — 삭제

### FR-3-4. 저장 레시피 목록 (My 레시피)

- 저장된 레시피를 카드 목록으로 표시한다.
- 정렬 옵션: 최근 저장순 / 별점 높은 순
- 검색: 레시피 이름 또는 태그로 검색
- 각 카드에서 상세 보기, 삭제, 별점/메모 수정이 가능하다.

### FR-3-5. 별점 및 메모

- 저장된 레시피에 별점(1~5)을 매길 수 있다.
- 자유 형식 텍스트 메모를 추가할 수 있다. (최대 500자)
- API 엔드포인트: `PATCH /api/saved-recipes/:id`

---

## 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 인증 | 모든 /api/profile, /api/saved-recipes 엔드포인트는 JWT 인증 필수 |
| 데이터 보안 | 비밀번호 bcrypt 해시 저장, JWT secret은 환경변수 관리 |
| 개인정보 | 사용자 요청 시 계정 및 저장 데이터 전체 삭제 기능 제공 |
| 저장 용량 | 사용자당 저장 레시피 최대 100개 |

---

## 데이터베이스 스키마

### users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 사용자 고유 ID |
| email | VARCHAR UNIQUE | 이메일 |
| password_hash | VARCHAR | bcrypt 해시 |
| nickname | VARCHAR | 닉네임 |
| allergies | JSON | 알레르기 재료 목록 |
| disliked_ingredients | JSON | 기피 재료 목록 |
| preferred_cuisine | JSON | 선호 요리 종류 |
| default_servings | INTEGER | 기본 인원수 (기본값 2) |
| created_at | TIMESTAMP | 가입일 |

### saved_recipes 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 저장 레코드 ID |
| user_id | UUID FK | users.id 참조 |
| recipe_data | JSON | 레시피 전체 데이터 |
| rating | INTEGER | 별점 1~5 (nullable) |
| memo | TEXT | 메모 (nullable) |
| saved_at | TIMESTAMP | 저장일 |

---

## UI 흐름

```
[헤더 - 로그인/회원가입 버튼]
      ↓ (클릭)
[로그인 모달 or 회원가입 페이지]
      ↓ (성공)
[헤더 - 사용자 닉네임 + 프로필 메뉴]
      ├─ [My 레시피] → 저장 레시피 목록
      │     ├─ 레시피 카드 클릭 → 상세 보기
      │     ├─ 별점 / 메모 수정
      │     └─ 삭제
      └─ [프로필 설정]
            ├─ 닉네임 변경
            ├─ 알레르기 / 기피 재료 설정
            ├─ 선호 요리 종류 설정
            └─ 기본 인원수 설정
```

---

## Step 2 연동 — 프로필 정보 활용

Step 2 레시피 생성 프롬프트에 아래 정보를 자동으로 포함한다.

```
사용자 알레르기 재료 (반드시 제외): {allergies}
사용자 기피 재료 (가능하면 제외): {disliked_ingredients}
선호 요리 종류: {preferred_cuisine}
```

로그인하지 않은 사용자는 프로필 정보 없이 기본 레시피를 생성한다.

---

## 완료 기준 (Definition of Done)

- [ ] 회원가입 / 로그인 / 로그아웃 정상 동작
- [ ] JWT 인증 미들웨어 적용 확인
- [ ] 프로필 설정 저장 및 불러오기 동작 확인
- [ ] 레시피 저장 / 목록 조회 / 삭제 동작 확인
- [ ] 별점 및 메모 수정 동작 확인
- [ ] 프로필 알레르기 정보가 Step 2 프롬프트에 반영되는지 확인
- [ ] 비로그인 사용자 접근 시 로그인 유도 모달 표시 확인

---

## 기술 스택 (제안)

| 영역 | 기술 |
|------|------|
| 인증 | JWT (python-jose 또는 jsonwebtoken) |
| 비밀번호 | bcrypt |
| DB | SQLite (개발) / PostgreSQL (프로덕션) |
| ORM | SQLAlchemy (Python) 또는 Prisma (Node.js) |
| 환경변수 | JWT_SECRET, DB_URL |
