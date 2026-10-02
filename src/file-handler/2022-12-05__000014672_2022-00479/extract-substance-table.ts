import { pdfCenteredTableReader } from "../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../pdf/table-row-validator";
import { CONSTANTS } from "../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../types/record.type";
import { casValidator } from "../../utils/cas-validator";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202212/t20221206_1006996.html

// the substance table is on page 4, below the end of the class table
const column_range: TableColumnRange = {
  serial_id: [70, 105],
  name_cn: [106, 252],
  name_en: [253, 470],
  cas: [471, 558],
  formula: [559, 660],
  remark: [661, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2022-12-05__000014672_2022-00479",
  "列入《中国现有化学物质名录》的36种符合要求的已登记新化学物质.pdf",
);

const substance_table = await pdfCenteredTableReader({
  file_path: input_path,
  from_page: 4,
  // skip the table header, whose "序号" cell wraps over two lines
  after_from_page_y_axis: 115,
  to_page: 4,
  before_to_page_y_axis: 400,
  table_columns: column_range,
  line_height: 13.6,
  row_start_column: "serial_id",
  // remark (新用途环境管理范围) wraps over several lines, join them without a space
  no_space_columns: ["serial_id", "formula", "cas", "remark"],
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
      publish_name:
        "关于已登记新化学物质列入《中国现有化学物质名录》（2022年第2批 总第10批）的公告",
      publish_date: "2022-12-05",
      publish_serial_number: "000014672/2022-00479",
      link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202212/t20221206_1006996.html",
      file_name: "列入《中国现有化学物质名录》的36种符合要求的已登记新化学物质.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2022-12-05__000014672_2022-00479",
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(`Finished extracting substance table from ${input_path}`);
