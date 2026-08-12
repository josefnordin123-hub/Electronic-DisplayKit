# DIY Electronics Display Kit Shop — MVP Setup Spec

**Runbook**: Startup MVP Build
**Mode**: NEXUS-Sprint
**Status**: Phase 0 — Spec Lock
**Date**: 2026-08-10
**Timeline**: 4-6 weeks to MVP

## Problem Statement
Give hobbyists/makers a complete, easy-to-build display kit (round SPI screen)
without needing to source components themselves or write their own firmware
from scratch.

## Target Users
- Makers
- Hobby electronics enthusiasts
- Dashboard / smart-home add-on builders
- Beginners in embedded/IoT

## Product (MVP Scope)
**Round SPI Display Kit**: ESP32 + round SPI display (e.g. GC9A01) + cables +
USB-C + 3D-printed enclosure + screws. Fast, colorful output (clocks, gauges,
animated widgets, live-data dashboards).

## Core Features for MVP
1. **E-commerce store** — product page, checkout flow with inventory and
   shipping handling.
2. **WebSerial-based web tool** — customers "program" what shows on the
   display (text, images, simple widgets/gauges) directly from the browser.
3. **Onboarding/documentation** — assembly + first boot (pinout, soldering/
   wiring, firmware flashing).

## Tech Stack
**Status: OPEN — not yet decided.** Backend Architect proposes a stack based
on the needs below (small e-commerce + physical inventory + WebSerial
frontend) and the team surfaces the decision to the founder before locking it.

## Constraints
- Physical product: inventory, shipping, 3D printing (in-house or
  outsourced) must be accounted for operationally, not just in code.
- **4-6 weeks to MVP.**
- WebSerial only works in Chromium-based browsers. Must be flagged/handled in
  UX, with fallback instructions for Safari/Firefox users.
- Future product lines (e-ink, etc.) are out of scope now, but the
  architecture — especially the WebSerial config layer — must not be built so
  narrowly that a second display type becomes impossible to add later.

## Roster
- **Core Team (always on)**: Agents Orchestrator, Senior Project Manager,
  Sprint Prioritizer, UX Architect, Frontend Developer, Backend Architect,
  DevOps Automator, Evidence Collector, Reality Checker
- **Growth Team (activates week 3+)**: Growth Hacker, Content Creator,
  Social Media Strategist
- **Support Team (as needed)**: Brand Guardian, Analytics Reporter, Rapid
  Prototyper, AI Engineer, Performance Benchmarker, Infrastructure Maintainer

## NEXUS-Sprint Phase Plan
- **Phase 0 — Spec Lock**: this document + task list + sprint scope.
- **Phase 1 — Architecture & UX Foundation**: Backend Architect proposes
  stack (gate: founder confirms before lock); UX Architect defines store IA,
  WebSerial tool UX (incl. browser-fallback UX), and onboarding flow.
- **Phase 2 — Sprint Roadmap**: Sprint Prioritizer allocates Phase-1 output
  across weeks 1-6 for the Core Team.
- **Phase 3 — Build Loop**: Frontend Developer / Backend Architect / DevOps
  Automator implement sprint-by-sprint; Evidence Collector validates each
  deliverable against acceptance criteria.
- **Phase 4 — Reality Check Gate**: Reality Checker certifies MVP readiness
  (defaults to "NEEDS WORK" without overwhelming evidence).
- **Phase 5 — Growth Activation (week 3+)**: Growth Hacker / Content Creator
  / Social Media Strategist plan launch in parallel with late build sprints.

## Explicit Non-Goals (MVP)
- Additional display product lines (e-ink, square displays, etc.)
- Anything beyond the three core features listed above
