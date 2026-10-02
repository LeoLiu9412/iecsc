import type {
  ChemicalClass,
  ChemicalSubstance,
  IECSC_Record,
  Source,
} from "../types/record.type";
import * as aq from "arquero";

interface FlattenedSubstanceRecord {
  CAS号: string;
  流水号: string;
  中文名称: string;
  中文别名: string;
  英文名称: string;
  英文别名: string;
  分子式: string;
  环境管理类别: string;
  新用途环境管理范围: string;
  来源: string;
}

interface FlattenedClassRecord {
  流水号: string;
  类别中文名称: string;
  类别英文名称: string;
  环境管理类别: string;
  新用途环境管理范围: string;
  来源: string;
}

export function convertJsonToCsv(iecsc_records: IECSC_Record[]) {
  let csv_string = "";
  let flattened_records: (FlattenedSubstanceRecord | FlattenedClassRecord)[] =
    [];
  // Chemical substance
  if (iecsc_records[0] && iecsc_records[0].kind === "chemical-substance") {
    flattened_records = iecsc_records.map((iecsc_record) => {
      const record = iecsc_record.record as ChemicalSubstance;
      return {
        CAS号: record.cas,
        流水号: record.serial_number,
        中文名称: record.name_cn,
        英文名称: record.name_en,
        中文别名: record.synonym_cn.join("; "),
        英文别名: record.synonym_en.join("; "),
        分子式: record.formula,
        环境管理类别: record.use_control.join("; "),
        新用途环境管理范围: record.remark,
        来源: iecsc_record.source.link,
      };
    });
  }
  // Chemical class
  else if (iecsc_records[0] && iecsc_records[0].kind === "chemical-class") {
    flattened_records = iecsc_records.map((iecsc_record) => {
      const record = iecsc_record.record as ChemicalClass;
      return {
        流水号: record.serial_number,
        类别中文名称: record.class_name_cn,
        类别英文名称: record.class_name_en,
        环境管理类别: record.use_control.join("; "),
        新用途环境管理范围: record.remark,
        来源: iecsc_record.source.link,
      };
    });
  }

  csv_string = aq.fromJSON(JSON.stringify(flattened_records)).toCSV();
  return csv_string;
}
