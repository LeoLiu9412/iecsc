import { file } from "bun";
import _2json from "../../../source/2024-05-20__000014672_2024-00191/2.json";
import type { ChemicalSubstance, IECSC_Record } from "../../types/record.type";
import path from "path";
import { CONSTANTS } from "../../../constants";
import { casValidator } from "../../utils/cas-validator";

type JsonType = {
  序号: number;
  中文名称: string;
  英文名称: string;
  分子式: string;
  CAS号或流水号: string;
  新用途环境管理范围: string;
};

const json2: JsonType[] = _2json;

const source: IECSC_Record["source"] = {
  publish_name:
    "关于已登记新化学物质列入《中国现有化学物质名录》（2024年第1批 总第13批）的公告",
  publish_date: "2024-05-20",
  publish_serial_number: "000014672/2024-00191",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202405/t20240523_1073933.html",
  file_name: "列入《中国现有化学物质名录》的34种符合要求的已登记新化学物质",
  page_number: "1",
  file_serial_number: "",
};

const formatted_records: IECSC_Record[] = json2.map((record) => {
  const is_cas_valid = casValidator(record.CAS号或流水号);

  const record_to_add: IECSC_Record = {
    kind: "chemical-substance",
    record: {
      cas: is_cas_valid ? record.CAS号或流水号 : "",
      serial_number: is_cas_valid ? "" : record.CAS号或流水号,
      name_cn: record.中文名称,
      synonym_cn: [],
      name_en: record.英文名称,
      synonym_en: [],
      formula: record.分子式,
      remark: record.新用途环境管理范围,
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
    "2024-05-20__000014672_2024-00191",
    "substance_table.json",
  ),
).write(JSON.stringify(formatted_records));

console.log(`Finished extracting substance table from json`);
