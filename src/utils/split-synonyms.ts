/**
 * Split a synonym cell into a list. The sources mix half-width (;) and full-width (；) semicolons.
 */
export function splitSynonyms(text: string | undefined) {
  return (text ?? "")
    .split(/[;；]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
