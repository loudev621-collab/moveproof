// Who may create the PDF and the share link for a home:
// - landlords: always, for free
// - renters: once the home has a Move Pass (one payment covers move-in and move-out)
export function canDownload(property: { role: string | null; paid: boolean | null } | null) {
  if (!property) return false;
  return property.role === "landlord" || !!property.paid;
}
