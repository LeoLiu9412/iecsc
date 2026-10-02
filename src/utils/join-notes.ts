/**
 * Join the non-empty notes of a record into one string, dropping repeated notes.
 */
export function joinNotes(...notes: (string | undefined)[]) {
  const unique_notes = new Set(
    notes.flatMap((note) => note?.split("；") ?? []),
  );
  unique_notes.delete("");
  return [...unique_notes].join("；");
}
