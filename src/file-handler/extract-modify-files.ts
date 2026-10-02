import { Glob } from "bun";
import { CONSTANTS } from "../../constants";
import type { ChemicalClass } from "../types/record.type";
import path from "path";

/**
 * Extract modify files from src/file-handler/modify-file-handler
 */
export async function extractModifyFiles() {
  const modify_file_handler_path = path.join(
    CONSTANTS.BASE_PATH,
    "src",
    "file-handler",
    "modify-file-handler",
  );

  const scripts = (
    await Array.fromAsync(
      new Glob("*/*.ts").scan({ cwd: modify_file_handler_path }),
    )
  ).map((file_path) => path.join(modify_file_handler_path, file_path));

  // only update_class_files now, may extend to other types of modify files in the future
  const update_class_data: ChemicalClass[] = [];
  const extract_update_class_table_scripts = scripts.filter((file_path) =>
    file_path.endsWith("extract-update-class-table.ts"),
  );
  for (const file_path of extract_update_class_table_scripts) {
    const mod = await import(file_path);
    const f = mod.extractUpdateClassTable;
    const chemical_class_data = await f();
    update_class_data.push(...chemical_class_data);
  }

  return {
    update_class_data,
  };
}
