import { useState, useCallback, useEffect } from "preact/hooks";
import { api } from "../api";
import type {
  Client, Exercise, ExerciseFacets, Workout, Session, Payment, Stats, PaginatedState,
} from "../types";
import type { AppContextValue } from "../context";

const EMPTY_STATS: Stats = {
  clients: 0, active_clients: 0, workouts: 0, exercises: 0,
  sessions_today: 0, upcoming_sessions: 0, completed_sessions: 0, revenue: 0, outstanding: 0,
};

export function useAppState(isAgent: boolean, navigate: (to: string) => void): AppContextValue {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsPag, setClientsPag] = useState<PaginatedState>({ page: 1, limit: 50, total: 0 });
  const [clientsSearch, setClientsSearch] = useState("");
  const [clientsStatusFilter, setClientsStatusFilter] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientSessions, setSelectedClientSessions] = useState<Session[]>([]);
  const [selectedClientPayments, setSelectedClientPayments] = useState<Payment[]>([]);

  // Exercises
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesPag, setExercisesPag] = useState<PaginatedState>({ page: 1, limit: 30, total: 0 });
  const [exercisesSearch, setExercisesSearch] = useState("");
  const [exerciseFilters, setExerciseFilters] = useState({ body_part: "", target: "", equipment: "" });
  const [facets, setFacets] = useState<ExerciseFacets>({ body_parts: [], targets: [], equipment: [] });

  // Workouts
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsSearch, setWorkoutsSearch] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsDateFilter, setSessionsDateFilter] = useState("");
  const [sessionsStatusFilter, setSessionsStatusFilter] = useState("");
  const [sessionsTypeFilter, setSessionsTypeFilter] = useState("");

  // Payments
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsTotals, setPaymentsTotals] = useState({ total_paid: 0, total_pending: 0 });
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState("");

  // ── Fetchers ──

  const fetchStats = useCallback(async () => {
    setStats(await api<Stats>("GET", "/api/stats"));
  }, []);

  const fetchClients = useCallback(async (pag: PaginatedState, search: string, status: string) => {
    const params = new URLSearchParams({ page: String(pag.page), limit: String(pag.limit) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const data = await api<{ clients: Client[]; total: number }>("GET", `/api/clients?${params}`);
    setClients(data.clients);
    setClientsPag((prev) => ({ ...prev, total: data.total }));
  }, []);

  const fetchExercises = useCallback(
    async (pag: PaginatedState, search: string, filters: typeof exerciseFilters) => {
      const params = new URLSearchParams({ page: String(pag.page), limit: String(pag.limit) });
      if (search) params.set("search", search);
      if (filters.body_part) params.set("body_part", filters.body_part);
      if (filters.target) params.set("target", filters.target);
      if (filters.equipment) params.set("equipment", filters.equipment);
      const data = await api<{ exercises: Exercise[]; total: number }>("GET", `/api/exercises?${params}`);
      setExercises(data.exercises);
      setExercisesPag((prev) => ({ ...prev, total: data.total }));
    },
    [],
  );

  const fetchFacets = useCallback(async () => {
    setFacets(await api<ExerciseFacets>("GET", "/api/exercises/facets"));
  }, []);

  const fetchWorkouts = useCallback(async (search: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const data = await api<{ workouts: Workout[] }>("GET", `/api/workouts?${params}`);
    setWorkouts(data.workouts);
  }, []);

  const fetchSessions = useCallback(async (date: string, status: string, type: string) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    if (type) params.set("session_type", type);
    const data = await api<{ sessions: Session[] }>("GET", `/api/sessions?${params}`);
    setSessions(data.sessions);
  }, []);

  const fetchPayments = useCallback(async (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const data = await api<{ payments: Payment[]; total_paid: number; total_pending: number }>(
      "GET",
      `/api/payments?${params}`,
    );
    setPayments(data.payments);
    setPaymentsTotals({ total_paid: data.total_paid, total_pending: data.total_pending });
  }, []);

  // ── Initial load ──

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStats(),
          fetchClients(clientsPag, "", ""),
          fetchExercises(exercisesPag, "", exerciseFilters),
          fetchFacets(),
          fetchWorkouts(""),
          fetchSessions("", "", ""),
          fetchPayments(""),
        ]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchClients(clientsPag, clientsSearch, clientsStatusFilter).catch((e) => setError((e as Error).message));
  }, [clientsPag.page, clientsSearch, clientsStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchExercises(exercisesPag, exercisesSearch, exerciseFilters).catch((e) => setError((e as Error).message));
  }, [exercisesPag.page, exercisesSearch, exerciseFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchWorkouts(workoutsSearch).catch((e) => setError((e as Error).message));
  }, [workoutsSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSessions(sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter).catch((e) =>
      setError((e as Error).message),
    );
  }, [sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPayments(paymentsStatusFilter).catch((e) => setError((e as Error).message));
  }, [paymentsStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clients CRUD ──

  const setClientsPage = useCallback((page: number) => setClientsPag((p) => ({ ...p, page })), []);

  const refreshSelectedClient = useCallback(async (id: string) => {
    const res = await api<{ client: Client; sessions: Session[]; payments: Payment[] }>("GET", `/api/clients/${id}`);
    setSelectedClient(res.client);
    setSelectedClientSessions(res.sessions);
    setSelectedClientPayments(res.payments);
  }, []);

  const addClient = useCallback(async (data: Partial<Client>) => {
    await api("POST", "/api/clients", data);
    await Promise.all([fetchClients(clientsPag, clientsSearch, clientsStatusFilter), fetchStats()]);
  }, [clientsPag, clientsSearch, clientsStatusFilter, fetchClients, fetchStats]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    await api("PATCH", `/api/clients/${id}`, data);
    await fetchClients(clientsPag, clientsSearch, clientsStatusFilter);
    await fetchStats();
    if (selectedClient?.id === id) await refreshSelectedClient(id);
  }, [clientsPag, clientsSearch, clientsStatusFilter, selectedClient, fetchClients, fetchStats, refreshSelectedClient]);

  const deleteClient = useCallback(async (id: string) => {
    await api("DELETE", `/api/clients/${id}`);
    if (selectedClient?.id === id) { setSelectedClient(null); navigate("/clients"); }
    await Promise.all([fetchClients(clientsPag, clientsSearch, clientsStatusFilter), fetchStats()]);
  }, [clientsPag, clientsSearch, clientsStatusFilter, selectedClient, navigate, fetchClients, fetchStats]);

  const selectClient = useCallback(async (id: string | null) => {
    if (id === null) { setSelectedClient(null); setSelectedClientSessions([]); setSelectedClientPayments([]); return; }
    await refreshSelectedClient(id);
  }, [refreshSelectedClient]);

  // ── Exercises ──

  const setExercisesPage = useCallback((page: number) => setExercisesPag((p) => ({ ...p, page })), []);
  const setExerciseFilter = useCallback((key: "body_part" | "target" | "equipment", value: string) => {
    setExercisesPag((p) => ({ ...p, page: 1 }));
    setExerciseFilters((f) => ({ ...f, [key]: value }));
  }, []);

  // ── Workouts CRUD ──

  const addWorkout = useCallback(async (data: Partial<Workout>) => {
    const workout = await api<Workout>("POST", "/api/workouts", data);
    await Promise.all([fetchWorkouts(workoutsSearch), fetchStats()]);
    return workout;
  }, [workoutsSearch, fetchWorkouts, fetchStats]);

  const updateWorkout = useCallback(async (id: string, data: Partial<Workout>) => {
    const workout = await api<Workout>("PATCH", `/api/workouts/${id}`, data);
    await fetchWorkouts(workoutsSearch);
    if (selectedWorkout?.id === id) setSelectedWorkout(workout);
  }, [workoutsSearch, selectedWorkout, fetchWorkouts]);

  const deleteWorkout = useCallback(async (id: string) => {
    await api("DELETE", `/api/workouts/${id}`);
    if (selectedWorkout?.id === id) { setSelectedWorkout(null); navigate("/workouts"); }
    await Promise.all([fetchWorkouts(workoutsSearch), fetchStats()]);
  }, [workoutsSearch, selectedWorkout, navigate, fetchWorkouts, fetchStats]);

  const selectWorkout = useCallback(async (id: string | null) => {
    if (id === null) { setSelectedWorkout(null); return; }
    setSelectedWorkout(await api<Workout>("GET", `/api/workouts/${id}`));
  }, []);

  const addWorkoutExercise = useCallback(
    async (workoutId: string, data: { exercise_id: string; sets?: number; reps?: string; rest_seconds?: number; notes?: string }) => {
      const workout = await api<Workout>("POST", `/api/workouts/${workoutId}/exercises`, data);
      setSelectedWorkout(workout);
      await fetchWorkouts(workoutsSearch);
    },
    [workoutsSearch, fetchWorkouts],
  );

  const updateWorkoutExercise = useCallback(
    async (workoutId: string, weId: string, data: Partial<{ sets: number; reps: string; rest_seconds: number; notes: string }>) => {
      const workout = await api<Workout>("PATCH", `/api/workouts/${workoutId}/exercises/${weId}`, data);
      setSelectedWorkout(workout);
    },
    [],
  );

  const deleteWorkoutExercise = useCallback(async (workoutId: string, weId: string) => {
    const workout = await api<Workout>("DELETE", `/api/workouts/${workoutId}/exercises/${weId}`);
    setSelectedWorkout(workout);
    await fetchWorkouts(workoutsSearch);
  }, [workoutsSearch, fetchWorkouts]);

  const reorderWorkoutExercises = useCallback(async (workoutId: string, order: string[]) => {
    const workout = await api<Workout>("PUT", `/api/workouts/${workoutId}/exercises/order`, { order });
    setSelectedWorkout(workout);
  }, []);

  const shareWorkout = useCallback(async (id: string) => {
    const { share_token } = await api<{ share_token: string }>("POST", `/api/workouts/${id}/share`);
    setSelectedWorkout((prev) => (prev && prev.id === id ? { ...prev, share_token } : prev));
    return share_token;
  }, []);

  const unshareWorkout = useCallback(async (id: string) => {
    await api("DELETE", `/api/workouts/${id}/share`);
    setSelectedWorkout((prev) => (prev && prev.id === id ? { ...prev, share_token: "" } : prev));
  }, []);

  // ── Sessions CRUD ──

  const addSession = useCallback(async (data: Partial<Session>) => {
    await api("POST", "/api/sessions", data);
    await Promise.all([
      fetchSessions(sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter),
      fetchStats(),
    ]);
    if (selectedClient && data.client_id === selectedClient.id) await refreshSelectedClient(selectedClient.id);
  }, [sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter, selectedClient, fetchSessions, fetchStats, refreshSelectedClient]);

  const updateSession = useCallback(async (id: string, data: Partial<Session>) => {
    await api("PATCH", `/api/sessions/${id}`, data);
    await Promise.all([
      fetchSessions(sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter),
      fetchStats(),
    ]);
    if (selectedClient) await refreshSelectedClient(selectedClient.id);
  }, [sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter, selectedClient, fetchSessions, fetchStats, refreshSelectedClient]);

  const deleteSession = useCallback(async (id: string) => {
    await api("DELETE", `/api/sessions/${id}`);
    await Promise.all([
      fetchSessions(sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter),
      fetchStats(),
    ]);
    if (selectedClient) await refreshSelectedClient(selectedClient.id);
  }, [sessionsDateFilter, sessionsStatusFilter, sessionsTypeFilter, selectedClient, fetchSessions, fetchStats, refreshSelectedClient]);

  // ── Payments CRUD ──

  const addPayment = useCallback(async (data: Partial<Payment>) => {
    await api("POST", "/api/payments", data);
    await Promise.all([fetchPayments(paymentsStatusFilter), fetchStats()]);
    if (selectedClient && data.client_id === selectedClient.id) await refreshSelectedClient(selectedClient.id);
  }, [paymentsStatusFilter, selectedClient, fetchPayments, fetchStats, refreshSelectedClient]);

  const updatePayment = useCallback(async (id: string, data: Partial<Payment>) => {
    await api("PATCH", `/api/payments/${id}`, data);
    await Promise.all([fetchPayments(paymentsStatusFilter), fetchStats()]);
    if (selectedClient) await refreshSelectedClient(selectedClient.id);
  }, [paymentsStatusFilter, selectedClient, fetchPayments, fetchStats, refreshSelectedClient]);

  const deletePayment = useCallback(async (id: string) => {
    await api("DELETE", `/api/payments/${id}`);
    await Promise.all([fetchPayments(paymentsStatusFilter), fetchStats()]);
    if (selectedClient) await refreshSelectedClient(selectedClient.id);
  }, [paymentsStatusFilter, selectedClient, fetchPayments, fetchStats, refreshSelectedClient]);

  return {
    navigate, isAgent, stats, refreshStats: fetchStats,
    clients, clientsPag, setClientsPage, clientsSearch, setClientsSearch,
    clientsStatusFilter, setClientsStatusFilter,
    addClient, updateClient, deleteClient,
    selectedClient, selectedClientSessions, selectedClientPayments, selectClient,
    exercises, exercisesPag, setExercisesPage, exercisesSearch, setExercisesSearch,
    exerciseFilters, setExerciseFilter, facets,
    workouts, workoutsSearch, setWorkoutsSearch,
    addWorkout, updateWorkout, deleteWorkout,
    selectedWorkout, selectWorkout,
    addWorkoutExercise, updateWorkoutExercise, deleteWorkoutExercise, reorderWorkoutExercises,
    shareWorkout, unshareWorkout,
    sessions, sessionsDateFilter, setSessionsDateFilter,
    sessionsStatusFilter, setSessionsStatusFilter, sessionsTypeFilter, setSessionsTypeFilter,
    addSession, updateSession, deleteSession,
    payments, paymentsTotals, paymentsStatusFilter, setPaymentsStatusFilter,
    addPayment, updatePayment, deletePayment,
    loading, error, setError,
  };
}
