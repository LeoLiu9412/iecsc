import { pdfCenteredTableReader } from "../../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../../pdf/table-row-validator";
import { CONSTANTS } from "../../../../constants";
import { file } from "bun";
import type { IECSC_Record } from "../../../types/record.type";
import { casValidator } from "../../../utils/cas-validator";
import { splitSynonyms } from "../../../utils/split-synonyms";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202005/t20200508_778159.html

const column_range: TableColumnRange = {
  serial_id: [90, 125],
  name_cn: [126, 250],
  name_en: [252, 392],
  synonym_cn: [394, 510],
  synonym_en: [511, 620],
  cas: [621, 685],
  formula: [686, 780],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2020-05-06__000014672_2020-00618",
  "列入《中国现有化学物质名录》的156种符合增补要求的化学物质.pdf",
);

const substance_table = await pdfCenteredTableReader({
  file_path: input_path,
  from_page: 1,
  after_from_page_y_axis: 245,
  to_page: 22,
  before_to_page_y_axis: 510,
  table_columns: column_range,
  line_height: 13.7,
  no_space_columns: ["serial_id", "formula", "cas"],
  each_page_y_axis_range: [120, 510],
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
      synonym_cn: splitSynonyms(removeWhitespace(row["synonym_cn"] ?? "")),
      synonym_en: splitSynonyms(row["synonym_en"]),
      formula: removeWhitespace(row["formula"]!),
      use_control: [],
      remark: "",
    },
    source: {
      publish_name: "关于增补《中国现有化学物质名录》的公告",
      publish_date: "2020-05-06",
      publish_serial_number: "000014672/2020-00618",
      link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202005/t20200508_778159.html",
      file_name:
        "列入《中国现有化学物质名录》的156种符合增补要求的化学物质.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2020-05-06__000014672_2020-00618",
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(`Finished extracting substance table from ${input_path}`);
