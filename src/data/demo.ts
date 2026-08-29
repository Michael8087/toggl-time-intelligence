import type { Commitment, Project, Task, TimeEntry } from '../types'
import { at, iso } from '../lib/time'

/**
 * A fixed, reproducible demo workspace.
 *
 * The user is an independent contractor placed on a client project through a
 * talent platform. Everything is anchored to Monday 14 September 2026, 09:40 —
 * the morning the new task lands in their queue.
 */

export const USER = {
  name: 'Jan Kovář',
  initials: 'JK',
  role: 'Frontend Engineer · Contract',
  workspace: 'Kovář Studio',
  via: 'Toptal',
  weeksTracked: 0,
  daysSinceSignup: 1,
}

export const PROJECTS: Project[] = [
  {
    id: 'skoda-infotainment',
    name: 'Infotainment Frontend',
    client: 'Škoda Auto',
    color: '#E57CD8',
    billable: true,
    rate: 78,
    currency: 'EUR',
    via: 'Toptal',
  },
  {
    id: 'bosch-sensor',
    name: 'Sensor Dashboard',
    client: 'Bosch',
    color: '#7C5CD6',
    billable: true,
    rate: 72,
    currency: 'EUR',
    via: 'Toptal',
  },
  {
    id: 'internal',
    name: 'Studio admin',
    client: 'Kovář Studio',
    color: '#A79BAE',
    billable: false,
    rate: 0,
    currency: 'EUR',
    via: '—',
  },
]

export const HERO_TASK_ID = 'INF-241'
export const HERO_PROJECT_ID = 'skoda-infotainment'

/** The task at the centre of the story. */
export const HERO_TASK: Task = {
  id: HERO_TASK_ID,
  ref: 'INF-241',
  title: 'Implement navigation component',
  description:
    'Build the new navigation component for the infotainment frontend. Integrate the navigation states with the existing UI and ensure the component works with the current routing implementation.',
  projectId: HERO_PROJECT_ID,
  status: 'unplanned',
  dueAt: iso(at(2, 17)), // Wednesday 17:00 — set by the downstream integration test slot
  assignee: USER.name,
  tags: ['Component', 'Frontend'],
  dependencies: [
    {
      id: 'INF-236',
      title: 'Finalise navigation API',
      direction: 'upstream',
      state: 'in_progress',
      owner: 'Marek Dvořák',
      clearsAt: iso(at(0, 12)),
      note: 'Contract review is on your calendar this morning. Expected to land at 12:00.',
    },
    {
      id: 'INF-231',
      title: 'Navigation component design',
      direction: 'upstream',
      state: 'done',
      owner: 'Lucie Horáková',
      note: 'Figma handoff complete. Navigation states and transitions specified.',
    },
    {
      id: 'INF-244',
      title: 'Integration testing',
      direction: 'downstream',
      state: 'waiting',
      owner: 'QA — Škoda',
      clearsAt: iso(at(3, 9)),
      note: 'Booked for Thursday 09:00. This is what sets your Wednesday deadline.',
    },
  ],
}

/** Completed work in the same project — the raw material for estimates. */
export const COMPLETED_TASKS: Task[] = [
  {
    id: 'INF-198',
    ref: 'INF-198',
    title: 'Media player controls',
    description: 'Playback controls, seek bar and source switching for the media surface.',
    projectId: HERO_PROJECT_ID,
    status: 'done',
    assignee: 'Marek Dvořák',
    tags: ['Component', 'Frontend'],
    estimateHours: 9,
    trackedHours: 11,
    history: { estimateHours: 9, actualHours: 11, completedAt: '2026-08-21' },
  },
  {
    id: 'INF-206',
    ref: 'INF-206',
    title: 'Vehicle settings list',
    description: 'Scrollable settings list with grouped sections and search.',
    projectId: HERO_PROJECT_ID,
    status: 'done',
    assignee: 'Lucie Horáková',
    tags: ['Component', 'Frontend'],
    estimateHours: 6,
    trackedHours: 5.2833,
    history: { estimateHours: 6, actualHours: 5.2833, completedAt: '2026-08-27' },
  },
  {
    id: 'INF-215',
    ref: 'INF-215',
    title: 'Status bar component',
    description: 'Persistent status bar with connectivity, climate and media summary.',
    projectId: HERO_PROJECT_ID,
    status: 'done',
    assignee: 'Petra Sedláčková',
    tags: ['Component', 'Frontend'],
    estimateHours: 10,
    trackedHours: 9.0833,
    history: { estimateHours: 10, actualHours: 9.0833, completedAt: '2026-09-03' },
  },
  {
    id: 'INF-224',
    ref: 'INF-224',
    title: 'Climate panel component',
    description: 'Temperature, fan and seat controls with the shared control primitives.',
    projectId: HERO_PROJECT_ID,
    status: 'done',
    assignee: 'Marek Dvořák',
    tags: ['Component', 'Frontend'],
    estimateHours: 8,
    trackedHours: 8.3333,
    history: { estimateHours: 8, actualHours: 8.3333, completedAt: '2026-09-09' },
  },
]

