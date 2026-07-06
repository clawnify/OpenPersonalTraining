// Exercise images come from the public-domain (Unlicense) yuhonas/free-exercise-db,
// served via jsDelivr pinned to an immutable commit SHA so URLs never drift.
const SHA = "b0eed061e1c832b3ed815fbaa4b45b3cdc14df49";
const BASE = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@${SHA}/exercises`;

/** Full CDN URL for an exercise image path (e.g. "Barbell_Squat/0.jpg"), or null if none. */
export function exerciseImageUrl(image?: string | null): string | null {
  return image ? `${BASE}/${image}` : null;
}
