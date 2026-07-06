export type View = "dashboard" | "clients" | "exercises" | "workouts" | "schedule" | "payments";

export type ClientStatus = "active" | "inactive";
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type SessionType = "session" | "program" | "consult" | "assessment";
export type PaymentStatus = "paid" | "pending";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  goal: string;
  status: ClientStatus | string;
  notes: string;
  session_count?: number;
  balance_due?: number;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  source_id: string;
  name: string;
  body_part: string;
  target: string;
  equipment: string;
  secondary_muscles: string[];
  instructions: string;
  image: string;
}

export interface ExerciseFacets {
  body_parts: string[];
  targets: string[];
  equipment: string[];
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
  name?: string;
  body_part?: string;
  target?: string;
  equipment?: string;
  image?: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  category: string;
  notes: string;
  share_token?: string;
  exercise_count?: number;
  exercises?: WorkoutExercise[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  client_id: string;
  workout_id: string | null;
  title: string;
  session_type: SessionType | string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: SessionStatus | string;
  notes: string;
  client_name?: string;
  workout_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  description: string;
  method: string;
  status: PaymentStatus | string;
  paid_date: string;
  client_name?: string;
  created_at: string;
}

export interface Stats {
  clients: number;
  active_clients: number;
  workouts: number;
  exercises: number;
  sessions_today: number;
  upcoming_sessions: number;
  completed_sessions: number;
  revenue: number;
  outstanding: number;
}

export interface PaginatedState {
  page: number;
  limit: number;
  total: number;
}
