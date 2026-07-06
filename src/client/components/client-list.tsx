import { useState } from "preact/hooks";
import { useApp } from "../context";
import { Plus, Search } from "lucide-preact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { Pagination } from "./pagination";
import { CreateClient } from "./create-client";

// Radix Select forbids an empty-string item value, so use a sentinel for "All"
// and map it back to "" — the filter value stays "" as the API expects.
const ALL = "all";

export function ClientList() {
  const {
    clients, clientsPag, setClientsPage,
    clientsSearch, setClientsSearch,
    clientsStatusFilter, setClientsStatusFilter,
    navigate,
  } = useApp();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Clients</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Client
        </Button>
      </div>

      {showCreate && <CreateClient onClose={() => setShowCreate(false)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search clients…"
            value={clientsSearch}
            onInput={(e) => setClientsSearch((e.target as HTMLInputElement).value)}
          />
        </div>
        <Select
          value={clientsStatusFilter || ALL}
          onValueChange={(v) => setClientsStatusFilter(v === ALL ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24 text-right">Sessions</TableHead>
                <TableHead className="w-24 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No clients found</TableCell>
                </TableRow>
              )}
              {clients.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/clients/${c.id}`)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="max-w-[16rem] truncate text-muted-foreground">{c.goal || "—"}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">{c.session_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {c.balance_due && c.balance_due > 0 ? (
                      <span className="font-medium tabular-nums text-amber-600">${c.balance_due.toFixed(0)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination pag={clientsPag} setPage={setClientsPage} />
    </div>
  );
}
