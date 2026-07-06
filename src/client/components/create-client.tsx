import { useState } from "preact/hooks";
import { useApp } from "../context";
import type { Client } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CreateClient({ onClose, client }: { onClose: () => void; client?: Client }) {
  const { addClient, updateClient, setError } = useApp();
  const [name, setName] = useState(client?.name || "");
  const [email, setEmail] = useState(client?.email || "");
  const [phone, setPhone] = useState(client?.phone || "");
  const [goal, setGoal] = useState(client?.goal || "");
  const [status, setStatus] = useState(client?.status || "active");
  const [notes, setNotes] = useState(client?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      const data = { name: name.trim(), email, phone, goal, status, notes };
      if (client) {
        await updateClient(client.id, data);
      } else {
        await addClient(data);
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
          <DialogTitle>{client ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="555-0100" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Input value={goal} onChange={(e) => setGoal((e.target as HTMLInputElement).value)} placeholder="e.g. Lose 5kg, first pull-up" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} placeholder="Injuries, preferences, availability, etc." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={handleSubmit}>{saving ? "Saving..." : client ? "Save Changes" : "Add Client"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
