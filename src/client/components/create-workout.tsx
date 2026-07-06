import { useState } from "preact/hooks";
import { useApp } from "../context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function CreateWorkout({ onClose }: { onClose: () => void }) {
  const { addWorkout, navigate, setError } = useApp();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      const w = await addWorkout({ name: name.trim(), category: category.trim(), description });
      onClose();
      navigate("/workouts/" + w.id);
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
          <DialogTitle>New Workout</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="e.g. Upper Body Push" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory((e.target as HTMLInputElement).value)} placeholder="Strength, Hypertrophy, HIIT, Mobility…" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} placeholder="What this workout is for, cues, etc." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={handleSubmit}>{saving ? "Saving..." : "Create Workout"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
