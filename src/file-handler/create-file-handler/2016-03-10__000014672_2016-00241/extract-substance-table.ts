import { pdfTableReader } from "../../../pdf/table-reader";
import path from "path";
import type { TableColumnRange } from "../../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../../pdf/table-row-validator";
import { CONSTANTS } from "../../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../../types/record.type";
import { casValidator } from "../../../utils/cas-validator";
import { splitSynonyms } from "../../../utils/split-synonyms";

// link: https://www.mee.gov.cn/gkml/hbb/bgg/201603/t20160315_332884.htm

const column_range: TableColumnRange = {
  serial_id: [88, 105],
  name_cn: [108, 282],
  synonym_cn: [283, 316],
  name_en: [316, 480],
  synonym_en: [481, 519],
  formula: [520, 590],
  cas: [591, 660],
  category: [661, 712],
  remark: [713, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2016-03-10__000014672_2016-00241",
  "31种符合要求的已登记新化学物质.pdf",
);

const substance_table = await pdfTableReader({
  file_path: input_path,
  from_page: 1,
  after_from_page_y_axis: 250,
  // the class table starts below the substance table on page 4
  to_page: 4,
  before_to_page_y_axis: 260,
  table_columns: column_range,
  line_height: 13.6,
  no_space_columns: ["serial_id", "formula", "cas"],
  // skip the repeated table header (above) and the page number (below)
  each_page_y_axis_range: [120, 520],
});

tableRowValidator(substance_table);

// these columns never contain whitespace, any in the PDF text is a layout artifact
const removeWhitespace = (text: string) => text.replace(/\s+/g, "");

const formatted_substance_table = substance_table.map((row) => {
  const cas = removeWhitespace(row["cas"]!);
  const is_valid_cas = casValidator(cas);

  const record: IECSC_Record = {
    kind: "chemical-substance",
    record: {
      cas: is_valid_cas ? cas : "",
      serial_number: is_valid_cas ? "" : cas,
      name_cn: row["name_cn"]!,
      // a line starting right after a line ending in a comma loses its space, e.g. "acid,1,1’-azobis-"
      name_en: row["name_en"]!.replace(/([a-z]),(?=\d)/g, "$1, "),
      synonym_cn: splitSynonyms(row["synonym_cn"]),
      synonym_en: splitSynonyms(row["synonym_en"]),
      formula: removeWhitespace(row["formula"]!),
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
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(`Finished extracting substance table from ${input_path}`);
