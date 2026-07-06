import { useState } from "preact/hooks";
import { useApp } from "../context";
import type { Session } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Radix Select forbids an empty-string item value, so use a sentinel for the
// optional "None" workout option and map it back to null.
const NONE = "__none";

export function CreateSession({
  onClose,
  presetClientId,
  session,
}: {
  onClose: () => void;
  presetClientId?: string;
  session?: Session;
}) {
  const { clients, workouts, addSession, updateSession, setError } = useApp();

  const [clientId, setClientId] = useState(
    session ? String(session.client_id) : presetClientId ? String(presetClientId) : ""
  );
  const [sessionType, setSessionType] = useState(session?.session_type || "session");
  const [workoutId, setWorkoutId] = useState(
    session?.workout_id != null ? String(session.workout_id) : NONE
  );
  const [title, setTitle] = useState(session?.title || "");
  const [scheduledDate, setScheduledDate] = useState(
    session?.scheduled_date || new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState(session?.start_time || "");
  const [endTime, setEndTime] = useState(session?.end_time || "");
  const [status, setStatus] = useState(session?.status || "scheduled");
  const [notes, setNotes] = useState(session?.notes || "");
  const [saving, setSaving] = useState(false);

  const lockClient = !!presetClientId && !session;

  const handleSubmit = async () => {
    if (!clientId) { setError("Please select a client"); return; }
    setSaving(true);
    try {
      const data = {
        client_id: clientId,
        session_type: sessionType,
        workout_id: workoutId === NONE ? null : workoutId,
        title: title.trim(),
        scheduled_date: scheduledDate,
        start_time: startTime,
        end_time: endTime,
        status,
        notes,
      };
      if (session) {
        await updateSession(session.id, data);
      } else {
        await addSession(data);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? "Edit Session" : "Schedule Session"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!lockClient && (
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client…" />
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
              <Label>Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Session</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                  <SelectItem value="consult">Consult</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Workout</Label>
            <Select value={workoutId} onValueChange={setWorkoutId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {workouts.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
              placeholder="e.g. Full Body Strength A"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate((e.target as HTMLInputElement).value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime((e.target as HTMLInputElement).value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
              placeholder="Focus areas, cues, adjustments…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving…" : session ? "Save Changes" : "Schedule Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
