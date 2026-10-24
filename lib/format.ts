import { isCalifornia } from "./california";

export const KIND_LABELS: Record<string, string> = {
  move_in: "Move-in",
  move_out: "Move-out",
  after_repairs: "After-repair",
  other: "Walkthrough",
};

// The title used on the report page, share page and PDF.
// California homes get "California AB 2801 Move-in Photo Record".
export function recordTitle(kind: string, state: string | null | undefined) {
  const base = `${KIND_LABELS[kind] ?? "Walkthrough"} Photo Record`;
  return isCalifornia(state) ? `California AB 2801 ${base}` : base;
}

export const CONDITION_LABELS: Record<string, string> = {
  good: "Good",
  fair: "Fair",
  damaged: "Damaged",
};

export const DEFAULT_ROOMS = [
  "Entry and hallway",
  "Living room",
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Closets",
  "Outside, patio or garage",
];

export function when(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function address(p: { address_line: string; unit?: string | null; city: string; state: string; zip: string }) {
  return `${p.address_line}${p.unit ? `, ${p.unit}` : ""}, ${p.city}, ${p.state} ${p.zip}`;
}
