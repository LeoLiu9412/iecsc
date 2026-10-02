import { write } from "bun";
import { zipSync, strToU8 } from "fflate";
import { CONSTANTS } from "../../constants";
import { mergeExtractedData } from "./merge-extracted-data";
import path from "path";

/**
 * Save the merged data into Json files and create zip files
 */
export async function saveMergedData() {
  const { merged_class_table_json, merged_substance_table_json } =
    await mergeExtractedData();

  const date = new Date();
  const formatted_date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  const archive_folder_path = path.join(CONSTANTS.BASE_PATH, "data");
  const archive_path = path.join(
    archive_folder_path,
    `iecsc-data_${formatted_date}.zip`,
  );

  const archive = zipSync({
    "class_table.json": strToU8(JSON.stringify(merged_class_table_json)),
    "substance_table.json": strToU8(
      JSON.stringify(merged_substance_table_json),
    ),
  });

  // Bun.write creates the data folder if it does not exist
  await write(archive_path, archive);

  console.log(`Saved merged data to ${archive_path}`);
}
