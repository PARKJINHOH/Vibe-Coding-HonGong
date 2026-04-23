---
name: Project overview
description: Tech stack, file map, auth pattern, and core user flow for the Korean recipe AI app
type: project
---

Korean food recipe AI assistant web app. Users upload fridge photos → AI recognises ingredients → personalised recipes are generated.

**Why:** Vibe-coding learning project; backend is FastAPI + SQLite in step1/. Frontend is plain HTML/JS served as static files.

**How to apply:** When suggesting fixes, keep the vanilla JS + HTML approach — no framework. Do not introduce build steps.

## File map
- `step1/static/index.html` — fridge photo upload + ingredient tag editor
- `step1/static/recipe.html` — recipe filter controls + AI-generated recipe cards + save flow
- `step1/static/myrecipes.html` — saved recipe list with search, sort, star rating, memo, pagination
- `step1/static/profile.html` — user preferences (allergies, disliked ingredients, preferred cuisines)
- `step1/static/header.js` — shared module: Auth object, login/signup modal, top navigation header

## Auth
- JWT stored in localStorage under `auth_token` / `auth_nick`
- `Auth.authFetch()` is the standard way to make authenticated requests
- `openLoginModal(callback)` triggers the modal and runs the callback after successful login

## API patterns
- `/api/saved-recipes` now supports `?limit=N&offset=M` and returns `{ recipes, total, limit, offset }`
- `/api/saved-recipes/:id` accepts PATCH (rating, memo) and DELETE
- `/api/recognize` — POST multipart image → `{ success, ingredients }`
- `/api/recipe` — POST JSON body → `{ success, recipes }` (uses exponential-backoff multi-model fallback)
