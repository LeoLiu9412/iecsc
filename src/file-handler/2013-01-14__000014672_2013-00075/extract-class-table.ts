import { pdfTableReader } from "../../pdf/table-reader";
import path from "path";
import type { TableColumnRange } from "../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../pdf/table-row-validator";
import { CONSTANTS } from "../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../types/record.type";

// link: https://www.mee.gov.cn/gkml/hbb/bgg/201301/t20130131_245810.htm

const column_range: TableColumnRange = {
  serial_id: [90, 110],
  class_name_cn: [114, 268],
  class_name_en: [270, 470],
  serial_number: [475, 520],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2013-01-14__000014672_2013-00075",
  "中国现有化学物质名录.pdf",
);

const class_table = await pdfTableReader({
  file_path: input_path,
  from_page: 4059,
  after_from_page_y_axis: 90,
  to_page: 4147,
  before_to_page_y_axis: 800,
  table_columns: column_range,
  line_height: 15.599,
  no_space_columns: ["serial_id", "serial_number"],
  // skip the repeated table header (above) and the page number (below)
  each_page_y_axis_range: [90, 800],
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
      class_name_cn: row["class_name_cn"]!,
      class_name_en: row["class_name_en"]!,
      use_control: [],
    },
    source: {
      publish_name: "关于发布《中国现有化学物质名录》的公告",
      publish_date: "2013-01-14",
      publish_serial_number: "000014672/2013-00075",
      link: "https://www.mee.gov.cn/gkml/hbb/bgg/201301/t20130131_245810.htm",
      file_name: "中国现有化学物质名录.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2013-01-14__000014672_2013-00075",
    "class_table.json",
  ),
).write(JSON.stringify(formatted_class_table));

console.log(`Finished extracting class table from ${input_path}`);
