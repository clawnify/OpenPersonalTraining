import { useState } from "preact/hooks";
import { useApp } from "../context";
import type { Session } from "../types";
import { Plus, Pencil, Trash2 } from "lucide-preact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { CreateSession } from "./create-session";

// Radix Select forbids an empty-string item value, so use a sentinel for "All"
// and map it back to "" — the filter value stays "" as the API expects.
const ALL = "all";

const TYPE_LABEL: Record<string, string> = {
  session: "Session",
  program: "Program",
  consult: "Consult",
  assessment: "Assessment",
};

export function Schedule() {
  const {
    sessions,
    sessionsDateFilter, setSessionsDateFilter,
    sessionsStatusFilter, setSessionsStatusFilter,
    sessionsTypeFilter, setSessionsTypeFilter,
    deleteSession,
    navigate,
  } = useApp();

  const [showCreate, setShowCreate] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Schedule</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> New Session
        </Button>
      </div>

      {showCreate && <CreateSession onClose={() => setShowCreate(false)} />}
      {editSession && <CreateSession session={editSession} onClose={() => setEditSession(null)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-full sm:w-44"
            value={sessionsDateFilter}
            onChange={(e) => setSessionsDateFilter((e.target as HTMLInputElement).value)}
          />
          {sessionsDateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setSessionsDateFilter("")}>
              All dates
            </Button>
          )}
        </div>
        <Select
          value={sessionsStatusFilter || ALL}
          onValueChange={(v) => setSessionsStatusFilter(v === ALL ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sessionsTypeFilter || ALL}
          onValueChange={(v) => setSessionsTypeFilter(v === ALL ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            <SelectItem value="session">Session</SelectItem>
            <SelectItem value="program">Program</SelectItem>
            <SelectItem value="consult">Consult</SelectItem>
            <SelectItem value="assessment">Assessment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Date</TableHead>
                <TableHead className="w-28">Time</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Workout</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No sessions found
                  </TableCell>
                </TableRow>
              )}
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.scheduled_date}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.start_time ? `${s.start_time}${s.end_time ? `–${s.end_time}` : ""}` : "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-left font-medium hover:underline"
                      onClick={() => navigate(`/clients/${s.client_id}`)}
                    >
                      {s.client_name || "—"}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.workout_name || s.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip>{TYPE_LABEL[s.session_type] || s.session_type}</Chip>
                  </TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditSession(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this session?")) deleteSession(s.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
