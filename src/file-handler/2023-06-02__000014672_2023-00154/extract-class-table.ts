import { pdfCenteredTableReader } from "../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../pdf/table-row-validator";
import { CONSTANTS } from "../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../types/record.type";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202306/t20230605_1032516.html

// the class table is on pages 1-5, the substance table follows it on page 5
const column_range: TableColumnRange = {
  serial_id: [75, 106],
  class_name_cn: [107, 295],
  class_name_en: [296, 549],
  serial_number: [550, 598],
  remark: [599, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2023-06-02__000014672_2023-00154",
  "列入《中国现有化学物质名录》的39种符合要求的已登记新化学物质.pdf",
);

const class_table = await pdfCenteredTableReader({
  file_path: input_path,
  from_page: 1,
  // skip the table header, below the document title
  after_from_page_y_axis: 235,
  to_page: 5,
  // stop above the header of the substance table, which shares page 5
  before_to_page_y_axis: 190,
  table_columns: column_range,
  line_height: 13.6,
  row_start_column: "serial_id",
  // remark (新用途环境管理范围) wraps over several lines, join them without a space
  no_space_columns: ["serial_id", "serial_number", "remark"],
  each_page_y_axis_range: [115, 520],
});

tableRowValidator(class_table);

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");

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
      publish_name:
        "关于已登记新化学物质列入《中国现有化学物质名录》（2023年第1批 总第11批）的公告",
      publish_date: "2023-06-02",
      publish_serial_number: "000014672/2023-00154",
      link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202306/t20230605_1032516.html",
      file_name: "列入《中国现有化学物质名录》的39种符合要求的已登记新化学物质.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2023-06-02__000014672_2023-00154",
    "class_table.json",
  ),
).write(JSON.stringify(formatted_class_table));

console.log(`Finished extracting class table from ${input_path}`);
