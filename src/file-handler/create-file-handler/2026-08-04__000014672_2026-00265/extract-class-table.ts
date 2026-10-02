import { pdfCenteredTableReader } from "../../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../../pdf/table-row-validator";
import { CONSTANTS } from "../../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../../types/record.type";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202608/t20260806_1163640.html

const source_base = {
  publish_name: "关于增补和变更《中国现有化学物质名录》的公告",
  publish_date: "2026-08-04",
  publish_serial_number: "000014672/2026-00265",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202608/t20260806_1163640.html",
} satisfies Partial<IECSC_Record["source"]>;

const column_range: TableColumnRange = {
  serial_id: [60, 104],
  class_name_cn: [105, 356],
  class_name_en: [357, 608],
  serial_number: [609, 654],
  remark: [655, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2026-08-04__000014672_2026-00265",
  "列入《中国现有化学物质名录》的482种符合要求的已登记新化学物质（2026年第1批 总第16批）.pdf",
);

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");

// serial ids in this PDF are printed as "1.", "2." ...
const removeTrailingDot = (text: string) => text.replace(/\.$/, "");

// the class table is on pages 1-7, the substance table starts on page 8
const class_table = await pdfCenteredTableReader({
  file_path: input_path,
  from_page: 1,
  after_from_page_y_axis: 265,
  to_page: 7,
  before_to_page_y_axis: 510,
  table_columns: column_range,
  line_height: 13.6,
  row_start_column: "serial_id",
  // remark (新用途环境管理范围) wraps over several lines, join them without a space
  no_space_columns: ["serial_id", "serial_number", "remark"],
  each_page_y_axis_range: [115, 510],
});

class_table.forEach(
  (row) => (row["serial_id"] = removeTrailingDot(row["serial_id"]!)),
);
tableRowValidator(class_table);

const formatted_class_table = class_table.map((row) => {
  // format the row into an IECSC_Record object
  const record: IECSC_Record = {
    kind: "chemical-class",
    record: {
      serial_number: removeWhitespace(row["serial_number"]!),
      class_name_cn: removeWhitespace(row["class_name_cn"]!),
      class_name_en: row["class_name_en"]!,
      use_control: [],
      remark: removeWhitespace(row["remark"] ?? ""),
    },
    source: {
      ...source_base,
      file_name:
        "列入《中国现有化学物质名录》的482种符合要求的已登记新化学物质（2026年第1批 总第16批）.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2026-08-04__000014672_2026-00265",
    "class_table.json",
  ),
).write(JSON.stringify(formatted_class_table));

console.log(`Finished extracting class table from ${input_path}`);
