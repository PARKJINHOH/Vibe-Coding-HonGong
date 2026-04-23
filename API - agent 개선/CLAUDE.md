# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

한국 음식 레시피 AI 어시스턴트. 냉장고 사진에서 재료를 인식하고 레시피를 추천하는 웹 애플리케이션.

## Commands

```bash
# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic "python-jose[cryptography]" "passlib[argon2]" requests python-dotenv

# Run the server (from step1/)
cd step1
python main.py
# OR with auto-reload
uvicorn main:app --reload --port 8000

# Test AI API connections
python test_image.py   # vision API test
python test_text.py    # text generation API test
```

## Environment Variables

Required in `.env` (at project root or `step1/`):
- `OPENROUTER_API_KEY` — OpenRouter API key for AI model access
- `JWT_SECRET` — secret key for signing JWT tokens

## Architecture

**Backend:** FastAPI (`step1/main.py`) — single file app serving both API and static frontend.

**Frontend:** Vanilla JS + HTML, served as static files from `step1/static/`. Each HTML page is a standalone view; `header.js` is the shared module managing auth state, login/signup modal, and navigation.

**Database:** SQLite (`step1/app.db`) via SQLAlchemy ORM. Two tables: `users` (accounts + preferences) and `saved_recipes`.

**Auth:** JWT tokens (7-day expiry), stored in localStorage on the client. Backend uses FastAPI `Depends()` for injecting authenticated user into protected routes.

**AI Integration:** All AI calls go through OpenRouter API.
- Vision: `nvidia/nemotron-nano-12b-v2-vl:free` — ingredient recognition from images
- Text: Multiple models with priority fallback (`openai/gpt-oss-20b:free` → `nvidia/nemotron-3-super-120b-a12b:free` → `google/gemma-4-31b-it:free`) — recipe generation with exponential backoff retry on rate limits

## Key Patterns

- User preferences (allergies, disliked ingredients, preferred cuisines) are stored in the `users` table and automatically injected into recipe generation prompts.
- The `/api/recognize` endpoint accepts base64-encoded images; the `/api/recipe` endpoint takes an ingredient list and optional filters.
- All authenticated endpoints use `Depends(get_current_user)` for the current user object.

## Product Requirements

`PRD_step1.md`, `PRD_step2.md`, `PRD_step3.md` define the feature specs, API contracts, UI flows, and Definition of Done for each development step. Refer to these when extending or debugging features.