/** Tasks that are neither the hero task nor finished — they make the project feel lived-in. */
export const OTHER_TASKS: Task[] = [
  {
    id: 'INF-236',
    ref: 'INF-236',
    title: 'Finalise navigation API',
    description: 'Lock the navigation endpoint contract with the platform team.',
    projectId: HERO_PROJECT_ID,
    status: 'in_progress',
    assignee: 'Marek Dvořák',
    tags: ['API'],
    estimateHours: 3,
    trackedHours: 2.5,
    dueAt: iso(at(0, 12)),
  },
  {
    id: 'INF-238',
    ref: 'INF-238',
    title: 'Infotainment release triage',
    description: 'Weekly triage of open defects ahead of the 1.4 release.',
    projectId: HERO_PROJECT_ID,
    status: 'planned',
    assignee: USER.name,
    tags: ['Maintenance'],
    estimateHours: 6,
    trackedHours: 0,
    dueAt: iso(at(2, 17)),
  },
  {
    id: 'INF-244',
    ref: 'INF-244',
    title: 'Integration testing — navigation',
    description: 'End-to-end test pass over the new navigation flows.',
    projectId: HERO_PROJECT_ID,
    status: 'planned',
    assignee: 'QA — Škoda',
    tags: ['QA'],
    estimateHours: 4,
    trackedHours: 0,
    dueAt: iso(at(3, 13)),
  },
]

/**
 * The user's week as it already stands. Availability is what is *left* after this.
 *
 * Before the Wednesday 17:00 deadline this leaves:
 *   Mon 13:00–17:00 (4h) · Tue 11:00–17:00 (6h) · Wed 09:00–11:00 (2h)  =  12h
 */
export const COMMITMENTS: Commitment[] = [
  {
    id: 'c1',
    title: 'Navigation API contract review',
    start: iso(at(0, 9)),
    end: iso(at(0, 12)),
    kind: 'task',
    projectId: HERO_PROJECT_ID,
    isDependencyWork: true,
  },
  {
    id: 'c2',
    title: 'Design handoff: navigation states',
    start: iso(at(0, 12)),
    end: iso(at(0, 13)),
    kind: 'meeting',
    projectId: HERO_PROJECT_ID,
  },
  {
    id: 'c3',
    title: 'Škoda weekly sync',
    start: iso(at(1, 9)),
    end: iso(at(1, 11)),
    kind: 'meeting',
    projectId: HERO_PROJECT_ID,
  },
  {
    id: 'c4',
    title: 'Infotainment release triage',
    start: iso(at(2, 11)),
    end: iso(at(2, 17)),
    kind: 'task',
    projectId: HERO_PROJECT_ID,
  },
  {
    id: 'c5',
    title: 'Integration testing — navigation',
    start: iso(at(3, 9)),
    end: iso(at(3, 13)),
    kind: 'task',
    projectId: HERO_PROJECT_ID,
  },
  {
    id: 'c6',
    title: 'Bosch — sensor dashboard',
    start: iso(at(3, 14)),
    end: iso(at(3, 17)),
    kind: 'task',
    projectId: 'bosch-sensor',
  },
  {
    id: 'c7',
    title: 'Bosch — sensor dashboard',
    start: iso(at(4, 9)),
    end: iso(at(4, 13)),
    kind: 'task',
    projectId: 'bosch-sensor',
  },
  {
    id: 'c8',
    title: 'Invoicing & admin',
    start: iso(at(4, 15)),
    end: iso(at(4, 17)),
    kind: 'personal',
    projectId: 'internal',
  },
]

/**
 * What automatic tracking will produce once the work actually happens.
 *
 * Monday runs 13:00–17:10 with a short break — 4h 00m.
 * Tuesday runs 11:00–16:55 with a lunch gap — 5h 15m.
 * Total 9h 15m against a 10h estimate, finishing 45 minutes early.
 */
export const SIMULATED_ENTRIES: TimeEntry[] = [
  {
    id: 't1',
    taskId: HERO_TASK_ID,
    start: iso(at(0, 13, 0)),
    end: iso(at(0, 14, 35)),
    activity: 'Component scaffolding & route wiring',
    source: 'auto',
  },
  {
    id: 't2',
    taskId: HERO_TASK_ID,
    start: iso(at(0, 14, 45)),
    end: iso(at(0, 16, 0)),
    activity: 'Navigation state model',
    source: 'auto',
  },
  {
    id: 't3',
    taskId: HERO_TASK_ID,
    start: iso(at(0, 16, 0)),
    end: iso(at(0, 17, 10)),
    activity: 'Wiring into the existing router',
    source: 'auto',
  },
  {
    id: 't4',
    taskId: HERO_TASK_ID,
    start: iso(at(1, 11, 0)),
    end: iso(at(1, 12, 30)),
    activity: 'Navigation states & transitions',
    source: 'auto',
  },
  {
    id: 't5',
    taskId: HERO_TASK_ID,
    start: iso(at(1, 12, 30)),
    end: iso(at(1, 13, 20)),
    activity: 'Route guard edge cases',
    source: 'auto',
  },
  {
    id: 't6',
    taskId: HERO_TASK_ID,
    start: iso(at(1, 14, 0)),
    end: iso(at(1, 15, 40)),
    activity: 'Design review fixes',
    source: 'auto',
  },
  {
    id: 't7',
    taskId: HERO_TASK_ID,
    start: iso(at(1, 15, 40)),
    end: iso(at(1, 16, 55)),
    activity: 'Unit tests & accessibility pass',
    source: 'auto',
  },
]

export const ALL_TASKS: Task[] = [HERO_TASK, ...OTHER_TASKS, ...COMPLETED_TASKS]

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id)

/** Comparable work the estimator leans on — same shape of task, similar scope. */
export const COMPARABLES = ['INF-198', 'INF-215', 'INF-224']
