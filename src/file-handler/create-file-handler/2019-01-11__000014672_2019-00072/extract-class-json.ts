import { file } from "bun";
import _2json from "../../../../source/2019-01-11__000014672_2019-00072/2.json";
import type { ChemicalClass, IECSC_Record } from "../../../types/record.type";
import path from "path";
import { CONSTANTS } from "../../../../constants";

export interface JSONType {
  序号: number;
  中文类名: string;
  英文类名: string;
  流水号: number;
  环境管理类别: string;
  备注: string;
}

const json2: JSONType[] = _2json;

const source: IECSC_Record["source"] = {
  publish_name: "关于增补《中国现有化学物质名录》的公告",
  publish_date: "2019-01-14",
  publish_serial_number: "000014672/2019-00072",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/201901/t20190117_689881.html",
  file_name: "列入《中国现有化学物质名录》的28种符合要求的已登记新化学物质",
  page_number: "1",
  file_serial_number: "",
};

const formatted_records = json2.map((record) => {
  const record_to_add: IECSC_Record = {
    kind: "chemical-class",
    record: {
      class_name_cn: record.中文类名,
      class_name_en: record.英文类名,
      serial_number: record.流水号.toString(),
      use_control: record.环境管理类别 ? [record.环境管理类别] : [],
      remark: record.备注,
    } satisfies ChemicalClass,
    source: { ...source },
  };

  record_to_add.source.file_serial_number = record.序号.toString();

  return record_to_add;
});

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2019-01-11__000014672_2019-00072",
    "class_table.json",
  ),
).write(JSON.stringify(formatted_records));

console.log(`Finished extracting class table from json`);
