import { pdfTableReader } from "../../pdf/table-reader";
import path from "path";
import type { TableColumnRange } from "../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../pdf/table-row-validator";
import { CONSTANTS } from "../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../types/record.type";
import { casValidator } from "../../utils/cas-validator";
import { splitSynonyms } from "../../utils/split-synonyms";

// link: https://www.mee.gov.cn/gkml/hbb/bgg/201301/t20130131_245810.htm

const column_range: TableColumnRange = {
  serial_id: [75, 102],
  name_cn: [107, 240],
  synonym_cn: [242, 304],
  name_en: [313, 509],
  synonym_en: [512, 655],
  formula: [660, 713],
  cas: [717, 769],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2013-01-14__000014672_2013-00075",
  "中国现有化学物质名录.pdf",
);

const substance_table = await pdfTableReader({
  file_path: input_path,
  from_page: 3,
  after_from_page_y_axis: 164,
  to_page: 4058,
  before_to_page_y_axis: 550,
  table_columns: column_range,
  line_height: 15.599,
  no_space_columns: ["serial_id", "formula", "cas"],
  each_page_y_axis_range: [120, 560],
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
      name_cn: row["name_cn"]!,
      name_en: row["name_en"]!,
      synonym_cn: splitSynonyms(row["synonym_cn"]),
      synonym_en: splitSynonyms(row["synonym_en"]),
      formula: removeWhitespace(row["formula"]!),
      use_control: [],
      remark: "",
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
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(`Finished extracting substance table from ${input_path}`);
