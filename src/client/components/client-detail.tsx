import { useState } from "preact/hooks";
import { useApp } from "../context";
import { ArrowLeft, Trash2, Mail, Phone, Plus } from "lucide-preact";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { StatusBadge } from "./status-badge";
import { CreateClient } from "./create-client";
import { CreateSession } from "./create-session";
import { CreatePayment } from "./create-payment";

const TYPE_LABEL: Record<string, string> = {
  session: "Session",
  program: "Program",
  consult: "Consult",
  assessment: "Assessment",
};

export function ClientDetail() {
  const { selectedClient, selectedClientSessions, selectedClientPayments, navigate, deleteClient } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  if (!selectedClient) {
    return <div className="flex h-full items-center justify-center p-6 text-muted-foreground">Loading…</div>;
  }

  const client = selectedClient;

  const handleDelete = () => {
    if (confirm(`Delete ${client.name}? This can't be undone.`)) {
      deleteClient(client.id);
      navigate("/clients");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {showEdit && <CreateClient client={client} onClose={() => setShowEdit(false)} />}
      {showSession && <CreateSession presetClientId={client.id} onClose={() => setShowSession(false)} />}
      {showPayment && <CreatePayment presetClientId={client.id} onClose={() => setShowPayment(false)} />}

      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/clients")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <StatusBadge status={client.status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="eyebrow mb-2">Goal</p>
            <div className="text-lg font-medium">{client.goal || "—"}</div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {client.email && (
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {client.phone}
              </span>
            )}
          </div>
          {client.notes && (
            <div>
              <p className="eyebrow mb-2">Notes</p>
              <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <p className="eyebrow">Sessions</p>
            <Button variant="outline" size="sm" onClick={() => setShowSession(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Schedule
            </Button>
          </CardHeader>
          <CardContent>
            {selectedClientSessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No sessions yet</p>
            ) : (
              <div className="divide-y">
                {selectedClientSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{s.workout_name || s.title || "—"}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{s.scheduled_date} · {s.start_time && s.end_time ? `${s.start_time}–${s.end_time}` : "—"}</span>
                        <Chip className="capitalize">{TYPE_LABEL[s.session_type] || s.session_type}</Chip>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <p className="eyebrow">Payments</p>
            <Button variant="outline" size="sm" onClick={() => setShowPayment(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Log payment
            </Button>
          </CardHeader>
          <CardContent>
            {selectedClientPayments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <div className="divide-y">
                {selectedClientPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium tabular-nums">${p.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.paid_date} · {p.description || "—"}{p.method ? ` · ${p.method}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
