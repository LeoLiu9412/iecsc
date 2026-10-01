/**
 * To validate the structure and content of the extracted JSON data.
 */
export function tableRowValidator(table_rows: Record<string, string>[]) {
  let prev_serial_id: number | null = null;

  for (let i = 0; i < table_rows.length; i++) {
    const row = table_rows[i]!;

    if (!row["serial_id"]) {
      throw new Error(`Row at index ${i} is missing a serial_id`);
    }

    const serial_id = Number(row["serial_id"]);
    if (isNaN(serial_id) || serial_id <= 0) {
      throw new Error(`Row at index ${i} has an invalid serial_id`);
    }

    if (prev_serial_id !== null && serial_id !== prev_serial_id + 1) {
      throw new Error(
        `Row at index ${i} has a non-sequential serial_id: ${serial_id} (previous: ${prev_serial_id})`,
      );
    }

    prev_serial_id = serial_id;
  }
}
