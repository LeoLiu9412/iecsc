import { file } from "bun";
import _1json from "../../../../source/2022-03-03__000014672_2022-00084/1.json";
import type { ChemicalClass, IECSC_Record } from "../../../types/record.type";
import path from "path";
import { CONSTANTS } from "../../../../constants";

export interface JSONType {
  序号: number;
  中文类名: string;
  英文类名: string;
  流水号: number;
  新用途环境管理范围: string;
}

const json1: JSONType[] = _1json;

const source: IECSC_Record["source"] = {
  publish_name:
    "关于已登记新化学物质列入《中国现有化学物质名录》（2022年第1批 总第9批）的公告",
  publish_date: "2022-03-03",
  publish_serial_number: "000014672/2022-00084",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202203/t20220307_970789.html",
  file_name: "列入《中国现有化学物质名录》的18种符合要求的已登记新化学物质",
  page_number: "1",
  file_serial_number: "",
};

const formatted_records = json1.map((record) => {
  const record_to_add: IECSC_Record = {
    kind: "chemical-class",
    record: {
      class_name_cn: record.中文类名,
      class_name_en: record.英文类名,
      serial_number: record.流水号.toString(),
      use_control: [],
      remark: record.新用途环境管理范围,
    } satisfies ChemicalClass,
    source: { ...source },
  };

  record_to_add.source.file_serial_number = record.序号.toString();

  return record_to_add;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2022-03-03__000014672_2022-00084",
    "class_table.json",
  ),
).write(JSON.stringify(formatted_records));

console.log(`Finished extracting class table from json`);
