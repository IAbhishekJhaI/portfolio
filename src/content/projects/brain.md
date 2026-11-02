---
title: Brain
summary: An open-source Claude Code skill that gives coding agents persistent project memory (decisions, code flow, todos), updated every session.
category: software
stack: [Claude Code, Markdown, Agent context engineering]
period: 2026
highlights:
  - 'Keeps three living documents per repo (decisions, flow, todo) so a new agent session starts with the project''s context instead of re-reading the codebase.'
  - 'Updated automatically at the end of meaningful changes, and read before answering "why did we do X?"'
links:
  repo: https://github.com/IAbhishekJhaI/brain
featured: true
order: 3
---
## Why
Coding agents forget everything between sessions. Each new session re-reads files, re-derives decisions, and sometimes undoes them.

## What it does
Brain adds a `brain/` folder with three documents: a **decision log** (what was chosen and why), a **flow** document (how a request moves through the code), and a **todo** list of risks and ideas. The skill tells the agent when to read them and when to update them, so project memory survives across sessions and across people.
