// Demo data — a handful of example clients, workouts, sessions and payments so
// a fresh install is not a wall of empty tables.
//
// It lives here rather than in schema.sql because a Clawnify deploy applies
// schema.sql as DDL only: any INSERT in that file fails the whole deploy.
// `ensureSeeded()` in index.ts inserts these rows only while `clients` is empty,
// so deleting the demo data makes it stay deleted.

/** `YYYY-MM-DD` for today, matching SQLite's `date('now')` (UTC). */
const today = (): string => new Date().toISOString().slice(0, 10);

/** `YYYY-MM-DD` for n days ago, matching SQLite's `date('now', '-n day')`. */
const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

/** A table's demo rows plus the columns they are written to. */
export type SeedTable = {
  readonly table: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly (string | number | null)[])[];
};

/** Insert order matters: workout_exercises, sessions and payments carry foreign keys. */
export const DEMO_SEED: readonly SeedTable[] = [
  {
    table: "clients",
    columns: ["id", "name", "email", "phone", "goal", "status"],
    rows: [
      ["11111111-0000-4000-8000-000000000001", "Jamie Rivera", "jamie@example.com", "555-0101", "Lose 5kg and build a squat habit", "active"],
      ["11111111-0000-4000-8000-000000000002", "Casey Morgan", "casey@example.com", "555-0102", "First unassisted pull-up", "active"],
      ["11111111-0000-4000-8000-000000000003", "Riley Chen", "riley@example.com", "555-0103", "Run a sub-50 10k", "active"],
      ["11111111-0000-4000-8000-000000000004", "Dakota Smith", "dakota@example.com", "555-0104", "Rehab shoulder, return to bench", "inactive"],
    ],
  },
  {
    table: "workouts",
    columns: ["id", "name", "description", "category"],
    rows: [
      ["22222222-0000-4000-8000-000000000001", "Full Body Strength A", "Compound-focused full-body day for beginners to intermediates.", "Strength"],
      ["22222222-0000-4000-8000-000000000002", "Upper Body Push", "Chest, shoulders and triceps volume day.", "Hypertrophy"],
    ],
  },
  {
    table: "workout_exercises",
    columns: ["id", "workout_id", "exercise_id", "position", "sets", "reps", "rest_seconds", "notes"],
    rows: [
      ["63548a35-436b-4c57-ab3f-fe735dc44594", "22222222-0000-4000-8000-000000000001", "47373c93-80de-431b-aab4-b4ac363c4b51", 0, 4, "8", 150, "Warm up to a working weight."],
      ["d5b0e9af-cd58-4241-978a-1e6318074f6a", "22222222-0000-4000-8000-000000000001", "b932c0ad-233c-4db3-8668-d4d18a81b67c", 1, 3, "10", 120, ""],
      ["dc895021-0287-4452-821d-579f316dea97", "22222222-0000-4000-8000-000000000001", "45fb1e5c-73ff-4994-ae25-fc0c7ea11c09", 2, 3, "10", 120, "Keep the bar close, hinge from the hips."],
      ["938ddfff-5303-46a2-bdff-29b6f1969da1", "22222222-0000-4000-8000-000000000001", "5345db61-6287-48b6-8df6-5a0b48f9047f", 3, 3, "AMRAP", 90, "Band-assist if needed."],
      ["ee83a935-5637-4265-b1ec-0de6970a2a4b", "22222222-0000-4000-8000-000000000002", "b932c0ad-233c-4db3-8668-d4d18a81b67c", 0, 4, "8", 120, ""],
      ["0bbe8bcd-be39-40ca-8ea0-32f757eb6b64", "22222222-0000-4000-8000-000000000002", "87e14d08-aad8-48b7-9a2b-e0d279ad3ca4", 1, 3, "15", 60, "Slow eccentric."],
    ],
  },
  {
    table: "sessions",
    columns: ["id", "client_id", "workout_id", "title", "session_type", "scheduled_date", "start_time", "end_time", "status"],
    rows: [
      ["28f284e4-dfec-478e-89df-d228a16dc199", "11111111-0000-4000-8000-000000000001", "22222222-0000-4000-8000-000000000001", "Full Body Strength A", "session", today(), "09:00", "10:00", "scheduled"],
      ["a2924a01-b115-44cd-83b9-b84337848fa6", "11111111-0000-4000-8000-000000000002", "22222222-0000-4000-8000-000000000001", "Assigned: Full Body Strength A", "program", today(), "", "", "scheduled"],
      ["dcffa8fe-8362-47d8-aaa3-c2039ee37d88", "11111111-0000-4000-8000-000000000003", null, "Intake consultation", "consult", today(), "14:00", "14:30", "scheduled"],
      ["0169f406-b1da-4161-a2f0-cc9d631d922b", "11111111-0000-4000-8000-000000000001", "22222222-0000-4000-8000-000000000001", "Full Body Strength A", "session", daysAgo(1), "09:00", "10:00", "completed"],
    ],
  },
  {
    table: "payments",
    columns: ["id", "client_id", "amount", "description", "method", "status", "paid_date"],
    rows: [
      ["8bad8881-e24f-4de0-a55f-d7d644aad0cf", "11111111-0000-4000-8000-000000000001", 240, "8-session pack", "card", "paid", daysAgo(3)],
      ["23b8a4dc-09f4-4e0d-bfd0-7df314384704", "11111111-0000-4000-8000-000000000002", 60, "Drop-in session", "cash", "paid", today()],
      ["ef4304f9-bbff-4a32-bd92-dd0a84903013", "11111111-0000-4000-8000-000000000003", 120, "Monthly online coaching", "transfer", "pending", today()],
    ],
  },
];
