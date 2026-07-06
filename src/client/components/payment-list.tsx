import { useState } from "preact/hooks";
import { useApp } from "../context";
import { Plus, Trash2, Pencil, Check } from "lucide-preact";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { CreatePayment } from "./create-payment";
import type { Payment } from "../types";

// Radix Select forbids an empty-string item value, so use a sentinel for "All"
// and map it back to "" — the filter value stays "" as the API expects.
const ALL = "all";

export function PaymentList() {
  const {
    payments, paymentsTotals,
    paymentsStatusFilter, setPaymentsStatusFilter,
    updatePayment, deletePayment, navigate,
  } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Payments</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Log Payment
        </Button>
      </div>

      {showCreate && <CreatePayment onClose={() => setShowCreate(false)} />}
      {editing && <CreatePayment payment={editing} onClose={() => setEditing(null)} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Collected</div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600">
              ${paymentsTotals.total_paid.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Outstanding</div>
            <div className="text-2xl font-bold tabular-nums text-amber-600">
              ${paymentsTotals.total_pending.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Select
          value={paymentsStatusFilter || ALL}
          onValueChange={(v) => setPaymentsStatusFilter(v === ALL ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Method</TableHead>
                <TableHead className="w-28 text-right">Amount</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No payments found</TableCell>
                </TableRow>
              )}
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{p.paid_date || "—"}</TableCell>
                  <TableCell>
                    <button
                      className="font-medium hover:underline"
                      onClick={() => navigate("/clients/" + p.client_id)}
                    >
                      {p.client_name || "—"}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-muted-foreground">{p.description || "—"}</TableCell>
                  <TableCell>{p.method ? <Chip className="capitalize">{p.method}</Chip> : "—"}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">${p.amount.toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {p.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-emerald-600"
                          onClick={() => updatePayment(p.id, { status: "paid" })}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Mark paid
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (confirm("Delete this payment?")) deletePayment(p.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {payments.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right text-muted-foreground">Total</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${payments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
