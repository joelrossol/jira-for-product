// Jira link types have an outward phrase ("blocks") and an inward one ("is blocked
// by"). Related-issue tables describe the other issue, so they read "Blocks this".
export function linkRelation(phrase: string): string {
  const p = phrase.trim() || "relates to";
  return `${p.charAt(0).toUpperCase()}${p.slice(1)} this`;
}
