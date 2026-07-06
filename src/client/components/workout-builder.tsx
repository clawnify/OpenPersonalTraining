import { useState } from "preact/hooks";
import { useApp } from "../context";
import type { WorkoutExercise } from "../types";
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Check, Pencil,
  Share2, Copy, ExternalLink, FileDown, Link2Off,
} from "lucide-preact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Pagination } from "./pagination";
import { exerciseImageUrl } from "@/lib/exercise-image";

const ALL = "__all";

export function WorkoutBuilder() {
  const {
    selectedWorkout, updateWorkout, deleteWorkout,
    updateWorkoutExercise, deleteWorkoutExercise, reorderWorkoutExercises,
    shareWorkout, unshareWorkout, navigate,
  } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showShare, setShowShare] = useState(false);

  if (!selectedWorkout) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const workout = selectedWorkout;
  const exercises = workout.exercises ?? [];

  const move = (index: number, dir: -1 | 1) => {
    const ids = exercises.map((e) => e.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderWorkoutExercises(workout.id, ids);
  };

  const handleDelete = () => {
    if (!confirm(`Delete workout "${workout.name}"? This can't be undone.`)) return;
    deleteWorkout(workout.id);
    navigate("/workouts");
  };

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/workouts")}>
        <ArrowLeft className="h-4 w-4" /> Workouts
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{workout.name}</h1>
            {workout.category && (
              <Chip className="capitalize">{workout.category}</Chip>
            )}
          </div>
          {workout.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{workout.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="eyebrow">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </p>
        <Button onClick={() => setShowPicker(true)}>
          <Plus className="h-4 w-4" /> Add exercise
        </Button>
      </div>

      {exercises.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No exercises yet — add your first.</p>
          <Button className="mt-4" onClick={() => setShowPicker(true)}>
            <Plus className="h-4 w-4" /> Add exercise
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((we, i) => (
            <ExerciseRow
              key={we.id}
              we={we}
              index={i}
              isFirst={i === 0}
              isLast={i === exercises.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onRemove={() => deleteWorkoutExercise(workout.id, we.id)}
              onUpdate={(data) => updateWorkoutExercise(workout.id, we.id, data)}
            />
          ))}
        </div>
      )}

      {showEdit && (
        <EditWorkoutDialog
          initial={{ name: workout.name, category: workout.category, description: workout.description }}
          onSave={(data) => updateWorkout(workout.id, data)}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showPicker && (
        <ExercisePicker
          workoutId={workout.id}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showShare && (
        <ShareDialog
          token={workout.share_token || ""}
          onShare={() => shareWorkout(workout.id)}
          onUnshare={() => unshareWorkout(workout.id)}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

interface ExerciseRowProps {
  we: WorkoutExercise;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdate: (data: Partial<{ sets: number; reps: string; rest_seconds: number; notes: string }>) => void;
}

function ExerciseRow({ we, index, isFirst, isLast, onMoveUp, onMoveDown, onRemove, onUpdate }: ExerciseRowProps) {
  const [sets, setSets] = useState(String(we.sets ?? ""));
  const [reps, setReps] = useState(we.reps ?? "");
  const [rest, setRest] = useState(String(we.rest_seconds ?? ""));
  const [notes, setNotes] = useState(we.notes ?? "");

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex flex-col items-center gap-1 pt-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isFirst} onClick={onMoveUp}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLast} onClick={onMoveDown}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {exerciseImageUrl(we.image) && (
          <img
            src={exerciseImageUrl(we.image)!}
            alt={we.name ?? "Exercise"}
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-md border bg-muted object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="truncate font-medium capitalize">{we.name ?? "Exercise"}</div>
              <div className="flex flex-wrap gap-1">
                {we.target && <Chip className="capitalize">{we.target}</Chip>}
                {we.equipment && <Chip className="capitalize">{we.equipment}</Chip>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sets</Label>
              <Input
                type="number" min={0} className="h-8 w-16"
                value={sets}
                onInput={(e) => setSets((e.target as HTMLInputElement).value)}
                onBlur={() => onUpdate({ sets: parseInt(sets, 10) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                className="h-8 w-24"
                placeholder="8-12"
                value={reps}
                onInput={(e) => setReps((e.target as HTMLInputElement).value)}
                onBlur={() => onUpdate({ reps })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Rest (sec)</Label>
              <Input
                type="number" min={0} className="h-8 w-20"
                value={rest}
                onInput={(e) => setRest((e.target as HTMLInputElement).value)}
                onBlur={() => onUpdate({ rest_seconds: parseInt(rest, 10) || 0 })}
              />
            </div>
            <div className="min-w-[10rem] flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Input
                className="h-8"
                placeholder="Tempo, cues…"
                value={notes}
                onInput={(e) => setNotes((e.target as HTMLInputElement).value)}
                onBlur={() => onUpdate({ notes })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EditWorkoutDialogProps {
  initial: { name: string; category: string; description: string };
  onSave: (data: { name: string; category: string; description: string }) => Promise<void>;
  onClose: () => void;
}

function EditWorkoutDialog({ initial, onSave, onClose }: EditWorkoutDialogProps) {
  const { setError } = useApp();
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [description, setDescription] = useState(initial.description);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), category: category.trim(), description });
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
          <DialogTitle>Edit Workout</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory((e.target as HTMLInputElement).value)} placeholder="Strength, Hypertrophy, HIIT, Mobility…" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={handleSave}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FacetSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FacetSelect({ label, value, options, onChange }: FacetSelectProps) {
  return (
    <Select value={value === "" ? ALL : value} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue placeholder={`All ${label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ExercisePicker({ workoutId, onClose }: { workoutId: string; onClose: () => void }) {
  const {
    exercises, exercisesPag, setExercisesPage,
    exercisesSearch, setExercisesSearch,
    exerciseFilters, setExerciseFilter, facets,
    addWorkoutExercise,
  } = useApp();
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const handleAdd = async (id: string) => {
    await addWorkoutExercise(workoutId, { exercise_id: id });
    setAdded((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Input
            className="sm:max-w-xs"
            placeholder="Search exercises…"
            value={exercisesSearch}
            onChange={(e) => setExercisesSearch((e.target as HTMLInputElement).value)}
          />
          <FacetSelect label="Body Parts" value={exerciseFilters.body_part} options={facets.body_parts} onChange={(v) => setExerciseFilter("body_part", v)} />
          <FacetSelect label="Targets" value={exerciseFilters.target} options={facets.targets} onChange={(v) => setExerciseFilter("target", v)} />
          <FacetSelect label="Equipment" value={exerciseFilters.equipment} options={facets.equipment} onChange={(v) => setExerciseFilter("equipment", v)} />
        </div>

        <ScrollArea className="max-h-[60vh]">
          {exercises.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No exercises found. Try adjusting your search or filters.
            </p>
          ) : (
            <div className="space-y-2 pr-3">
              {exercises.map((ex) => (
                <div key={ex.id} className="flex items-center gap-3 rounded-md border p-3">
                  {exerciseImageUrl(ex.image) && (
                    <img
                      src={exerciseImageUrl(ex.image)!}
                      alt={ex.name}
                      loading="lazy"
                      className="h-12 w-12 shrink-0 rounded-md border bg-muted object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="truncate font-medium capitalize">{ex.name}</div>
                    <div className="flex flex-wrap gap-1">
                      {ex.target && <Chip className="capitalize">{ex.target}</Chip>}
                      {ex.equipment && <Chip className="capitalize">{ex.equipment}</Chip>}
                    </div>
                  </div>
                  <Button
                    variant={added[ex.id] ? "secondary" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleAdd(ex.id)}
                  >
                    {added[ex.id] ? (<><Check className="h-4 w-4" /> Added</>) : (<><Plus className="h-4 w-4" /> Add</>)}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Pagination pag={exercisesPag} setPage={setExercisesPage} />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareDialog({
  token,
  onShare,
  onUnshare,
  onClose,
}: {
  token: string;
  onShare: () => Promise<string>;
  onUnshare: () => Promise<void>;
  onClose: () => void;
}) {
  const [tok, setTok] = useState(token);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = tok ? `${window.location.origin}/api/share/${tok}` : "";

  const create = async () => {
    setBusy(true);
    try {
      setTok(await onShare());
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      await onUnshare();
      setTok("");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; the link is still selectable */
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share workout</DialogTitle>
        </DialogHeader>

        {!tok ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a public link your client can open on their phone — no login, images and
              instructions included. You can revoke it any time.
            </p>
            <Button disabled={busy} onClick={create}>
              <Share2 className="h-4 w-4" /> {busy ? "Creating…" : "Create share link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={url} onFocus={(e) => (e.target as HTMLInputElement).select()} />
              <Button variant="outline" size="icon" className="shrink-0" onClick={copy} title="Copy link">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" /> Open
                </Button>
              </a>
              <a href={`${url}?format=pdf`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <FileDown className="h-4 w-4" /> Download PDF
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the workout. Revoking it breaks the old link immediately.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={busy}
              onClick={stop}
            >
              <Link2Off className="h-4 w-4" /> {busy ? "Revoking…" : "Stop sharing"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
