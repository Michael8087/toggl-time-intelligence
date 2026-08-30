# Closing the loop between Estimate, Planned and Logged

A product case-study prototype for **Toggl 2.0** (built under the working name Toggl Focus),
aimed at the Individual Contributor / Freelancer experience.

**[Live prototype →](https://michael8087.github.io/toggl-time-intelligence/)**
 · **[The reasoning behind it →](https://michael8087.github.io/toggl-time-intelligence/reasoning)**

---

## The problem

Toggl 2.0 already ships three fields on every task: **Estimate**, **Planned** and **Logged**.
Its own marketing promises freelancers they will *"build a time history that makes every future
estimate smarter."*

In practice, the middle field is almost always empty. Filling it means hand-entering planned
blocks — pick a date, pick a start, pick an end, repeat — while holding a calendar, an upstream
dependency and a deadline in your head. So the loop never closes: the estimate is a guess nobody
checks, planned time stays blank, and logged time only ever becomes an invoice.

**This prototype does not add a field. It fills in the one that is already there.**

## The flow

Task intake → intelligent estimate → capacity check → automatic scheduling → automatic tracking
→ actual vs plan → report → better next estimate.

The two surfaces it lives on are both real Toggl 2.0 screens:

- the **task detail panel**, where Estimate / Planned / Logged already sit
- the **Timer split view**, which already renders logged time on the left of each day and
  planned time on the right — the app's existing vocabulary for plan versus actual

## The W0 constraint

The assignment treats first-week retention as a hard constraint, which rules out any concept
that needs months of personal history. So the default persona here is **day one**: signed up
this morning, nothing tracked.

- The estimate leans on the **client's existing project data** and the task's own scope, and is
  honest about it — a 7–15h range at Low confidence, not a confident single number.
- The **capacity check and scheduler need no history at all**. They are the day-one value.
- The capacity check tests the **pessimistic end of the range**, not just the point estimate,
  and says plainly when the worst case does not fit.
- Personal history sharpens the estimate by Friday. It is not the price of entry.

Toggle `Day 1 — no history` / `Day 5 — two tasks in` inside the estimate's reasoning panel to
see how fast the range tightens.

## Running it

```bash
npm install && npm run dev
```

## Reading the code

| Path | What lives there |
| --- | --- |
| `src/lib/estimate.ts` | The estimate as an auditable sum of factors, in both cold-start and warmed-up modes |
| `src/lib/scheduler.ts` | Real availability maths: working hours minus commitments, bounded by dependency and deadline; greedy earliest-fit; live validation |
| `src/data/demo.ts` | The fixed demo week. Every number in the prototype derives from here |
| `src/components/TaskDrawer.tsx` | The task panel, rebuilt from the real screen |
| `src/components/WeekCalendar.tsx` | Split-view calendar with draggable planned blocks |
| `src/routes/TaskDashboard.tsx` | Actual vs estimated, on the real dashboard's furniture |
| `src/routes/ReasoningPage.tsx` | The written case study: evidence, strategy, prioritization and the bet |

**Reasoning** in the top bar opens the written case study at `/reasoning` — what the brief
asked for, what the community's ranked feedback actually says, what Toggl's own 2.0
announcement commits to, and how those resolve into this bet rather than the most-requested
feature. Turn on **Case-study notes** to see the same reasoning annotated in place.

## Scope

Frontend only, no backend, mocked data — the point is to validate the interactions, the design
and the argument. Tracking is simulated rather than reading real OS activity. The estimate is a
transparent, deterministic model rather than a call to an LLM, because the case study's claim is
about *legibility*: every factor is a row the user can disagree with individually.

Built with Vite, React, TypeScript and Tailwind.
