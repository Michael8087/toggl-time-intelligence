import type { EstimateModel, Task } from '../types'
import { COMPARABLES, COMPLETED_TASKS } from '../data/demo'
import { formatDuration } from './time'

/**
 * The estimate is built as a legible sum, not an opaque number.
 *
 * A baseline drawn from comparable finished work, then a small number of
 * adjustments the user can audit. Nothing here is a black box — the point of
 * the concept is that the user can see why the number is what it is and
 * disagree with a specific line rather than with "the AI".
 */

/**
 * `newcomer`    — day one. The user signed up this morning and has tracked nothing.
 *                 This is the default, because it is the state the product has to
 *                 win in: a first-week user gets value before the system has any
 *                 data about them.
 * `established` — day five, two tasks later, so the loop's payoff is visible
 *                 inside the same week.
 */
export type EstimateMode = 'newcomer' | 'established'

const comparables = () => COMPLETED_TASKS.filter((t) => COMPARABLES.includes(t.id))

export function comparableAverageHours(): number {
  const rows = comparables()
  return rows.reduce((sum, t) => sum + (t.trackedHours ?? 0), 0) / rows.length
}

export function accuracy(estimateHours: number, actualHours: number): number {
  if (!estimateHours) return 0
  return Math.max(0, 1 - Math.abs(actualHours - estimateHours) / estimateHours)
}

export function accuracyPct(estimateHours: number, actualHours: number): number {
  return Math.floor(accuracy(estimateHours, actualHours) * 100)
}

/** Completed work with accuracy attached, oldest first — the learning-loop record. */
export function estimateHistory() {
  return COMPLETED_TASKS.map((t) => ({
    id: t.id,
    title: t.title,
    estimateHours: t.estimateHours ?? 0,
    actualHours: t.trackedHours ?? 0,
    completedAt: t.history?.completedAt ?? '',
    accuracy: accuracyPct(t.estimateHours ?? 0, t.trackedHours ?? 0),
  })).sort((a, b) => a.completedAt.localeCompare(b.completedAt))
}

/**
 * Cold start is answered honestly rather than papered over: with no personal
 * data the system still has project and workspace signal and can read the task
 * scope, but it cannot apply a personal velocity correction — so it widens the
 * range, lowers the confidence, and says which of the two it is working from.
 */
export function buildEstimate(_task: Task, mode: EstimateMode = 'newcomer'): EstimateModel {
  const avg = comparableAverageHours() // ≈ 9h 28m

  if (mode === 'newcomer') {
    return {
      lowHours: 7,
      bestHours: 10,
      highHours: 15,
      confidence: 'Low',
      summary:
        'You signed up this morning, so none of this comes from your own history. It comes from the task description, the client’s existing project data and the open dependency — enough to commit to a date, not enough to be precise.',
      factors: [
        {
          id: 'baseline',
          label: 'This project’s components',
          hours: 7.75,
          baseline: true,
          detail:
            'Three other contributors have built components in this project. The same kind of work has taken between 6h and 14h — Toggl cannot yet tell where in that spread you sit, which is what the wide range is admitting.',
          evidence: ['3 contributors', '11 comparable components', 'spread 6h – 14h'],
        },
        {
          id: 'scope',
          label: 'Scope signals in the task',
          hours: 1.25,
          detail:
            'The description names two integrations beyond building the component itself: navigation state wiring and the existing router.',
          evidence: ['“Integrate the navigation states”', '“current routing implementation”'],
        },
        {
          id: 'dependency',
          label: 'Open upstream dependency',
          hours: 1,
          detail:
            'The navigation API is not final. On this project, components started against an unfinished contract have needed roughly an hour of rework.',
          evidence: ['Navigation API still open, expected 12:00 today'],
        },
      ],
      sources: [
        { label: 'This project', weight: 50, note: 'Comparable components by other contributors' },
        { label: 'Workspace', weight: 30, note: 'Similar frontend work across the client’s account' },
        { label: 'Task scope', weight: 20, note: 'Scope signals read from the description' },
      ],
      caveat:
        'No personal signal yet — which is exactly why the range is 7–15h rather than a confident single number. One finished task closes most of that gap; by your third the range is roughly half as wide.',
    }
  }

  return {
    lowHours: 8,
    bestHours: 10,
    highHours: 12,
    confidence: 'Medium',
    summary:
      'Day five. Two finished tasks of your own now sit alongside the project data, and the range has tightened from 7–15h to 8–12h.',
    factors: [
      {
        id: 'baseline',
        label: 'Your first two tasks',
        hours: 8.25,
        baseline: true,
        detail: `Your own component work now anchors the baseline instead of the project-wide spread, which averaged ${formatDuration(avg)}.`,
        evidence: ['Status bar component — 9h 05m', 'Climate panel component — 8h 20m'],
      },
      {
        id: 'scope',
        label: 'Scope signals in the task',
        hours: 1.25,
        detail:
          'The description names two integrations beyond building the component itself: navigation state wiring and the existing router.',
        evidence: ['“Integrate the navigation states”', '“current routing implementation”'],
      },
      {
        id: 'dependency',
        label: 'Open upstream dependency',
        hours: 1,
        detail:
          'The navigation API is not final. Components started against an unfinished contract have needed roughly an hour of rework.',
        evidence: ['Navigation API still open, expected 12:00 today'],
      },
      {
        id: 'velocity',
        label: 'Your pace so far',
        hours: -0.5,
        detail:
          'You have run slightly ahead of the project average on both tasks. Recent work is weighted more heavily than older work.',
        evidence: ['2 tasks, both inside estimate'],
      },
    ],
    sources: [
      { label: 'Your history', weight: 35, note: '2 tasks tracked since you signed up' },
      { label: 'This project', weight: 35, note: 'Comparable components, dependency history' },
      { label: 'Workspace', weight: 15, note: 'Similar frontend work by other contributors' },
      { label: 'Task scope', weight: 15, note: 'Scope signals read from the description' },
    ],
    caveat:
      'Weighted toward recent work on purpose. How long a task takes changes — component work here got noticeably faster once an AI coding assistant entered the workflow, and a model averaging a flat year of history would still be quoting the old pace.',
  }
}

/** The factor rows should always add up to the headline number. */
export function factorTotal(model: EstimateModel): number {
  return model.factors.reduce((sum, f) => sum + f.hours, 0)
}
