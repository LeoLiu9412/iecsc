import { pdfTableReader } from "../../pdf/table-reader";
import path from "path";
import type { TableColumnRange } from "../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../pdf/table-row-validator";
import { CONSTANTS } from "../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../types/record.type";

// link: https://www.mee.gov.cn/gkml/hbb/bgg/201603/t20160315_332884.htm

const column_range: TableColumnRange = {
  serial_id: [95, 115],
  class_name_cn: [120, 285],
  class_name_en: [286, 535],
  serial_number: [550, 600],
  category: [620, 712],
  remark: [713, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2016-03-10__000014672_2016-00241",
  "31种符合要求的已登记新化学物质.pdf",
);

const class_table = await pdfTableReader({
  file_path: input_path,
  // the class table starts below the substance table on page 4
  from_page: 4,
  after_from_page_y_axis: 300,
  to_page: 5,
  before_to_page_y_axis: 520,
  table_columns: column_range,
  line_height: 13.6,
  no_space_columns: ["serial_id", "serial_number"],
  // skip the repeated table header (above) and the page number (below)
  each_page_y_axis_range: [110, 520],
});

tableRowValidator(class_table);

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");

const formatted_class_table = class_table.map((row) => {
  const record: IECSC_Record = {
    kind: "chemical-class",
    record: {
      serial_number: removeWhitespace(row["serial_number"]!),
      class_name_cn: row["class_name_cn"]!,
      // lines wrapped right after a hyphen must be joined without a space
      class_name_en: row["class_name_en"]!.replace(
        /-\s+(?!and\b)(?=[a-z])/g,
        "-",
      ),
      use_control: row["category"] ? [removeWhitespace(row["category"])] : [],
      remark: row["remark"] ?? "",
    },
    source: {
      publish_name: "关于增补《中国现有化学物质名录》的公告",
      publish_date: "2016-03-10",
      publish_serial_number: "000014672/2016-00241",
      link: "https://www.mee.gov.cn/gkml/hbb/bgg/201603/t20160315_332884.htm",
      file_name: "31种符合要求的已登记新化学物质.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2016-03-10__000014672_2016-00241",
    "class_table.json",
  ),
).write(JSON.stringify(formatted_class_table));

console.log(`Finished extracting class table from ${input_path}`);
