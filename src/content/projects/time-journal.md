---
title: Time Journal
summary: An offline-first time tracker that stores your day as 96 fifteen-minute slots and exports to Google Sheets without ever duplicating a row.
category: software
stack: [TypeScript, Next.js 15, PostgreSQL, Drizzle, TanStack Query]
period: Jan 2026
highlights:
  - 'Models 96 daily 15-minute slots as **idempotent upserts**, so retries never duplicate data and SQL analytics stay instant.'
  - '**Outbox + cron worker** for an eventually consistent, retry-safe one-way export to Google Sheets.'
  - 'Offline-first **PWA** with optimistic UI (TanStack Query, IndexedDB) and four input modes: tap-paint, drag-fill, keyboard and quick-log.'
links:
  live: https://time-journal-pro.vercel.app/
  repo: https://github.com/IAbhishekJhaI/TimeJournal
featured: true
order: 4
---
## Design
A day is 96 slots. Every edit is an upsert on `(user, date, slot)`, so sending the same write twice is harmless. That one decision makes offline sync and retries simple.

## Export without duplicates
Writes to Postgres also append to an **outbox** table in the same transaction. A cron worker drains the outbox to Google Sheets and marks rows done, retrying on failure. The export is eventually consistent and never blocks the user's request.

## Offline
The app is a PWA: edits apply instantly in the UI, queue locally in IndexedDB, and sync when the connection is back.
