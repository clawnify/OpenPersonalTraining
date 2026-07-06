import { useEffect } from "preact/hooks";
import { useMemo } from "preact/hooks";
import { AppContext } from "./context";
import { useAppState } from "./hooks/use-app";
import { useRouter } from "./hooks/use-router";
import { Sidebar } from "./components/sidebar";
import { Dashboard } from "./components/dashboard";
import { ClientList } from "./components/client-list";
import { ClientDetail } from "./components/client-detail";
import { ExerciseLibrary } from "./components/exercise-library";
import { WorkoutList } from "./components/workout-list";
import { WorkoutBuilder } from "./components/workout-builder";
import { Schedule } from "./components/schedule";
import { PaymentList } from "./components/payment-list";
import { ErrorBanner } from "./components/error-banner";

export function App() {
  const isAgent = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("agent") || params.get("mode") === "agent";
  }, []);

  useEffect(() => {
    if (isAgent) document.documentElement.setAttribute("data-agent", "");
  }, [isAgent]);

  const { view, id, navigate } = useRouter();
  const appState = useAppState(isAgent, navigate);
  const { selectClient, selectWorkout } = appState;

  useEffect(() => {
    if (view === "clients" && id) selectClient(id);
    else if (view !== "clients") selectClient(null);
  }, [view, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view === "workouts" && id) selectWorkout(id);
    else if (view !== "workouts") selectWorkout(null);
  }, [view, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderMain = () => {
    if (view === "clients" && id) return <ClientDetail />;
    if (view === "workouts" && id) return <WorkoutBuilder />;
    switch (view) {
      case "clients": return <ClientList />;
      case "exercises": return <ExerciseLibrary />;
      case "workouts": return <WorkoutList />;
      case "schedule": return <Schedule />;
      case "payments": return <PaymentList />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={appState}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar currentView={view} />
        <main className="flex-1 overflow-y-auto bg-background">
          {appState.loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>
          ) : (
            renderMain()
          )}
        </main>
      </div>
      <ErrorBanner />
    </AppContext.Provider>
  );
}
