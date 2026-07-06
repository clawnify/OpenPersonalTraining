import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { initDB, query, get, run } from "./db.js";

type Env = { Bindings: { DB: D1Database; CLAWNIFY_TOKEN?: string } };

const app = new OpenAPIHono<Env>();

app.use("*", async (c, next) => {
  initDB(c.env);
  await next();
});

// ── Shared Schemas ─────────────────────────────────────────────────

const ErrorSchema = z.object({ error: z.string() }).openapi("Error");
const OkSchema = z.object({ ok: z.boolean() }).openapi("Ok");
const IdParam = z.object({ id: z.string().openapi({ description: "Resource ID" }) });

const ClientSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    goal: z.string(),
    status: z.string(),
    notes: z.string(),
    session_count: z.number().int().optional(),
    balance_due: z.number().optional(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("Client");

const ExerciseSchema = z
  .object({
    id: z.string(),
    source_id: z.string(),
    name: z.string(),
    body_part: z.string(),
    target: z.string(),
    equipment: z.string(),
    secondary_muscles: z.array(z.string()),
    instructions: z.string(),
    image: z.string(),
  })
  .openapi("Exercise");

const WorkoutExerciseSchema = z
  .object({
    id: z.string(),
    workout_id: z.string(),
    exercise_id: z.string(),
    position: z.number().int(),
    sets: z.number().int(),
    reps: z.string(),
    rest_seconds: z.number().int(),
    notes: z.string(),
    // joined from exercises
    name: z.string().optional(),
    body_part: z.string().optional(),
    target: z.string().optional(),
    equipment: z.string().optional(),
    image: z.string().optional(),
  })
  .openapi("WorkoutExercise");

const WorkoutSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    notes: z.string(),
    share_token: z.string().optional(),
    exercise_count: z.number().int().optional(),
    exercises: z.array(WorkoutExerciseSchema).optional(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("Workout");

const SessionSchema = z
  .object({
    id: z.string(),
    client_id: z.string(),
    workout_id: z.string().nullable(),
    title: z.string(),
    session_type: z.string(),
    scheduled_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    status: z.string(),
    notes: z.string(),
    client_name: z.string().optional(),
    workout_name: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("Session");

const PaymentSchema = z
  .object({
    id: z.string(),
    client_id: z.string(),
    amount: z.number(),
    description: z.string(),
    method: z.string(),
    status: z.string(),
    paid_date: z.string(),
    client_name: z.string().optional(),
    created_at: z.string(),
  })
  .openapi("Payment");

// ── Helpers ────────────────────────────────────────────────────────

function parseSecondary(row: any): any {
  if (row && typeof row.secondary_muscles === "string") {
    try {
      row.secondary_muscles = JSON.parse(row.secondary_muscles);
    } catch {
      row.secondary_muscles = [];
    }
  }
  return row;
}

const jsonErr = { content: { "application/json": { schema: ErrorSchema } } };
const jsonOk = { content: { "application/json": { schema: OkSchema } } };

// ── Public share page rendering ────────────────────────────────────
// Exercise images: public-domain free-exercise-db via jsDelivr, pinned to a SHA
// (mirror of src/client/lib/exercise-image.ts).
const SHARE_IMG_BASE =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@b0eed061e1c832b3ed815fbaa4b45b3cdc14df49/exercises";

const escapeHtml = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!,
  );

const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "workout";

/** Self-contained, printable HTML for a shared workout. No PII — workout + exercises only. */
function renderShareHtml(workout: any, exercises: any[]): string {
  const rows = exercises
    .map((e, i) => {
      const img = e.image
        ? `<img class="ex-img" src="${SHARE_IMG_BASE}/${escapeHtml(e.image)}" alt="${escapeHtml(e.name)}" loading="lazy" />`
        : "";
      const tags = [e.target, e.equipment].filter(Boolean).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      const rest = e.rest_seconds ? ` · ${escapeHtml(e.rest_seconds)}s rest` : "";
      const notes = e.notes ? `<p class="notes">${escapeHtml(e.notes)}</p>` : "";
      const instr = e.instructions ? `<p class="instr">${escapeHtml(e.instructions)}</p>` : "";
      return `<li class="ex">
        <div class="ex-n">${i + 1}</div>
        ${img}
        <div class="ex-body">
          <div class="ex-name">${escapeHtml(e.name)}</div>
          <div class="ex-tags">${tags}</div>
          <div class="ex-rx">${escapeHtml(e.sets)} × ${escapeHtml(e.reps)}${rest}</div>
          ${notes}${instr}
        </div>
      </li>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(workout.name)}</title>
<style>
  :root{--ink:#1a202c;--muted:#475569;--line:#e2e8f0;--sunken:#f1f5f9;--coral:#dd5164}
  *{box-sizing:border-box}
  body{margin:0;background:#f8fafc;color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif}
  .wrap{max-width:720px;margin:0 auto;padding:24px 16px 64px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}
  h1{font-size:22px;font-weight:700;margin:0}
  .cat{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.04em;color:var(--muted);background:var(--sunken);border:1px solid var(--line);border-radius:4px;padding:2px 8px;margin-left:8px;vertical-align:middle}
  .desc{color:var(--muted);margin:4px 0 0}
  .count{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:20px 0 10px}
  ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
  .ex{display:flex;gap:12px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px}
  .ex-n{flex:none;width:24px;height:24px;border-radius:50%;background:var(--sunken);color:var(--muted);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .ex-img{flex:none;width:76px;height:76px;object-fit:cover;border-radius:8px;border:1px solid var(--line);background:var(--sunken)}
  .ex-body{min-width:0;flex:1}
  .ex-name{font-weight:600;text-transform:capitalize}
  .ex-tags{margin:3px 0}
  .tag{display:inline-block;font-size:11px;color:var(--muted);background:var(--sunken);border:1px solid var(--line);border-radius:4px;padding:1px 6px;margin-right:4px;text-transform:capitalize}
  .ex-rx{font-weight:600;margin-top:2px}
  .notes{color:var(--muted);margin:6px 0 0;font-style:italic}
  .instr{color:var(--muted);font-size:13px;margin:6px 0 0}
  .btn{border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-weight:600;font-size:13px;border-radius:6px;padding:7px 12px;cursor:pointer}
  .foot{margin-top:32px;text-align:center;color:#94a3b8;font-size:12px}
  @media print{body{background:#fff}.no-print{display:none}.ex{break-inside:avoid}}
</style></head><body>
<div class="wrap">
  <div class="top">
    <div>
      <h1>${escapeHtml(workout.name)}${workout.category ? `<span class="cat">${escapeHtml(workout.category)}</span>` : ""}</h1>
      ${workout.description ? `<p class="desc">${escapeHtml(workout.description)}</p>` : ""}
    </div>
    <button class="btn no-print" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="count">${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}</div>
  <ul>${rows}</ul>
  <div class="foot">Shared from your coach · Trainer Studio</div>
</div>
</body></html>`;
}

// ── Dashboard stats ────────────────────────────────────────────────

const getStats = createRoute({
  method: "get",
  path: "/api/stats",
  responses: {
    200: {
      description: "Dashboard stats",
      content: {
        "application/json": {
          schema: z.object({
            clients: z.number().int(),
            active_clients: z.number().int(),
            workouts: z.number().int(),
            exercises: z.number().int(),
            sessions_today: z.number().int(),
            upcoming_sessions: z.number().int(),
            completed_sessions: z.number().int(),
            revenue: z.number(),
            outstanding: z.number(),
          }),
        },
      },
    },
  },
});

app.openapi(getStats, async (c) => {
  const today = new Date().toISOString().split("T")[0];
  const one = async (sql: string, params: unknown[] = []) =>
    (await get<{ v: number }>(sql, params))?.v || 0;
  return c.json(
    {
      clients: await one("SELECT COUNT(*) v FROM clients"),
      active_clients: await one("SELECT COUNT(*) v FROM clients WHERE status = 'active'"),
      workouts: await one("SELECT COUNT(*) v FROM workouts"),
      exercises: await one("SELECT COUNT(*) v FROM exercises"),
      sessions_today: await one("SELECT COUNT(*) v FROM sessions WHERE scheduled_date = ?", [today]),
      upcoming_sessions: await one(
        "SELECT COUNT(*) v FROM sessions WHERE status = 'scheduled' AND scheduled_date >= ?",
        [today],
      ),
      completed_sessions: await one("SELECT COUNT(*) v FROM sessions WHERE status = 'completed'"),
      revenue: await one("SELECT COALESCE(SUM(amount),0) v FROM payments WHERE status = 'paid'"),
      outstanding: await one("SELECT COALESCE(SUM(amount),0) v FROM payments WHERE status = 'pending'"),
    },
    200,
  );
});

// ── Clients ────────────────────────────────────────────────────────

const listClients = createRoute({
  method: "get",
  path: "/api/clients",
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      status: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Paginated clients",
      content: {
        "application/json": {
          schema: z.object({ clients: z.array(ClientSchema), total: z.number().int() }),
        },
      },
    },
  },
});

app.openapi(listClients, async (c) => {
  const q = c.req.valid("query");
  const page = Math.max(1, parseInt(q.page || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(q.limit || "50", 10)));
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: unknown[] = [];
  if (q.search) {
    where += " AND (name LIKE ? OR email LIKE ? OR goal LIKE ?)";
    const s = `%${q.search}%`;
    params.push(s, s, s);
  }
  if (q.status) {
    where += " AND status = ?";
    params.push(q.status);
  }

  const total = (await get<{ v: number }>(`SELECT COUNT(*) v FROM clients ${where}`, params))?.v || 0;
  const clients = await query<any>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM sessions s WHERE s.client_id = c.id) AS session_count,
       (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.client_id = c.id AND p.status = 'pending') AS balance_due
     FROM clients c ${where} ORDER BY c.name LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return c.json({ clients, total }, 200);
});

const getClient = createRoute({
  method: "get",
  path: "/api/clients/{id}",
  request: { params: IdParam },
  responses: {
    200: {
      description: "Client with sessions and payments",
      content: {
        "application/json": {
          schema: z.object({
            client: ClientSchema,
            sessions: z.array(SessionSchema),
            payments: z.array(PaymentSchema),
          }),
        },
      },
    },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(getClient, async (c) => {
  const id = c.req.valid("param").id;
  const client = await get<any>("SELECT * FROM clients WHERE id = ?", [id]);
  if (!client) return c.json({ error: "Client not found" }, 404);
  const sessions = await query<any>(
    `SELECT s.*, w.name AS workout_name FROM sessions s
       LEFT JOIN workouts w ON w.id = s.workout_id
     WHERE s.client_id = ? ORDER BY s.scheduled_date DESC, s.start_time DESC`,
    [id],
  );
  const payments = await query<any>(
    "SELECT * FROM payments WHERE client_id = ? ORDER BY paid_date DESC, id DESC",
    [id],
  );
  return c.json({ client, sessions, payments }, 200);
});

const createClient = createRoute({
  method: "post",
  path: "/api/clients",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1),
            email: z.string().optional(),
            phone: z.string().optional(),
            goal: z.string().optional(),
            status: z.string().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Created", content: { "application/json": { schema: ClientSchema } } },
    400: { description: "Bad request", ...jsonErr },
  },
});

app.openapi(createClient, async (c) => {
  const b = c.req.valid("json");
  const id = crypto.randomUUID();
  await run(
    "INSERT INTO clients (id, name, email, phone, goal, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, b.name, b.email || "", b.phone || "", b.goal || "", b.status || "active", b.notes || ""],
  );
  const client = await get<any>("SELECT * FROM clients WHERE id = ?", [id]);
  return c.json(client, 200);
});

const updateClient = createRoute({
  method: "patch",
  path: "/api/clients/{id}",
  request: {
    params: IdParam,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            goal: z.string().optional(),
            status: z.string().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: ClientSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(updateClient, async (c) => {
  const id = c.req.valid("param").id;
  const b = c.req.valid("json");
  const existing = await get<any>("SELECT * FROM clients WHERE id = ?", [id]);
  if (!existing) return c.json({ error: "Client not found" }, 404);
  const fields = ["name", "email", "phone", "goal", "status", "notes"] as const;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      params.push(b[f]);
    }
  }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    await run(`UPDATE clients SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  }
  const client = await get<any>("SELECT * FROM clients WHERE id = ?", [id]);
  return c.json(client, 200);
});

const deleteClient = createRoute({
  method: "delete",
  path: "/api/clients/{id}",
  request: { params: IdParam },
  responses: { 200: { description: "Deleted", ...jsonOk } },
});

app.openapi(deleteClient, async (c) => {
  await run("DELETE FROM clients WHERE id = ?", [c.req.valid("param").id]);
  return c.json({ ok: true }, 200);
});

// ── Exercise library ───────────────────────────────────────────────

const listExercises = createRoute({
  method: "get",
  path: "/api/exercises",
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      body_part: z.string().optional(),
      target: z.string().optional(),
      equipment: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Paginated exercises",
      content: {
        "application/json": {
          schema: z.object({ exercises: z.array(ExerciseSchema), total: z.number().int() }),
        },
      },
    },
  },
});

app.openapi(listExercises, async (c) => {
  const q = c.req.valid("query");
  const page = Math.max(1, parseInt(q.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(q.limit || "30", 10)));
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: unknown[] = [];
  if (q.search) {
    where += " AND name LIKE ?";
    params.push(`%${q.search}%`);
  }
  if (q.body_part) {
    where += " AND body_part = ?";
    params.push(q.body_part);
  }
  if (q.target) {
    where += " AND target = ?";
    params.push(q.target);
  }
  if (q.equipment) {
    where += " AND equipment = ?";
    params.push(q.equipment);
  }

  const total = (await get<{ v: number }>(`SELECT COUNT(*) v FROM exercises ${where}`, params))?.v || 0;
  const rows = await query<any>(
    `SELECT * FROM exercises ${where} ORDER BY name LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return c.json({ exercises: rows.map(parseSecondary), total }, 200);
});

const getExerciseFacets = createRoute({
  method: "get",
  path: "/api/exercises/facets",
  responses: {
    200: {
      description: "Distinct filter values",
      content: {
        "application/json": {
          schema: z.object({
            body_parts: z.array(z.string()),
            targets: z.array(z.string()),
            equipment: z.array(z.string()),
          }),
        },
      },
    },
  },
});

app.openapi(getExerciseFacets, async (c) => {
  const col = async (name: string) =>
    (await query<{ v: string }>(`SELECT DISTINCT ${name} v FROM exercises WHERE ${name} != '' ORDER BY ${name}`)).map(
      (r) => r.v,
    );
  return c.json(
    { body_parts: await col("body_part"), targets: await col("target"), equipment: await col("equipment") },
    200,
  );
});

const getExercise = createRoute({
  method: "get",
  path: "/api/exercises/{id}",
  request: { params: IdParam },
  responses: {
    200: { description: "Exercise", content: { "application/json": { schema: ExerciseSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(getExercise, async (c) => {
  const ex = await get<any>("SELECT * FROM exercises WHERE id = ?", [c.req.valid("param").id]);
  if (!ex) return c.json({ error: "Exercise not found" }, 404);
  return c.json(parseSecondary(ex), 200);
});

// ── Workouts ───────────────────────────────────────────────────────

const listWorkouts = createRoute({
  method: "get",
  path: "/api/workouts",
  request: { query: z.object({ search: z.string().optional(), category: z.string().optional() }) },
  responses: {
    200: {
      description: "Workouts",
      content: { "application/json": { schema: z.object({ workouts: z.array(WorkoutSchema) }) } },
    },
  },
});

app.openapi(listWorkouts, async (c) => {
  const q = c.req.valid("query");
  let where = "WHERE 1=1";
  const params: unknown[] = [];
  if (q.search) {
    where += " AND name LIKE ?";
    params.push(`%${q.search}%`);
  }
  if (q.category) {
    where += " AND category = ?";
    params.push(q.category);
  }
  const workouts = await query<any>(
    `SELECT w.*, (SELECT COUNT(*) FROM workout_exercises we WHERE we.workout_id = w.id) AS exercise_count
     FROM workouts w ${where} ORDER BY w.updated_at DESC`,
    params,
  );
  return c.json({ workouts }, 200);
});

async function loadWorkoutExercises(workoutId: number | string) {
  return query<any>(
    `SELECT we.*, e.name, e.body_part, e.target, e.equipment, e.image
       FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ? ORDER BY we.position, we.id`,
    [workoutId],
  );
}

const getWorkout = createRoute({
  method: "get",
  path: "/api/workouts/{id}",
  request: { params: IdParam },
  responses: {
    200: { description: "Workout with exercises", content: { "application/json": { schema: WorkoutSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(getWorkout, async (c) => {
  const id = c.req.valid("param").id;
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  if (!workout) return c.json({ error: "Workout not found" }, 404);
  workout.exercises = await loadWorkoutExercises(id);
  return c.json(workout, 200);
});

const createWorkout = createRoute({
  method: "post",
  path: "/api/workouts",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            category: z.string().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Created", content: { "application/json": { schema: WorkoutSchema } } },
  },
});

app.openapi(createWorkout, async (c) => {
  const b = c.req.valid("json");
  const id = crypto.randomUUID();
  await run(
    "INSERT INTO workouts (id, name, description, category, notes) VALUES (?, ?, ?, ?, ?)",
    [id, b.name, b.description || "", b.category || "", b.notes || ""],
  );
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  workout.exercises = [];
  return c.json(workout, 200);
});

const updateWorkout = createRoute({
  method: "patch",
  path: "/api/workouts/{id}",
  request: {
    params: IdParam,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional(),
            description: z.string().optional(),
            category: z.string().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: WorkoutSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(updateWorkout, async (c) => {
  const id = c.req.valid("param").id;
  const b = c.req.valid("json");
  const existing = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  if (!existing) return c.json({ error: "Workout not found" }, 404);
  const fields = ["name", "description", "category", "notes"] as const;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      params.push(b[f]);
    }
  }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    await run(`UPDATE workouts SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  }
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  workout.exercises = await loadWorkoutExercises(id);
  return c.json(workout, 200);
});

const deleteWorkout = createRoute({
  method: "delete",
  path: "/api/workouts/{id}",
  request: { params: IdParam },
  responses: { 200: { description: "Deleted", ...jsonOk } },
});

app.openapi(deleteWorkout, async (c) => {
  await run("DELETE FROM workouts WHERE id = ?", [c.req.valid("param").id]);
  return c.json({ ok: true }, 200);
});

// ── Workout exercises (the builder) ────────────────────────────────

const addWorkoutExercise = createRoute({
  method: "post",
  path: "/api/workouts/{id}/exercises",
  request: {
    params: IdParam,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            exercise_id: z.string(),
            sets: z.number().int().optional(),
            reps: z.string().optional(),
            rest_seconds: z.number().int().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Workout with exercises", content: { "application/json": { schema: WorkoutSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(addWorkoutExercise, async (c) => {
  const id = c.req.valid("param").id;
  const b = c.req.valid("json");
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  if (!workout) return c.json({ error: "Workout not found" }, 404);
  const exercise = await get<any>("SELECT id FROM exercises WHERE id = ?", [b.exercise_id]);
  if (!exercise) return c.json({ error: "Exercise not found" }, 404);
  const maxPos =
    (await get<{ v: number }>("SELECT COALESCE(MAX(position), -1) v FROM workout_exercises WHERE workout_id = ?", [id]))
      ?.v ?? -1;
  await run(
    "INSERT INTO workout_exercises (id, workout_id, exercise_id, position, sets, reps, rest_seconds, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), id, b.exercise_id, maxPos + 1, b.sets ?? 3, b.reps || "10", b.rest_seconds ?? 60, b.notes || ""],
  );
  await run("UPDATE workouts SET updated_at = datetime('now') WHERE id = ?", [id]);
  workout.exercises = await loadWorkoutExercises(id);
  return c.json(workout, 200);
});

const updateWorkoutExercise = createRoute({
  method: "patch",
  path: "/api/workouts/{id}/exercises/{weId}",
  request: {
    params: z.object({ id: z.string(), weId: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sets: z.number().int().optional(),
            reps: z.string().optional(),
            rest_seconds: z.number().int().optional(),
            notes: z.string().optional(),
            position: z.number().int().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Workout with exercises", content: { "application/json": { schema: WorkoutSchema } } },
  },
});

app.openapi(updateWorkoutExercise, async (c) => {
  const { id, weId } = c.req.valid("param");
  const b = c.req.valid("json");
  const fields = ["sets", "reps", "rest_seconds", "notes", "position"] as const;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      params.push(b[f]);
    }
  }
  if (sets.length) {
    await run(`UPDATE workout_exercises SET ${sets.join(", ")} WHERE id = ? AND workout_id = ?`, [
      ...params,
      weId,
      id,
    ]);
    await run("UPDATE workouts SET updated_at = datetime('now') WHERE id = ?", [id]);
  }
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  workout.exercises = await loadWorkoutExercises(id);
  return c.json(workout, 200);
});

const reorderWorkoutExercises = createRoute({
  method: "put",
  path: "/api/workouts/{id}/exercises/order",
  request: {
    params: IdParam,
    body: {
      content: { "application/json": { schema: z.object({ order: z.array(z.string()) }) } },
    },
  },
  responses: {
    200: { description: "Workout with exercises", content: { "application/json": { schema: WorkoutSchema } } },
  },
});

app.openapi(reorderWorkoutExercises, async (c) => {
  const id = c.req.valid("param").id;
  const { order } = c.req.valid("json");
  for (let i = 0; i < order.length; i++) {
    await run("UPDATE workout_exercises SET position = ? WHERE id = ? AND workout_id = ?", [i, order[i], id]);
  }
  await run("UPDATE workouts SET updated_at = datetime('now') WHERE id = ?", [id]);
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  workout.exercises = await loadWorkoutExercises(id);
  return c.json(workout, 200);
});

const deleteWorkoutExercise = createRoute({
  method: "delete",
  path: "/api/workouts/{id}/exercises/{weId}",
  request: { params: z.object({ id: z.string(), weId: z.string() }) },
  responses: {
    200: { description: "Workout with exercises", content: { "application/json": { schema: WorkoutSchema } } },
  },
});

app.openapi(deleteWorkoutExercise, async (c) => {
  const { id, weId } = c.req.valid("param");
  await run("DELETE FROM workout_exercises WHERE id = ? AND workout_id = ?", [weId, id]);
  await run("UPDATE workouts SET updated_at = datetime('now') WHERE id = ?", [id]);
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  workout.exercises = await loadWorkoutExercises(id);
  return c.json(workout, 200);
});

// ── Sessions (schedule + assigned workouts) ────────────────────────

const listSessions = createRoute({
  method: "get",
  path: "/api/sessions",
  request: {
    query: z.object({
      date: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      client_id: z.string().optional(),
      status: z.string().optional(),
      session_type: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Sessions",
      content: { "application/json": { schema: z.object({ sessions: z.array(SessionSchema) }) } },
    },
  },
});

app.openapi(listSessions, async (c) => {
  const q = c.req.valid("query");
  let where = "WHERE 1=1";
  const params: unknown[] = [];
  if (q.date) {
    where += " AND s.scheduled_date = ?";
    params.push(q.date);
  }
  if (q.from) {
    where += " AND s.scheduled_date >= ?";
    params.push(q.from);
  }
  if (q.to) {
    where += " AND s.scheduled_date <= ?";
    params.push(q.to);
  }
  if (q.client_id) {
    where += " AND s.client_id = ?";
    params.push(q.client_id);
  }
  if (q.status) {
    where += " AND s.status = ?";
    params.push(q.status);
  }
  if (q.session_type) {
    where += " AND s.session_type = ?";
    params.push(q.session_type);
  }
  const sessions = await query<any>(
    `SELECT s.*, cl.name AS client_name, w.name AS workout_name
       FROM sessions s
       LEFT JOIN clients cl ON cl.id = s.client_id
       LEFT JOIN workouts w ON w.id = s.workout_id
     ${where} ORDER BY s.scheduled_date DESC, s.start_time`,
    params,
  );
  return c.json({ sessions }, 200);
});

const createSession = createRoute({
  method: "post",
  path: "/api/sessions",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            client_id: z.string(),
            workout_id: z.string().nullable().optional(),
            title: z.string().optional(),
            session_type: z.string().optional(),
            scheduled_date: z.string().optional(),
            start_time: z.string().optional(),
            end_time: z.string().optional(),
            status: z.string().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Created", content: { "application/json": { schema: SessionSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(createSession, async (c) => {
  const b = c.req.valid("json");
  const client = await get<any>("SELECT id FROM clients WHERE id = ?", [b.client_id]);
  if (!client) return c.json({ error: "Client not found" }, 404);
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO sessions (id, client_id, workout_id, title, session_type, scheduled_date, start_time, end_time, status, notes)
     VALUES (?, ?, ?, ?, ?, COALESCE(?, date('now')), ?, ?, ?, ?)`,
    [
      id,
      b.client_id,
      b.workout_id ?? null,
      b.title || "",
      b.session_type || "session",
      b.scheduled_date || null,
      b.start_time || "",
      b.end_time || "",
      b.status || "scheduled",
      b.notes || "",
    ],
  );
  const session = await get<any>("SELECT * FROM sessions WHERE id = ?", [id]);
  return c.json(session, 200);
});

const updateSession = createRoute({
  method: "patch",
  path: "/api/sessions/{id}",
  request: {
    params: IdParam,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            workout_id: z.string().nullable().optional(),
            title: z.string().optional(),
            session_type: z.string().optional(),
            scheduled_date: z.string().optional(),
            start_time: z.string().optional(),
            end_time: z.string().optional(),
            status: z.string().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: SessionSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(updateSession, async (c) => {
  const id = c.req.valid("param").id;
  const b = c.req.valid("json");
  const existing = await get<any>("SELECT * FROM sessions WHERE id = ?", [id]);
  if (!existing) return c.json({ error: "Session not found" }, 404);
  const fields = [
    "workout_id",
    "title",
    "session_type",
    "scheduled_date",
    "start_time",
    "end_time",
    "status",
    "notes",
  ] as const;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      params.push(b[f]);
    }
  }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    await run(`UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  }
  const session = await get<any>("SELECT * FROM sessions WHERE id = ?", [id]);
  return c.json(session, 200);
});

const deleteSession = createRoute({
  method: "delete",
  path: "/api/sessions/{id}",
  request: { params: IdParam },
  responses: { 200: { description: "Deleted", ...jsonOk } },
});

app.openapi(deleteSession, async (c) => {
  await run("DELETE FROM sessions WHERE id = ?", [c.req.valid("param").id]);
  return c.json({ ok: true }, 200);
});

// ── Payments ───────────────────────────────────────────────────────

const listPayments = createRoute({
  method: "get",
  path: "/api/payments",
  request: { query: z.object({ client_id: z.string().optional(), status: z.string().optional() }) },
  responses: {
    200: {
      description: "Payments",
      content: {
        "application/json": {
          schema: z.object({ payments: z.array(PaymentSchema), total_paid: z.number(), total_pending: z.number() }),
        },
      },
    },
  },
});

app.openapi(listPayments, async (c) => {
  const q = c.req.valid("query");
  let where = "WHERE 1=1";
  const params: unknown[] = [];
  if (q.client_id) {
    where += " AND p.client_id = ?";
    params.push(q.client_id);
  }
  if (q.status) {
    where += " AND p.status = ?";
    params.push(q.status);
  }
  const payments = await query<any>(
    `SELECT p.*, cl.name AS client_name FROM payments p
       LEFT JOIN clients cl ON cl.id = p.client_id
     ${where} ORDER BY p.paid_date DESC, p.id DESC`,
    params,
  );
  const total_paid =
    (await get<{ v: number }>(`SELECT COALESCE(SUM(amount),0) v FROM payments p ${where} AND p.status = 'paid'`, params))
      ?.v || 0;
  const total_pending =
    (await get<{ v: number }>(
      `SELECT COALESCE(SUM(amount),0) v FROM payments p ${where} AND p.status = 'pending'`,
      params,
    ))?.v || 0;
  return c.json({ payments, total_paid, total_pending }, 200);
});

const createPayment = createRoute({
  method: "post",
  path: "/api/payments",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            client_id: z.string(),
            amount: z.number(),
            description: z.string().optional(),
            method: z.string().optional(),
            status: z.string().optional(),
            paid_date: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Created", content: { "application/json": { schema: PaymentSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(createPayment, async (c) => {
  const b = c.req.valid("json");
  const client = await get<any>("SELECT id FROM clients WHERE id = ?", [b.client_id]);
  if (!client) return c.json({ error: "Client not found" }, 404);
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO payments (id, client_id, amount, description, method, status, paid_date)
     VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, date('now')))`,
    [id, b.client_id, b.amount, b.description || "", b.method || "", b.status || "paid", b.paid_date || null],
  );
  const payment = await get<any>("SELECT * FROM payments WHERE id = ?", [id]);
  return c.json(payment, 200);
});

const updatePayment = createRoute({
  method: "patch",
  path: "/api/payments/{id}",
  request: {
    params: IdParam,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            amount: z.number().optional(),
            description: z.string().optional(),
            method: z.string().optional(),
            status: z.string().optional(),
            paid_date: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: PaymentSchema } } },
    404: { description: "Not found", ...jsonErr },
  },
});

app.openapi(updatePayment, async (c) => {
  const id = c.req.valid("param").id;
  const b = c.req.valid("json");
  const existing = await get<any>("SELECT * FROM payments WHERE id = ?", [id]);
  if (!existing) return c.json({ error: "Payment not found" }, 404);
  const fields = ["amount", "description", "method", "status", "paid_date"] as const;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      params.push(b[f]);
    }
  }
  if (sets.length) await run(`UPDATE payments SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  const payment = await get<any>("SELECT * FROM payments WHERE id = ?", [id]);
  return c.json(payment, 200);
});

const deletePayment = createRoute({
  method: "delete",
  path: "/api/payments/{id}",
  request: { params: IdParam },
  responses: { 200: { description: "Deleted", ...jsonOk } },
});

app.openapi(deletePayment, async (c) => {
  await run("DELETE FROM payments WHERE id = ?", [c.req.valid("param").id]);
  return c.json({ ok: true }, 200);
});

// ── Workout sharing (trainer mints/revokes; public read-only view + PDF) ──

// Mint (or return the existing) public share token for a workout. Trainer-only.
app.post("/api/workouts/:id/share", async (c) => {
  const id = c.req.param("id");
  const workout = await get<any>("SELECT * FROM workouts WHERE id = ?", [id]);
  if (!workout) return c.json({ error: "Workout not found" }, 404);
  let token: string = workout.share_token;
  if (!token) {
    token = crypto.randomUUID();
    await run("UPDATE workouts SET share_token = ?, updated_at = datetime('now') WHERE id = ?", [token, id]);
  }
  return c.json({ share_token: token }, 200);
});

// Revoke the share link. Trainer-only.
app.delete("/api/workouts/:id/share", async (c) => {
  await run("UPDATE workouts SET share_token = '', updated_at = datetime('now') WHERE id = ?", [c.req.param("id")]);
  return c.json({ ok: true }, 200);
});

// Public read-only workout view (declared in clawnify.json api.public_routes → no
// perimeter auth). `?format=pdf` renders the same HTML via the Clawnify PDF service.
app.get("/api/share/:token", async (c) => {
  const token = c.req.param("token");
  const workout = await get<any>(
    "SELECT * FROM workouts WHERE share_token = ? AND share_token != ''",
    [token],
  );
  if (!workout) return c.text("This workout link is no longer available.", 404);
  const exercises = await loadWorkoutExercises(workout.id);
  const html = renderShareHtml(workout, exercises);

  if (c.req.query("format") === "pdf") {
    if (!c.env.CLAWNIFY_TOKEN) return c.text("PDF export is available on the deployed app.", 501);
    const r = await fetch("https://services.clawnify.com/pdf/render", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${c.env.CLAWNIFY_TOKEN}` },
      body: JSON.stringify({ html, format: "A4" }),
    });
    if (!r.ok) return c.text("Could not generate the PDF right now.", 502);
    return new Response(r.body, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${slugify(workout.name)}.pdf"`,
      },
    });
  }
  return c.html(html);
});

// ── OpenAPI doc + agent contract ───────────────────────────────────

app.doc("/api/openapi.json", {
  openapi: "3.0.0",
  info: { version: "1.0.0", title: "open-trainer API", description: "Personal training & coaching platform API" },
});

export default app;
