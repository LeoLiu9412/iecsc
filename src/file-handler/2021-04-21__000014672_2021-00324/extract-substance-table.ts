import { pdfCenteredTableReader } from "../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../pdf/table-row-validator";
import { CONSTANTS } from "../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../types/record.type";
import { casValidator } from "../../utils/cas-validator";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202104/t20210425_830319.html

// the substance table starts on page 9, below the end of the class table
const column_range: TableColumnRange = {
  serial_id: [48, 70],
  name_cn: [72, 235],
  name_en: [236, 450],
  formula: [451, 568],
  cas: [569, 638],
  remark: [639, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2021-04-21__000014672_2021-00324",
  "列入《中国现有化学物质名录》的 115 种符合要求的《新化学物质环境管理办法》（环境保护部令第7号）下已登记新化学物质.pdf",
);

const substance_table = await pdfCenteredTableReader({
  file_path: input_path,
  from_page: 9,
  after_from_page_y_axis: 432,
  to_page: 11,
  before_to_page_y_axis: 515,
  table_columns: column_range,
  line_height: 13.6,
  row_start_column: "serial_id",
  // remark (新用途环境管理范围) wraps over several lines, join them without a space
  no_space_columns: ["serial_id", "formula", "cas", "remark"],
  each_page_y_axis_range: [115, 515],
});

tableRowValidator(substance_table);

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");

const formatted_substance_table = substance_table.map((row) => {
  const cas = removeWhitespace(row["cas"]!);
  const is_valid_cas = casValidator(cas);

  // format the row into an IECSC_Record object
  const record: IECSC_Record = {
    kind: "chemical-substance",
    record: {
      cas: is_valid_cas ? cas : "",
      serial_number: is_valid_cas ? "" : cas,
      name_cn: removeWhitespace(row["name_cn"]!),
      name_en: row["name_en"]!,
      synonym_cn: [],
      synonym_en: [],
      formula: removeWhitespace(row["formula"]!),
      use_control: [],
      remark: removeWhitespace(row["remark"] ?? ""),
    },
    source: {
      publish_name: "关于增补《中国现有化学物质名录》的公告",
      publish_date: "2021-04-21",
      publish_serial_number: "000014672/2021-00324",
      link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202104/t20210425_830319.html",
      file_name:
        "列入《中国现有化学物质名录》的 115 种符合要求的《新化学物质环境管理办法》（环境保护部令第7号）下已登记新化学物质.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2021-04-21__000014672_2021-00324",
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(`Finished extracting substance table from ${input_path}`);
