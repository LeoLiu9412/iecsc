import { pdfCenteredTableReader } from "../../pdf/centered-table-reader";
import path from "path";
import type { TableColumnRange } from "../../utils/table-columns-range-calculator";
import { tableRowValidator } from "../../pdf/table-row-validator";
import { CONSTANTS } from "../../../constants";
import { file } from "bun";
import type { ChemicalSubstance, IECSC_Record } from "../../types/record.type";
import { casValidator } from "../../utils/cas-validator";

// link: https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202106/t20210623_841359.html

const column_range: TableColumnRange = {
  serial_id: [48, 78],
  name_cn: [80, 295],
  name_en: [296, 614],
  formula: [615, 712],
  cas: [713, 800],
};

const input_path = path.join(
  CONSTANTS.SOURCE_FOLDER_PATH,
  "2021-06-18__000014672_2021-00488",
  "列入《中国现有化学物质名录》的255种符合要求的《新化学物质环境管理办法》（国家环境保护总局令第17号）下已登记新化学物质.pdf",
);

const substance_table = await pdfCenteredTableReader({
  file_path: input_path,
  from_page: 1,
  after_from_page_y_axis: 270,
  to_page: 31,
  before_to_page_y_axis: 515,
  table_columns: column_range,
  line_height: 13.6,
  row_start_column: "serial_id",
  no_space_columns: ["serial_id", "formula", "cas"],
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
      remark: "",
    },
    source: {
      publish_name: "关于增补《中国现有化学物质名录》的公告",
      publish_date: "2021-06-18",
      publish_serial_number: "000014672/2021-00488",
      link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202106/t20210623_841359.html",
      file_name:
        "列入《中国现有化学物质名录》的255种符合要求的《新化学物质环境管理办法》（国家环境保护总局令第17号）下已登记新化学物质.pdf",
      page_number: row["page_number"]!,
      file_serial_number: removeWhitespace(row["serial_id"]!),
    },
  };

  return record;
});

// serial 49 is printed as "5413-5-8" in the PDF, a typo of the CAS number 5413-05-8
const typo_record = formatted_substance_table.find(
  (r) => r.source.file_serial_number === "49",
);
if (typo_record) {
  const record = typo_record.record as ChemicalSubstance;
  if (record.serial_number === "5413-5-8") {
    record.cas = "5413-05-8";
    record.serial_number = "";
  }
}

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2021-06-18__000014672_2021-00488",
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_substance_table));

console.log(`Finished extracting substance table from ${input_path}`);
