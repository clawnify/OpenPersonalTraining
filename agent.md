# OpenPersonalTraining — agent guide

This app is a coaching platform for a personal trainer or online coach. It manages
**clients**, a seeded **exercise library** (800+ illustrated exercises), reusable **workouts**
built from that library, a **schedule** of sessions/assigned programs, and a
**payments** ledger. You drive it entirely through its own JSON API — no browser
needed. Base URL is this app's own origin; every route is under `/api`. The full
contract is at `/api/openapi.json`.

## What to help with

Trainers ask you to do the day-to-day admin: "add a new client", "build a push
day and assign it to Casey for Monday", "who owes me money?", "reschedule Riley to
Thursday". Translate those into the calls below. Always look up ids first (list the
clients / search the exercises) instead of guessing them.

## Clients

- `GET /api/clients?search=&status=active&page=1&limit=50` → `{ clients, total }`. Each client carries `session_count` and `balance_due` (unpaid total).
- `GET /api/clients/{id}` → `{ client, sessions, payments }` — the full profile.
- `POST /api/clients` `{ name*, email?, phone?, goal?, status?, notes? }`
- `PATCH /api/clients/{id}` — any subset of the same fields (`status`: `active` | `inactive`).
- `DELETE /api/clients/{id}` — cascades to their sessions and payments.

## Exercise library (read-only, seeded)

- `GET /api/exercises?search=&body_part=&target=&equipment=&page=1&limit=30` → `{ exercises, total }`.
- `GET /api/exercises/facets` → `{ body_parts, targets, equipment }` — the exact filter values (all lowercase, e.g. `upper legs`, `body weight`, `abs`). Use these when filtering.
- `GET /api/exercises/{id}` → one exercise with full `instructions` and `secondary_muscles`.
Search by name, then use the numeric `id` when adding an exercise to a workout.

## Workouts (the builder)

A workout is a reusable template — an ordered list of exercises, each with a
prescription (sets, reps, rest).

- `GET /api/workouts?search=&category=` → `{ workouts }` (each has `exercise_count`).
- `GET /api/workouts/{id}` → the workout with its ordered `exercises` (joined with exercise name/muscles).
- `POST /api/workouts` `{ name*, description?, category?, notes? }`
- `PATCH /api/workouts/{id}` / `DELETE /api/workouts/{id}`
- Add an exercise: `POST /api/workouts/{id}/exercises` `{ exercise_id*, sets?, reps?, rest_seconds?, notes? }` (`reps` is free text: `"10"`, `"8-12"`, `"30s"`, `"AMRAP"`). Returns the updated workout.
- Edit a row: `PATCH /api/workouts/{id}/exercises/{weId}` `{ sets?, reps?, rest_seconds?, notes? }`
- Reorder: `PUT /api/workouts/{id}/exercises/order` `{ order: [weId, weId, ...] }` (new order of `workout_exercises` ids).
- Remove a row: `DELETE /api/workouts/{id}/exercises/{weId}`

**Share a workout with a client:** `POST /api/workouts/{id}/share` → `{ share_token }` (mints one, or returns the existing token). The public link is `<this app's origin>/api/share/{share_token}` — a login-free, mobile-friendly page with images and instructions; append `?format=pdf` for a downloadable PDF. Revoke with `DELETE /api/workouts/{id}/share` (breaks the old link immediately). The share page shows only the workout — never client info.

**To build a workout:** create it, search the library for each movement, then POST
each exercise in the order you want.

## Schedule (sessions & assigned programs)

One entity covers the whole calendar. A timed 1-on-1 has `start_time`/`end_time`; a
remotely-assigned program is `session_type: "program"` with the times left blank and
a `workout_id` set.

- `GET /api/sessions?date=&from=&to=&client_id=&status=&session_type=` → `{ sessions }`.
- `POST /api/sessions` `{ client_id*, workout_id?, title?, session_type?, scheduled_date?, start_time?, end_time?, status?, notes? }`. `session_type`: `session` | `program` | `consult` | `assessment`; `status`: `scheduled` | `completed` | `cancelled` | `no_show`. `scheduled_date` defaults to today.
- `PATCH /api/sessions/{id}` (e.g. mark `completed`, reschedule) / `DELETE /api/sessions/{id}`.

**Assign a workout to a client:** `POST /api/sessions` with their `client_id`, the
`workout_id`, `session_type: "program"`, and a `scheduled_date`.

## Payments

- `GET /api/payments?client_id=&status=` → `{ payments, total_paid, total_pending }`.
- `POST /api/payments` `{ client_id*, amount*, description?, method?, status?, paid_date? }` (`status`: `paid` | `pending`; `method`: `cash` | `card` | `transfer`).
- `PATCH /api/payments/{id}` (e.g. mark a pending invoice `paid`) / `DELETE /api/payments/{id}`.
- Outstanding balances also surface per client on `GET /api/clients/{id}` and in the list's `balance_due`.

## Dashboard

- `GET /api/stats` → client / workout / exercise counts, today's & upcoming sessions, completed count, revenue (paid) and outstanding (pending) totals.

Keep replies short and do the work: resolve names to ids, make the calls, then
confirm what changed (e.g. "Added 5 exercises to *Upper Body Push* and assigned it
to Casey for Monday").
