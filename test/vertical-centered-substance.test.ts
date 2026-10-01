import { test, expect } from "bun:test";
import { file } from "bun";
import path from "path";
import { CONSTANTS } from "../constants";
import type { ChemicalSubstance, IECSC_Record } from "../src/types/record.type";
import { casValidator } from "../src/utils/cas-validator";
import { findRecordBySerialId } from "../src/utils/find-record-by-serial-id";

const output_file_path = path.join(
  CONSTANTS.OUTPUT_FOLDER_PATH,
  "2020-12-21__000014672_2020-01856",
  "substance_table.json",
);

const substance_table_json: IECSC_Record[] =
  await file(output_file_path).json();

test("total records", () => {
  expect(substance_table_json.length).toBe(238);
});

test("every row starts at its own serial id", () => {
  // vertically centered cells must not make two rows merge or one row split
  substance_table_json.forEach((record, index) => {
    expect(record.source.file_serial_number).toBe((index + 1).toString());
  });
});

test("first record", () => {
  const target_record = substance_table_json[0];

  expect(target_record?.kind === "chemical-substance").toBe(true);
  expect(target_record?.source.file_name).toBe(
    "列入《中国现有化学物质名录》的238种符合增补要求的化学物质.pdf",
  );
  expect(target_record?.source.file_serial_number).toBe("1");
  expect(target_record?.source.page_number).toBe("1");

  const record = target_record?.record as ChemicalSubstance;
  expect(record.cas).toBe("5891-21-4");
  expect(record.serial_number).toBe("");
  expect(record.name_cn).toBe("5-氯-2-戊酮");
  expect(record.synonym_cn).toEqual(["氯代戊酮"]);
  expect(record.name_en).toBe("5-Chloro-2-pentanone");
  expect(record.synonym_en).toEqual(["1-Chloro pentanone"]);
  expect(record.formula).toBe("C5H9ClO");
});

test("vertically centered row: serial id sits below the first line (serial 5)", () => {
  const target_record = findRecordBySerialId("5", substance_table_json);
  const record = target_record.record as ChemicalSubstance;

  expect(target_record.source.page_number).toBe("1");
  expect(record.cas).toBe("28721-07-5");
  expect(record.name_cn).toBe(
    "10,11-二氢-10-氧代-5H-二苯并[b,f]氮杂环庚三烯-5-甲酰胺",
  );
  expect(record.name_en).toBe(
    "5H-Dibenz[b,f]azepine-5-carboxamide, 10,11-dihydro-10-oxo-",
  );
  expect(record.synonym_cn).toEqual(["奥卡西平"]);
  expect(record.synonym_en).toEqual(["Oxcarbazepine"]);
  expect(record.formula).toBe("C15H12N2O2");
});

test("subscripts do not add spaces (serial 7)", () => {
  const record = findRecordBySerialId("7", substance_table_json)
    .record as ChemicalSubstance;

  expect(record.cas).toBe("12005-25-3");
  expect(record.name_cn).toBe("铝钙氧化物硫酸盐(Al6Ca4O12(SO4))");
  expect(record.name_en).toBe("Aluminum calcium oxide sulfate(Al6Ca4O12(SO4))");
  expect(record.formula).toBe("Al6Ca4O12(SO4)");
});

test("synonyms split by half-width and full-width semicolons", () => {
  const full_width_cn = findRecordBySerialId("7", substance_table_json)
    .record as ChemicalSubstance;
  expect(full_width_cn.synonym_cn).toEqual(["硫代铝酸钙", "硫铝酸钙"]);

  const full_width_en = findRecordBySerialId("10", substance_table_json)
    .record as ChemicalSubstance;
  expect(full_width_en.synonym_cn).toEqual(["酮亮氨酸钙", "α-酮代亮氨酸钙"]);
  expect(full_width_en.synonym_en).toEqual([
    "α-Ketoleucine, calcium salt",
    "Calcium 4-methyl-2-oxovalerate",
  ]);

  const target_record = findRecordBySerialId("207", substance_table_json);
  const record = target_record.record as ChemicalSubstance;
  expect(target_record.source.page_number).toBe("23");
  expect(record.cas).toBe("13749-94-5");
  expect(record.synonym_cn).toEqual(["灭多威肟", "甲硫基乙醛肟"]);
  expect(record.synonym_en).toEqual([
    "Methomyl-Oxime",
    "Methylthio acetaldoxime",
  ]);
});

test("empty formula stays empty", () => {
  for (const serial_id of ["6", "8", "138", "154", "193", "200"]) {
    const record = findRecordBySerialId(serial_id, substance_table_json)
      .record as ChemicalSubstance;
    expect(record.formula).toBe("");
  }
});

test("invalid CAS number becomes serial_number", () => {
  for (const [serial_id, serial_number] of [
    ["87", "9577"],
    ["138", "9583"],
    ["154", "9584"],
  ] as const) {
    const record = findRecordBySerialId(serial_id, substance_table_json)
      .record as ChemicalSubstance;
    expect(record.cas).toBe("");
    expect(record.serial_number).toBe(serial_number);
  }
});

test("multi-line cells stay in their own row (serial 154)", () => {
  const target_record = findRecordBySerialId("154", substance_table_json);
  const record = target_record.record as ChemicalSubstance;

  expect(target_record.source.page_number).toBe("18");
  expect(record.name_cn).toBe(
    "C8-22的饱和脂肪酸或者C18-22的不饱和脂肪酸和蔗糖的反应组成物",
  );
  expect(record.synonym_cn).toEqual(["蔗糖脂肪酸酯"]);
  expect(record.synonym_en).toEqual(["Sucrose fatty acid esters"]);
});

test("last record", () => {
  const target_record = substance_table_json.at(-1)!;
  const record = target_record.record as ChemicalSubstance;

  expect(target_record.source.file_serial_number).toBe("238");
  expect(target_record.source.page_number).toBe("27");
  expect(record.cas).toBe("1638666-22-4");
  expect(record.name_cn).toBe(
    "[3-[2-[8-[[4-氯-6-(苯氨基)-1,3,5-三嗪-2-基]氨基]-1-(羟基-κO)-3,6-二磺基-2-萘]二氮烯基-κN1]-4-(羟基-κO)-1,5-萘二磺酸(6-)]铜酸盐(4-)",
  );
  expect(record.formula).toBe("C29H14ClCuN7O14S4");
});

test("all CAS numbers are valid", () => {
  for (const { record } of substance_table_json) {
    const { cas } = record as ChemicalSubstance;
    if (cas) expect(casValidator(cas)).toBe(true);
  }
});
