import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type {
  Client, Exercise, ExerciseFacets, Workout, Session, Payment, Stats, PaginatedState,
} from "./types";

export interface AppContextValue {
  navigate: (to: string) => void;
  isAgent: boolean;
  stats: Stats;
  refreshStats: () => Promise<void>;

  // Clients
  clients: Client[];
  clientsPag: PaginatedState;
  setClientsPage: (page: number) => void;
  clientsSearch: string;
  setClientsSearch: (s: string) => void;
  clientsStatusFilter: string;
  setClientsStatusFilter: (s: string) => void;
  addClient: (data: Partial<Client>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectedClient: Client | null;
  selectedClientSessions: Session[];
  selectedClientPayments: Payment[];
  selectClient: (id: string | null) => Promise<void>;

  // Exercise library
  exercises: Exercise[];
  exercisesPag: PaginatedState;
  setExercisesPage: (page: number) => void;
  exercisesSearch: string;
  setExercisesSearch: (s: string) => void;
  exerciseFilters: { body_part: string; target: string; equipment: string };
  setExerciseFilter: (key: "body_part" | "target" | "equipment", value: string) => void;
  facets: ExerciseFacets;

  // Workouts
  workouts: Workout[];
  workoutsSearch: string;
  setWorkoutsSearch: (s: string) => void;
  addWorkout: (data: Partial<Workout>) => Promise<Workout>;
  updateWorkout: (id: string, data: Partial<Workout>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  selectedWorkout: Workout | null;
  selectWorkout: (id: string | null) => Promise<void>;
  addWorkoutExercise: (workoutId: string, data: { exercise_id: string; sets?: number; reps?: string; rest_seconds?: number; notes?: string }) => Promise<void>;
  updateWorkoutExercise: (workoutId: string, weId: string, data: Partial<{ sets: number; reps: string; rest_seconds: number; notes: string }>) => Promise<void>;
  deleteWorkoutExercise: (workoutId: string, weId: string) => Promise<void>;
  reorderWorkoutExercises: (workoutId: string, order: string[]) => Promise<void>;
  shareWorkout: (id: string) => Promise<string>;
  unshareWorkout: (id: string) => Promise<void>;

  // Sessions (schedule)
  sessions: Session[];
  sessionsDateFilter: string;
  setSessionsDateFilter: (s: string) => void;
  sessionsStatusFilter: string;
  setSessionsStatusFilter: (s: string) => void;
  sessionsTypeFilter: string;
  setSessionsTypeFilter: (s: string) => void;
  addSession: (data: Partial<Session>) => Promise<void>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Payments
  payments: Payment[];
  paymentsTotals: { total_paid: number; total_pending: number };
  paymentsStatusFilter: string;
  setPaymentsStatusFilter: (s: string) => void;
  addPayment: (data: Partial<Payment>) => Promise<void>;
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  loading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
}

export const AppContext = createContext<AppContextValue>(null!);

export function useApp() {
  return useContext(AppContext);
}
