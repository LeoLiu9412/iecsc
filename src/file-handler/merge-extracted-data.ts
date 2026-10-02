import { Glob } from "bun";
import { CONSTANTS } from "../../constants";
import type { IECSC_Record, ChemicalClass } from "../types/record.type";
import { extractModifyFiles } from "./extract-modify-files";
import path from "path";

/**
 * Merge the data extracted in output folder, and save the data into merged folder, it should be called after extractCreateFiles
 */
export async function mergeExtractedData() {
  // load json files
  const output_folder_path = path.join(CONSTANTS.BASE_PATH, "output");
  const json_file_path_list = (
    await Array.fromAsync(
      new Glob("*/*.json").scan({ cwd: output_folder_path }),
    )
  ).map((file_path) => path.join(output_folder_path, file_path));

  const class_table_json_files: string[] = [];
  const substance_table_json_files: string[] = [];

  for (const json_file_path of json_file_path_list) {
    if (json_file_path.endsWith("class_table.json")) {
      class_table_json_files.push(json_file_path);
    } else if (json_file_path.endsWith("substance_table.json")) {
      substance_table_json_files.push(json_file_path);
    }
  }

  const merged_class_table_json: IECSC_Record[] = [];
  const merged_substance_table_json: IECSC_Record[] = [];

  for (const class_table_json_file of class_table_json_files) {
    const json_data: IECSC_Record[] = await import(class_table_json_file).then(
      (mod) => mod.default,
    );
    merged_class_table_json.push(...json_data);
  }

  for (const substance_table_json_file of substance_table_json_files) {
    const json_data: IECSC_Record[] = await import(
      substance_table_json_file
    ).then((mod) => mod.default);
    merged_substance_table_json.push(...json_data);
  }

  // modify merged data
  const { update_class_data } = await extractModifyFiles();
  for (const update_class of update_class_data) {
    const target_records = merged_class_table_json.filter(
      (item) => item.record.serial_number === update_class.serial_number,
    );
    for (const t of target_records) {
      const record = t.record as ChemicalClass;
      record.remark = update_class.remark;
      record.class_name_cn = update_class.class_name_cn;
      record.class_name_en = update_class.class_name_en;
    }
  }

  return {
    merged_class_table_json,
    merged_substance_table_json,
  };
}
