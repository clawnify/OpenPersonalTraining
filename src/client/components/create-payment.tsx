import { useState } from "preact/hooks";
import { useApp } from "../context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Payment } from "../types";

// Radix Select forbids an empty-string item value, so use a sentinel for the
// unset "Method" option and map it back to "" when saving.
const NO_METHOD = "__none";

function today() {
  return new Date().toISOString().split("T")[0];
}

export function CreatePayment({
  onClose,
  presetClientId,
  payment,
}: {
  onClose: () => void;
  presetClientId?: string;
  payment?: Payment;
}) {
  const { clients, addPayment, updatePayment, setError } = useApp();

  const initialClientId = payment?.client_id ?? presetClientId;
  const lockClient = !payment && presetClientId != null;

  const [clientId, setClientId] = useState<string>(initialClientId != null ? String(initialClientId) : "");
  const [amount, setAmount] = useState<string>(payment ? String(payment.amount) : "");
  const [description, setDescription] = useState(payment?.description ?? "");
  const [method, setMethod] = useState(payment?.method || NO_METHOD);
  const [status, setStatus] = useState(payment?.status || "paid");
  const [paidDate, setPaidDate] = useState(payment?.paid_date || today());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!clientId) { setError("Select a client"); return; }
    const amt = Number(amount);
    if (!(amt > 0)) { setError("Amount must be greater than 0"); return; }

    const data = {
      amount: amt,
      description: description.trim(),
      method: method === NO_METHOD ? "" : method,
      status,
      paid_date: paidDate,
    };

    setSaving(true);
    try {
      if (payment) {
        await updatePayment(payment.id, data);
      } else {
        await addPayment({ client_id: clientId, ...data });
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Log Payment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!lockClient && (
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Paid date</Label>
              <Input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
              placeholder="e.g. 8-session pack, Monthly coaching"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_METHOD}>—</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving..." : payment ? "Save Changes" : "Log Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
