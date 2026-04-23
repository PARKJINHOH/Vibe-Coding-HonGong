---
name: Performance fixes applied to step1/main.py
description: All four performance optimizations applied in April 2026 — async AI calls, exponential backoff, pagination, SQLite timeout
type: project
---

Four fixes applied to `step1/main.py` on 2026-04-23:

1. `requests` replaced with `httpx.AsyncClient`; `_call_or` split into `_call_vision` (async) and `_call_text` (async); both AI routes converted to `async def`; `image.file.read()` replaced with `await image.read()`. `import requests` and `import time` removed; `import httpx` and `import asyncio` added.

2. Backoff in `_call_vision` and `_call_text` changed from linear (`wait * i`) to exponential (`wait * (2 ** (i - 1))`). For `_call_vision` (retries=3, wait=10): 0 s → 10 s → 20 s. For `_call_text` (attempt in range(2), wait=10): 0 s → 10 s per model.

3. `GET /api/saved-recipes` now accepts `limit: int = 20` and `offset: int = 0` query params; response includes `total`, `limit`, `offset` alongside `recipes`.

4. SQLite engine `connect_args` extended with `"timeout": 20` to prevent "database is locked" errors under concurrent load.

**Why:** Blocking `requests.post()` inside async FastAPI routes stalled the ASGI event loop for the full AI call duration (~3–60 s). Linear backoff produced unnecessarily long cumulative waits. Full table-scan on saved_recipes would degrade as users accumulate recipes. SQLite default timeout is 5 s — too short for concurrent writes.

**How to apply:** These patterns are now the baseline; future AI call helpers must be async and use exponential backoff.
