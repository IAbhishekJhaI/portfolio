---
title: HackSync
summary: Teammate matching for hackathons. An LLM turns free-text bios into a skill taxonomy, and an explainable SQL engine ranks who complements whom.
category: software
stack: [TypeScript, PostgreSQL, Supabase, Gemini API]
period: Nov 2025
highlights:
  - 'Gemini 2.5 Flash extraction pipeline with schema-validated output, mapping bios to a canonical **65-skill taxonomy**, with caching and rate limiting.'
  - 'Explainable, mode-aware matching that ranks teammates by **rarity-weighted skill similarity** and role coverage, in indexed SQL plus TypeScript scoring.'
  - '**Postgres Row-Level Security** as the authorization layer, so the client can read and write directly under JWT policies.'
links:
  repo: ''   # TODO: GitHub link
  live: ''   # TODO: live link
featured: true
order: 2
---
## The problem
Hackathon teams form by who-knows-whom. HackSync matches people on what they can actually do, and shows *why* two people were matched.

## How it works
- **Extraction:** users describe themselves in plain language. Gemini 2.5 Flash returns schema-validated JSON that maps the bio onto a fixed 65-skill taxonomy. Responses are cached and calls are rate-limited, so cost and quota stay predictable.
- **Matching:** candidates are scored on rarity-weighted skill similarity (a shared rare skill counts for more than a shared common one) and on how well they cover the roles a team is missing. The scoring runs in indexed SQL, with the final ranking in TypeScript.
- **Security:** every table has Row-Level Security policies keyed on the user's JWT, so the browser talks to Postgres directly without a hand-written API layer for each read.
