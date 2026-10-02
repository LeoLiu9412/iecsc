import path from "path";
import { CONSTANTS } from "../../../../constants";
import type { TableColumnRange } from "../../../utils/table-columns-range-calculator";
import { pdfCenteredTableReader } from "../../../pdf/centered-table-reader";
import { tableRowValidator } from "../../../pdf/table-row-validator";
import type { ChemicalClass } from "../../../types/record.type";

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");

export async function extractUpdateClassTable() {
  // the table is on page 1 only, ranges are in the PDF's own coordinates (page width 841.9)
  const column_range: TableColumnRange = {
    serial_id: [60, 100],
    class_name_cn: [100, 265],
    class_name_en: [265, 550],
    serial_number: [550, 600],
    remark: [600, 842],
  };

  const input_path = path.join(
    CONSTANTS.SOURCE_FOLDER_PATH,
    "2025-05-06__000014672_2025-00185",
    "变更《中国现有化学物质名录》中化学物质允许用途清单（2025年第1批 总第1批）.pdf",
  );

  const class_table = await pdfCenteredTableReader({
    file_path: input_path,
    from_page: 1,
    // skip the title above the table
    after_from_page_y_axis: 240,
    to_page: 1,
    before_to_page_y_axis: 500,
    table_columns: column_range,
    line_height: 13.6,
    row_start_column: "serial_id",
    // remark (新用途环境管理范围) wraps over several lines, join them without a space
    no_space_columns: ["serial_id", "serial_number", "remark"],
  });

  tableRowValidator(class_table);

  return class_table.map(
    (row): ChemicalClass => ({
      serial_number: removeWhitespace(row["serial_number"]!),
      class_name_cn: removeWhitespace(row["class_name_cn"]!),
      class_name_en: row["class_name_en"]!,
      use_control: [],
      remark: removeWhitespace(row["remark"] ?? ""),
    }),
  );
}
