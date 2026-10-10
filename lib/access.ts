// Who may download a report: the home has a Home Pass, or the user has an active Landlord plan.
export function canDownload(
  profile: { plan: string | null; plan_status: string | null } | null,
  property: { paid: boolean | null } | null
) {
  if (property?.paid) return true;
  return profile?.plan === "landlord" && ["active", "trialing"].includes(profile.plan_status ?? "");
}
