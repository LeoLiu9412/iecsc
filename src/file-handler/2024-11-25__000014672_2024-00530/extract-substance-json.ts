import { file } from "bun";
import _1json from "../../../source/2024-11-25__000014672_2024-00530/1.json";
import type { ChemicalSubstance, IECSC_Record } from "../../types/record.type";
import path from "path";
import { CONSTANTS } from "../../../constants";
import { casValidator } from "../../utils/cas-validator";
import { splitSynonyms } from "../../utils/split-synonyms";

export interface JsonType {
  序号: number;
  中文名称: string;
  中文别名: string;
  英文名称: string;
  英文别名: string;
  分子式: string;
  CAS号或流水号: string;
}

const json1: JsonType[] = _1json;

const source: IECSC_Record["source"] = {
  publish_name:
    "关于增补《中国现有化学物质名录》（2024年第2批 总第12批）的公告",
  publish_date: "2024-11-25",
  publish_serial_number: "000014672/2024-00530",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202411/t20241129_1097567.html",
  file_name: "列入《中国现有化学物质名录》的6种符合增补要求的化学物质",
  page_number: "1",
  file_serial_number: "",
};

const formatted_records: IECSC_Record[] = json1.map((record) => {
  const is_cas_valid = casValidator(record.CAS号或流水号);
  const synonym_cn = splitSynonyms(record.中文别名);
  const synonym_en = splitSynonyms(record.英文别名);

  const record_to_add: IECSC_Record = {
    kind: "chemical-substance",
    record: {
      cas: is_cas_valid ? record.CAS号或流水号 : "",
      serial_number: is_cas_valid ? "" : record.CAS号或流水号,
      name_cn: record.中文名称,
      synonym_cn,
      name_en: record.英文名称,
      synonym_en,
      formula: record.分子式,
      remark: "",
      use_control: [],
    } satisfies ChemicalSubstance,
    source: { ...source },
  };

  record_to_add.source.file_serial_number = record.序号.toString();

  return record_to_add;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2024-11-25__000014672_2024-00530",
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_records));

console.log(`Finished extracting substance table from json`);
