import { file } from "bun";
import _1json from "../../../../source/2018-11-22__000014672_2018-03437/1.json";
import _3json from "../../../../source/2018-11-22__000014672_2018-03437/3.json";
import type { ChemicalClass, IECSC_Record } from "../../../types/record.type";
import path from "path";
import { CONSTANTS } from "../../../../constants";

type Json1Type = {
  序号: string;
  中文类名: string;
  英文类名: string;
  流水号: string;
  环境管理类别: string;
  备注: string;
};

type Json3Type = {
  序号: number;
  中文类名: string;
  英文类名: string;
  流水号: number;
  备注: string;
};

const json1: Json1Type[] = _1json;
const json3: Json3Type[] = _3json;

const combined_json: IECSC_Record[] = [];

const source: IECSC_Record["source"] = {
  publish_name: "关于增补《中国现有化学物质名录》的公告",
  publish_date: "2018-11-22",
  publish_serial_number: "000014672/2018-03437",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/201811/t20181130_676779.html",
  file_name:
    "列入《中国现有化学物质名录》的2种符合要求的《新化学物质环境管理办法》（环境保护部令 第7号）下已登记新化学物质",
  page_number: "1",
  file_serial_number: "",
};

for (const record of json1) {
  const record_to_add: IECSC_Record = {
    kind: "chemical-class",
    record: {
      class_name_cn: record.中文类名,
      class_name_en: record.英文类名,
      serial_number: record.流水号,
      use_control: [record.环境管理类别],
      remark: record.备注,
    } satisfies ChemicalClass,
    source: { ...source },
  };

  record_to_add.source.file_serial_number = record.序号;

  combined_json.push(record_to_add);
}

for (const record of json3) {
  const record_to_add: IECSC_Record = {
    kind: "chemical-class",
    record: {
      class_name_cn: record.中文类名,
      class_name_en: record.英文类名,
      serial_number: record.流水号.toString(),
      use_control: [],
      remark: record.备注,
    } satisfies ChemicalClass,
    source: { ...source },
  };

  record_to_add.source.file_serial_number = record.序号.toString();

  combined_json.push(record_to_add);
}

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2018-11-22__000014672_2018-03437",
    "class_table.json",
  ),
).write(JSON.stringify(combined_json));

console.log(`Finished extracting class table from json`);
