---
org: Clicknscape
role: Software Engineer (first engineering hire)
period: May 2026 – Present
location: Remote
track: tech
order: 1
---
- Built the backend of an **LLM-powered travel planner** (FastAPI, async SQLAlchemy, PostgreSQL + PostGIS, Redis). A **Gemini tool-calling agent** runs the chat while a deterministic engine computes every time, route and cost, so no fact is hallucinated.
- Designed a **two-model agent loop**: a cheap temperature-0 model extracts structured JSON slots, and a stronger model calls tools and narrates. Both sit behind a **provider-agnostic LLM adapter** with vendor-neutral tool schemas.
- Cut Google Cloud API spend from **INR 7.7k per 15 days to within the free tier**: deterministic slot parsers run before the LLM (uncertain input falls back to it) and a place ledger dedupes Google Places calls.
- Modeled day planning as a prize-collecting **Vehicle Routing Problem with Time Windows** (OR-Tools) that honors opening hours, meals, weather and budget across multi-day, multi-city trips.
- Shipped **380+ tests** with fake LLM/API providers, 14 Alembic migrations, usage telemetry, and graceful degradation (fail-open rate limiting, fallback routing).
