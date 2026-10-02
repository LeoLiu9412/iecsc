import { pdfCenteredTableReader } from "../../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../../pdf/table-row-validator";
import { CONSTANTS } from "../../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../../types/record.type";
import { casChecksumNote, casValidator } from "../../../utils/cas-validator";
import { joinNotes } from "../../../utils/join-notes";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202306/t20230605_1032516.html

// the substance table starts on page 5, below the end of the class table, and ends on page 6
const column_range: TableColumnRange = {
  serial_id: [75, 106],
  name_cn: [107, 250],
  name_en: [251, 429],
  formula: [430, 585],
  cas: [586, 655],
  remark: [656, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2023-06-02__000014672_2023-00154",
  "列入《中国现有化学物质名录》的39种符合要求的已登记新化学物质.pdf",
);

const substance_table = await pdfCenteredTableReader({
  file_path: input_path,
  from_page: 5,
  // skip the class table above, which ends on the same page
  after_from_page_y_axis: 190,
  to_page: 6,
  before_to_page_y_axis: 400,
  table_columns: column_range,
  line_height: 13.6,
  row_start_column: "serial_id",
  // remark (新用途环境管理范围) and cas wrap over several lines, join them without a space.
  // formula is deliberately excluded: some rows list several formulas (with their mix
  // percentage) stacked across lines, and the space between wrapped lines is meaningful,
  // not a layout artifact.
  no_space_columns: ["serial_id", "cas", "remark"],
  each_page_y_axis_range: [130, 515],
});

tableRowValidator(substance_table);

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");
// formula cells may legitimately contain several formulas separated by a space; only
// collapse repeated whitespace left over from line-wrap joins instead of removing it
const collapseWhitespace = (text: string) => text.replace(/\s+/g, " ").trim();

const formatted_substance_table = substance_table.map((row) => {
  const cas = removeWhitespace(row["cas"]!);
  const is_valid_cas = casValidator(cas);
  const cas_note = casChecksumNote(cas);

  // format the row into an IECSC_Record object
  const record: IECSC_Record = {
    kind: "chemical-substance",
    note: joinNotes(row["note"], cas_note),
    record: {
      cas: is_valid_cas ? cas : "",
      serial_number: is_valid_cas ? "" : cas,
      name_cn: removeWhitespace(row["name_cn"]!),
      name_en: row["name_en"]!,
      synonym_cn: [],
      synonym_en: [],
      formula: collapseWhitespace(row["formula"] ?? ""),
      use_control: [],
      remark: removeWhitespace(row["remark"] ?? ""),
    },
    source: {
      publish_name:
        "关于已登记新化学物质列入《中国现有化学物质名录》（2023年第1批 总第11批）的公告",
      publish_date: "2023-06-02",
      publish_serial_number: "000014672/2023-00154",
      link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202306/t20230605_1032516.html",
      file_name:
        "列入《中国现有化学物质名录》的39种符合要求的已登记新化学物质.pdf",
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
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(`Finished extracting substance table from ${input_path}`);
