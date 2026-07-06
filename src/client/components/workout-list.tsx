import { useState } from "preact/hooks";
import { useApp } from "../context";
import { Plus } from "lucide-preact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { CreateWorkout } from "./create-workout";

export function WorkoutList() {
  const { workouts, workoutsSearch, setWorkoutsSearch, navigate } = useApp();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Workouts</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Workout
        </Button>
      </div>

      <Input
        className="sm:max-w-xs"
        placeholder="Search workouts…"
        value={workoutsSearch}
        onChange={(e) => setWorkoutsSearch((e.target as HTMLInputElement).value)}
      />

      {workouts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No workouts yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first workout to start adding exercises.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Workout
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((w) => (
            <Card
              key={w.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate("/workouts/" + w.id)}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{w.name}</div>
                  {w.category && (
                    <Chip className="shrink-0 capitalize">{w.category}</Chip>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {w.exercise_count ?? 0} exercises
                </div>
                {w.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {w.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateWorkout onClose={() => setShowCreate(false)} />}
    </div>
  );
}
