import { file } from "bun";
import _1json from "../../../source/2020-01-03__000014672_2020-00056/1.json";
import _3json from "../../../source/2020-01-03__000014672_2020-00056/3.json";
import type { ChemicalSubstance, IECSC_Record } from "../../types/record.type";
import path from "path";
import { CONSTANTS } from "../../../constants";
import { casValidator } from "../../utils/cas-validator";

type Json1Type = {
  序号: number;
  中文名称: string;
  英文名称: string;
  分子式: string;
  CAS号或流水号: string;
  备注: string;
};

type Json3Type = {
  序号: number;
  中文名称: string;
  英文名称: string;
  分子式: string;
  CAS号: string;
  环境管理类别: string;
  备注: string;
};

const json1: Json1Type[] = _1json;
const json3: Json3Type[] = _3json;

const source = {
  publish_name: "关于增补《中国现有化学物质名录》的公告",
  publish_date: "2020-01-03",
  publish_serial_number: "000014672/2020-00056",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202001/t20200113_758915.html",
  page_number: "1",
  file_name:
    "列入《中国现有化学物质名录》的29种符合要求的《新化学物质环境管理办法》（环境保护部令第7号）下已登记新化学物质",
  file_serial_number: "",
} satisfies IECSC_Record["source"];

const combined_json: IECSC_Record[] = [];

for (const record of json1) {
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
      remark: record.备注,
      use_control: [],
    } satisfies ChemicalSubstance,
    source: { ...source },
  };

  record_to_add.source.file_serial_number = record.序号.toString();

  combined_json.push(record_to_add);
}

for (const record of json3) {
  const record_to_add: IECSC_Record = {
    kind: "chemical-substance",
    record: {
      cas: record.CAS号,
      serial_number: "",
      name_cn: record.中文名称,
      synonym_cn: [],
      name_en: record.英文名称,
      synonym_en: [],
      formula: record.分子式,
      remark: record.备注,
      use_control: [record.环境管理类别],
    } satisfies ChemicalSubstance,
    source: { ...source },
  };

  record_to_add.source.file_serial_number = record.序号.toString();

  combined_json.push(record_to_add);
}

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2020-01-03__000014672_2020-00056",
    "substance_table.json",
  ),
).write(JSON.stringify(combined_json));

console.log(`Finished extracting substance table from json`);
