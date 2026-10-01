import { test, expect } from "bun:test";
import { file } from "bun";
import path from "path";
import { CONSTANTS } from "../constants";
import type { ChemicalSubstance, IECSC_Record } from "../src/types/record.type";

const output_file_path = path.join(
  CONSTANTS.OUTPUT_FOLDER_PATH,
  "2013-01-14__000014672_2013-00075",
  "substance_table.json",
);

const substance_table_json: IECSC_Record[] =
  await file(output_file_path).json();

test("total records", () => {
  expect(substance_table_json.length).toBe(42342);
});

test("first record", () => {
  const target_record = substance_table_json[0];
  console.log(target_record);

  expect(target_record?.kind === "chemical-substance").toBe(true);
  expect(target_record?.source.file_name).toBe("中国现有化学物质名录.pdf");
  expect(target_record?.source.file_serial_number).toBe("1");
  expect(target_record?.source.page_number).toBe("3");

  const record = target_record?.record as ChemicalSubstance;
  expect(record.cas).toBe("68307-89-1");
  expect(record.serial_number).toBe("");
  expect(record.name_cn).toBe("吖丙啶的均聚物与氯甲基环氧乙烷的反应产物");
  expect(record.synonym_cn).toEqual([]);
  expect(record.name_en).toBe(
    "Aziridine, homopolymer, reaction products with epichlorohydrin",
  );
  expect(record.synonym_en).toEqual([
    "Polyethyleneimine, epichlorohydrin condensate",
    "Polyethylenepolyamine, epichlorohydrin condensate",
    "Polyethylenepolyamine, epichlorohydrin reaction product",
    "Polyethylenimine, epichlorohydrin adduct",
  ]);
  expect(record.formula).toBe("(C3H5ClO·C2H5N)x");
});
