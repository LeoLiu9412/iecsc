import { file } from "bun";
import _1json from "../../../../source/2020-10-15__000014672_2020-01314/1.json";
import _3json from "../../../../source/2020-10-15__000014672_2020-01314/3.json";
import type {
  ChemicalSubstance,
  IECSC_Record,
} from "../../../types/record.type";
import path from "path";
import { CONSTANTS } from "../../../../constants";
import { casChecksumNote, casValidator } from "../../../utils/cas-validator";

type JsonType = {
  序号: number;
  中文名称: string;
  英文名称: string;
  分子式: string;
  CAS号或流水号: string;
  环境管理类别: string;
  备注: string;
};

const json1: JsonType[] = _1json;
const json3: JsonType[] = _3json;

const source_base = {
  publish_name: "关于增补《中国现有化学物质名录》的公告",
  publish_date: "2020-10-15",
  publish_serial_number: "000014672/2020-01314",
  link: "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202010/t20201022_804385.html",
  page_number: "1",
  file_serial_number: "",
} satisfies Omit<IECSC_Record["source"], "file_name">;

// 1.json and 3.json come from different attachments, tell them apart by file_name
const source_1: IECSC_Record["source"] = {
  ...source_base,
  file_name:
    "列入《中国现有化学物质名录》的10种符合要求的《新化学物质环境管理办法》（国家环境保护总局令第17号）下已登记新化学物质",
};

const source_3: IECSC_Record["source"] = {
  ...source_base,
  file_name:
    "列入《中国现有化学物质名录》的18种符合要求的《新化学物质环境管理办法》（环境保护部令第7号）下已登记新化学物质",
};

const formatRecords = (
  json: JsonType[],
  source: IECSC_Record["source"],
): IECSC_Record[] =>
  json.map((record) => {
    const is_cas_valid = casValidator(record.CAS号或流水号);
    const cas_note = casChecksumNote(record.CAS号或流水号);

    const record_to_add: IECSC_Record = {
      kind: "chemical-substance",
      note: cas_note,
      record: {
        cas: is_cas_valid ? record.CAS号或流水号 : "",
        serial_number: is_cas_valid ? "" : record.CAS号或流水号,
        name_cn: record.中文名称,
        synonym_cn: [],
        name_en: record.英文名称,
        synonym_en: [],
        formula: record.分子式,
        remark: record.备注,
        use_control: record.环境管理类别 ? [record.环境管理类别] : [],
      } satisfies ChemicalSubstance,
      source: { ...source },
    };

    record_to_add.source.file_serial_number = record.序号.toString();

    return record_to_add;
  });

const combined_json = [
  ...formatRecords(json1, source_1),
  ...formatRecords(json3, source_3),
];

await file(
  path.join(
    CONSTANTS.OUTPUT_FOLDER_PATH,
    "2020-10-15__000014672_2020-01314",
    "substance_table.json",
  ),
).write(JSON.stringify(combined_json));

console.log(`Finished extracting substance table from json`);
