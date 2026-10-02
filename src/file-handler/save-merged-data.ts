import { write } from "bun";
import { zipSync, strToU8 } from "fflate";
import { CONSTANTS } from "../../constants";
import { mergeExtractedData } from "./merge-extracted-data";
import path from "path";
import { convertJsonToCsv } from "./convert-json-to-csv";
import type { IECSC_Record } from "../types/record.type";

interface SaveMergedDataArgs {
  merged_class_table_json: IECSC_Record[];
  merged_substance_table_json: IECSC_Record[];
}

/**
 * Save the merged data into Json files and create zip files
 */
export async function saveMergedData({
  merged_class_table_json,
  merged_substance_table_json,
}: SaveMergedDataArgs) {
  const merged_substance_table_csv = convertJsonToCsv(
    merged_substance_table_json,
  );
  const merged_class_table_csv = convertJsonToCsv(merged_class_table_json);

  const date = new Date();
  const formatted_date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  const archive_folder_path = path.join(CONSTANTS.BASE_PATH, "data");
  const archive_path = path.join(
    archive_folder_path,
    `iecsc-data_${formatted_date}.zip`,
  );

  const archive = zipSync({
    "chemical-class-table.json": strToU8(
      JSON.stringify(merged_class_table_json),
    ),
    "chemical-substance-table.json": strToU8(
      JSON.stringify(merged_substance_table_json),
    ),
    "chemical-class-table.csv": strToU8(merged_class_table_csv),
    "chemical-substance-table.csv": strToU8(merged_substance_table_csv),
  });

  // Bun.write creates the data folder if it does not exist
  await write(archive_path, archive);

  console.log(`Saved merged data to ${archive_path}`);
}
