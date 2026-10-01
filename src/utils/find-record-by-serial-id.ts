import type { IECSC_Record } from "../types/record.type";

/**
 * To find a record by its serial ID in the given list of IECSC records.
 */
export function findRecordBySerialId(
  serial_id: string,
  records: IECSC_Record[],
) {
  const target_record = records.find(
    (r) => r.source.file_serial_number === serial_id,
  );
  return target_record!;
}
