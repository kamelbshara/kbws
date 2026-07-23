/** Formats retrieved Knowledge Memory notes into a prompt block, or null if there are none. */
export function formatKnowledgeContext(notes: string[]): string | null {
  if (notes.length === 0) return null;
  return `Relevant institutional best practices to consider (from this school's own accumulated experience):\n${notes
    .map((n) => `- ${n}`)
    .join("\n")}`;
}
