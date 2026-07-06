import { useState } from "preact/hooks";
import { useApp } from "../context";
import type { Exercise } from "../types";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "./pagination";
import { exerciseImageUrl } from "@/lib/exercise-image";

const ALL = "__all";

interface FacetSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FacetSelect({ label, value, options, onChange }: FacetSelectProps) {
  return (
    <Select
      value={value === "" ? ALL : value}
      onValueChange={(v) => onChange(v === ALL ? "" : v)}
    >
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue placeholder={`All ${label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="capitalize">
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ExerciseLibrary() {
  const {
    exercises,
    exercisesPag,
    setExercisesPage,
    exercisesSearch,
    setExercisesSearch,
    exerciseFilters,
    setExerciseFilter,
    facets,
  } = useApp();

  const [selected, setSelected] = useState<Exercise | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Exercise Library</h1>
        <p className="text-sm text-muted-foreground">
          {exercisesPag.total} exercises
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          className="sm:max-w-xs"
          placeholder="Search exercises…"
          value={exercisesSearch}
          onChange={(e) =>
            setExercisesSearch((e.target as HTMLInputElement).value)
          }
        />
        <FacetSelect
          label="Body Parts"
          value={exerciseFilters.body_part}
          options={facets.body_parts}
          onChange={(v) => setExerciseFilter("body_part", v)}
        />
        <FacetSelect
          label="Targets"
          value={exerciseFilters.target}
          options={facets.targets}
          onChange={(v) => setExerciseFilter("target", v)}
        />
        <FacetSelect
          label="Equipment"
          value={exerciseFilters.equipment}
          options={facets.equipment}
          onChange={(v) => setExerciseFilter("equipment", v)}
        />
      </div>

      {exercises.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No exercises found. Try adjusting your search or filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
              onClick={() => setSelected(ex)}
            >
              {exerciseImageUrl(ex.image) && (
                <img
                  src={exerciseImageUrl(ex.image)!}
                  alt={ex.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full bg-muted object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              )}
              <CardContent className="space-y-2 p-4">
                <div className="font-medium capitalize">{ex.name}</div>
                <div className="flex flex-wrap gap-1">
                  {ex.body_part && (
                    <Chip className="capitalize">{ex.body_part}</Chip>
                  )}
                  {ex.equipment && (
                    <Chip className="capitalize">{ex.equipment}</Chip>
                  )}
                  {ex.target && (
                    <Chip className="capitalize">{ex.target}</Chip>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {ex.instructions.slice(0, 110)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination pag={exercisesPag} setPage={setExercisesPage} />

      {selected && (
        <ExerciseDetail
          exercise={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
}

function ExerciseDetail({ exercise, onClose }: ExerciseDetailProps) {
  const steps = exercise.instructions
    .split(/(?<=\.)\s+/)
    .filter(Boolean);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">{exercise.name}</DialogTitle>
        </DialogHeader>

        {exerciseImageUrl(exercise.image) && (
          <img
            src={exerciseImageUrl(exercise.image)!}
            alt={exercise.name}
            className="w-full rounded-lg border bg-muted object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}

        <div className="flex flex-wrap gap-1">
          {exercise.body_part && (
            <Chip className="capitalize">{exercise.body_part}</Chip>
          )}
          {exercise.target && (
            <Chip className="capitalize">{exercise.target}</Chip>
          )}
          {exercise.equipment && (
            <Chip className="capitalize">{exercise.equipment}</Chip>
          )}
        </div>

        {exercise.secondary_muscles.length > 0 && (
          <p className="text-sm capitalize text-muted-foreground">
            Secondary: {exercise.secondary_muscles.join(", ")}
          </p>
        )}

        {steps.length > 1 ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm">{exercise.instructions}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
