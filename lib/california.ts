// Plain-language summary of California AB 2801 (Civil Code §1950.5). Not legal advice.
// Source: https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2801

export const AB2801_URL = "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2801";

export const AB2801_STEPS = [
  {
    kind: "move_in",
    label: "Move-in photos",
    when: "Immediately before, or at the start of, the tenancy",
    since: "Tenancies starting on or after July 1, 2025",
  },
  {
    kind: "move_out",
    label: "Move-out photos",
    when: "Within a reasonable time after the home is handed back, before any repairs or cleaning that will be deducted",
    since: "Move-outs since April 1, 2025",
  },
  {
    kind: "after_repairs",
    label: "After-repair photos",
    when: "Within a reasonable time after those repairs or cleaning are done",
    since: "Move-outs since April 1, 2025",
  },
] as const;

export function isCalifornia(state: string | null | undefined) {
  return (state ?? "").trim().toUpperCase() === "CA";
}
