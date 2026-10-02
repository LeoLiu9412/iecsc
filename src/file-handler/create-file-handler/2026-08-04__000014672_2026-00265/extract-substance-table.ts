import { pdfCenteredTableReader } from "../../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../../pdf/table-row-validator";
import { CONSTANTS } from "../../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../../types/record.type";
import { casValidator } from "../../../utils/cas-validator";
import { splitSynonyms } from "../../../utils/split-synonyms";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202608/t20260806_1163640.html

const source_base = {
  publish_name: "关于增补和变更《中国现有化学物质名录》的公告",
  publish_date: "2026-08-04",
  publish_serial_number: "000014672/2026-00265",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202608/t20260806_1163640.html",
} satisfies Partial<IECSC_Record["source"]>;

// attachment 1 (增补… 总第14批): substances with synonyms
// (the table header calls the synonym columns 中文类名/英文类名)
const column_range_1: TableColumnRange = {
  serial_id: [60, 100],
  name_cn: [101, 172],
  name_en: [173, 284],
  synonym_cn: [285, 338],
  synonym_en: [339, 530],
  formula: [531, 700],
  cas: [701, 800],
};

// attachment 2 (已登记… 总第16批): the substance table is on pages 8-63, after the class table
const column_range_2: TableColumnRange = {
  serial_id: [60, 104],
  name_cn: [105, 260],
  name_en: [261, 468],
  formula: [469, 605],
  cas: [606, 672],
  remark: [673, 800],
};

const file_name_1 =
  "增补列入《中国现有化学物质名录》的4种符合要求的化学物质（2026年第1批 总第14批）.pdf";
const file_name_2 =
  "列入《中国现有化学物质名录》的482种符合要求的已登记新化学物质（2026年第1批 总第16批）.pdf";

const input_path_1 = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2026-08-04__000014672_2026-00265",
  file_name_1,
);
const input_path_2 = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2026-08-04__000014672_2026-00265",
  file_name_2,
);

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");

// serial ids in this PDF are printed as "1.", "2." ...
const removeTrailingDot = (text: string) => text.replace(/\.$/, "");

const substance_table_1 = await pdfCenteredTableReader({
  file_path: input_path_1,
  from_page: 1,
  after_from_page_y_axis: 275,
  to_page: 1,
  before_to_page_y_axis: 510,
  table_columns: column_range_1,
  line_height: 13.6,
  row_start_column: "serial_id",
  no_space_columns: ["serial_id", "formula", "cas"],
  each_page_y_axis_range: [120, 510],
});

const substance_table_2 = await pdfCenteredTableReader({
  file_path: input_path_2,
  from_page: 8,
  after_from_page_y_axis: 120,
  to_page: 63,
  before_to_page_y_axis: 510,
  table_columns: column_range_2,
  line_height: 13.6,
  row_start_column: "serial_id",
  // remark (新用途环境管理范围) wraps over several lines, join them without a space
  no_space_columns: ["serial_id", "formula", "cas", "remark"],
  each_page_y_axis_range: [120, 510],
});

for (const row of [...substance_table_1, ...substance_table_2]) {
  row["serial_id"] = removeTrailingDot(row["serial_id"]!);
}
tableRowValidator(substance_table_1);
tableRowValidator(substance_table_2);

const formatRows = (
  rows: Record<string, string>[],
  file_name: string,
): IECSC_Record[] =>
  rows.map((row) => {
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
        synonym_cn: splitSynonyms(removeWhitespace(row["synonym_cn"] ?? "")),
        synonym_en: splitSynonyms(row["synonym_en"]),
        formula: removeWhitespace(row["formula"]!),
        use_control: [],
        remark: removeWhitespace(row["remark"] ?? ""),
      },
      source: {
        ...source_base,
        file_name,
        page_number: row["page_number"]!,
        file_serial_number: removeWhitespace(row["serial_id"]!),
      },
    };

    return record;
  });

// the two attachments are merged, tell them apart by source.file_name
const formatted_substance_table = [
  ...formatRows(substance_table_1, file_name_1),
  ...formatRows(substance_table_2, file_name_2),
];

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2026-08-04__000014672_2026-00265",
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(
  `Finished extracting substance table from ${input_path_1} and ${input_path_2}`,
);
