import { useApp } from "../context";
import { CalendarDays, Users, Dumbbell, DollarSign, ClipboardList, Clock } from "lucide-preact";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Chip } from "@/components/ui/chip";

const TYPE_LABEL: Record<string, string> = {
  session: "Session",
  program: "Program",
  consult: "Consult",
  assessment: "Assessment",
};

export function Dashboard() {
  const { stats, navigate, sessions } = useApp();

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions
    .filter((s) => s.scheduled_date === todayStr && s.status === "scheduled")
    .sort((a, b) => (a.start_time || "99").localeCompare(b.start_time || "99"));

  const statCards = [
    { label: "Sessions Today", value: stats.sessions_today, icon: CalendarDays, color: "text-violet-600 bg-violet-50", onClick: () => navigate("/schedule") },
    { label: "Upcoming", value: stats.upcoming_sessions, icon: Clock, color: "text-blue-600 bg-blue-50", onClick: () => navigate("/schedule") },
    { label: "Active Clients", value: stats.active_clients, icon: Users, color: "text-emerald-600 bg-emerald-50", onClick: () => navigate("/clients") },
    { label: "Workouts", value: stats.workouts, icon: ClipboardList, color: "text-sky-600 bg-sky-50", onClick: () => navigate("/workouts") },
    { label: "Exercises", value: stats.exercises, icon: Dumbbell, color: "text-rose-600 bg-rose-50", onClick: () => navigate("/exercises") },
    { label: "Revenue", value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, color: "text-amber-600 bg-amber-50", onClick: () => navigate("/payments") },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={stat.onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}
            onClick={stat.onClick}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <p className="eyebrow">TODAY'S SCHEDULE</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/schedule")}>View Schedule</Button>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing scheduled for today</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Time</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Workout</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaySessions.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/clients/${s.client_id}`)}>
                    <TableCell className="font-medium">{s.start_time || "—"}</TableCell>
                    <TableCell>{s.client_name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.workout_name || s.title || "—"}</TableCell>
                    <TableCell>
                      <Chip>{TYPE_LABEL[s.session_type] || s.session_type}</Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
