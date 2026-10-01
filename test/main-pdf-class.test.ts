import { test, expect } from "bun:test";
import { file } from "bun";
import path from "path";
import { CONSTANTS } from "../constants";
import type { ChemicalClass, IECSC_Record } from "../src/types/record.type";
import { findRecordBySerialId } from "../src/utils/find-record-by-serial-id";

const output_file_path = path.join(
  CONSTANTS.OUTPUT_FOLDER_PATH,
  "2013-01-14__000014672_2013-00075",
  "class_table.json",
);

const class_table_json: IECSC_Record[] = await file(output_file_path).json();

test("total records", () => {
  expect(class_table_json.length).toBe(3270);
});

test("first record", () => {
  const target_record = class_table_json[0];
  console.log(target_record);

  expect(target_record?.kind === "chemical-class").toBe(true);
  expect(target_record?.source.file_name).toBe("中国现有化学物质名录.pdf");
  expect(target_record?.source.file_serial_number).toBe("1");
  expect(target_record?.source.page_number).toBe("4059");

  const record = target_record?.record as ChemicalClass;
  expect(record.serial_number).toBe("8282");
  expect(record.class_name_cn).toBe("3-(4-氨基苯基)-9-取代-9H-咔唑");
  expect(record.class_name_en).toBe(
    "3-(4-Aminophenyl)-9-substituted -9H-carbazole",
  );
});

test("Chinese name and English name both wrap onto a second line (serial 4)", () => {
  const target_record = findRecordBySerialId("4", class_table_json);
  const record = target_record.record as ChemicalClass;

  expect(target_record.source.page_number).toBe("4059");
  expect(record.serial_number).toBe("7083");
  // CJK lines are joined without a space
  expect(record.class_name_cn).toBe(
    "氨基封端的聚芳香树脂聚醚砜与聚醚砜的共聚物",
  );
  // Latin lines are joined with one space
  expect(record.class_name_en).toBe(
    "Amine terminated polyaromatic resin polyetherether sulfone polyether sulfone copolymer",
  );
});

test("only the English name wraps (serial 14)", () => {
  const record = findRecordBySerialId("14", class_table_json)
    .record as ChemicalClass;

  expect(record.serial_number).toBe("9200");
  expect(record.class_name_cn).toBe("氨基和苯亚胺取代的萘甲酰胺");
  expect(record.class_name_en).toBe(
    "Amino substituted phenylimino substituted naphthalenecarboxamide",
  );
});

test("names that wrap onto three lines (serial 17)", () => {
  const record = findRecordBySerialId("17", class_table_json)
    .record as ChemicalClass;

  expect(record.serial_number).toBe("4786");
  expect(record.class_name_cn).toBe(
    "氨基[(磺基苯基)偶氮]苯磺酸钠盐与(次氮基三烷二基)三[w-羟基-聚(氧-1,2-乙二基)]的化合物",
  );
  expect(record.class_name_en).toBe(
    "Arylsulfonic acid, amino[(sulfoaryl)azo]-, sodium salt, compound with (nitrilotrialkyldiyl) tris[hydroxypoly(oxyalkylene)]",
  );
});

test("English name without spaces keeps its punctuation (serial 18)", () => {
  const record = findRecordBySerialId("18", class_table_json)
    .record as ChemicalClass;

  expect(record.serial_number).toBe("7931");
  expect(record.class_name_cn).toBe(
    "4-氨基-[[[磺酰基]苯基]偶氮]-1-萘磺酸单钠盐",
  );
  expect(record.class_name_en).toBe(
    "1-Naphthalenesulfonicacid,4-amino-[[[sulfonyl]phenyl]azo]-, monosodiumsalt",
  );
});

test("two-digit serial ids are not split from the name (serial 10)", () => {
  const record = findRecordBySerialId("10", class_table_json)
    .record as ChemicalClass;

  expect(record.serial_number).toBe("2737");
  expect(record.class_name_cn).toBe("氨基官能团甲基烷基聚硅氧烷");
  expect(record.class_name_en).toBe(
    "Amino-functional methyl-alkyl polysiloxane",
  );
});

test("name containing a hyphenated suffix (serial 16)", () => {
  const record = findRecordBySerialId("16", class_table_json)
    .record as ChemicalClass;

  expect(record.class_name_cn).toBe("氨基环硅氧烷-JCLU168");
  expect(record.class_name_en).toBe("Aminocyclosiloxane - JCLU 168");
});

test("page boundary: last row of 4059 and first row of 4060 (serial 37, 38)", () => {
  const target_37 = findRecordBySerialId("37", class_table_json);
  const target_38 = findRecordBySerialId("38", class_table_json);

  expect(target_37.source.page_number).toBe("4059");
  expect((target_37.record as ChemicalClass).serial_number).toBe("5088");

  // same name as the previous row, but a different record
  expect(target_38.source.page_number).toBe("4060");
  expect((target_38.record as ChemicalClass).serial_number).toBe("5084");
  expect((target_38.record as ChemicalClass).class_name_cn).toBe(
    "氨基甲酸酯改性的聚酯树脂",
  );
  expect((target_38.record as ChemicalClass).class_name_en).toBe(
    "Urethane modified polyester resin",
  );
});

test("three-digit and four-digit serial ids", () => {
  const three_digit = findRecordBySerialId("554", class_table_json);
  expect((three_digit.record as ChemicalClass).serial_number).toBe("559");

  const four_digit = findRecordBySerialId("3000", class_table_json);
  const record = four_digit.record as ChemicalClass;
  expect(four_digit.source.page_number).toBe("4139");
  expect(record.serial_number).toBe("7495");
  expect(record.class_name_cn).toBe("戊基双环五氟苯醚");
  expect(record.class_name_en).toBe("pentylbicyclo pentafluoro phenyl ether");
});

test("last record", () => {
  const target_record = class_table_json.at(-1)!;
  const record = target_record.record as ChemicalClass;

  expect(target_record.source.file_serial_number).toBe("3270");
  expect(target_record.source.page_number).toBe("4147");
  expect(record.serial_number).toBe("3077");
  expect(record.class_name_cn).toBe("唑啉 2");
  expect(record.class_name_en).toBe("Oxazolidine 2");
  expect(record.use_control).toEqual([]);
});

test("file serial numbers are continuous from 1 to 3270", () => {
  const serial_ids = class_table_json.map((r) =>
    Number(r.source.file_serial_number),
  );
  expect(serial_ids).toEqual(Array.from({ length: 3270 }, (_, i) => i + 1));
});

test("every record is a chemical-class with non-empty fields and a numeric, unique serial_number", () => {
  const seen = new Set<string>();

  for (const { kind, record, source } of class_table_json) {
    const r = record as ChemicalClass;
    const id = source.file_serial_number;

    expect(kind, id).toBe("chemical-class");
    expect(r.serial_number, id).toMatch(/^\d+$/);
    expect(r.class_name_cn, id).not.toBe("");
    expect(r.class_name_en, id).not.toBe("");
    expect(seen.has(r.serial_number), id).toBe(false);
    seen.add(r.serial_number);
  }
});

test("names have no leading/trailing or doubled whitespace", () => {
  const bad = class_table_json.filter(({ record }) => {
    const r = record as ChemicalClass;
    return [r.class_name_cn, r.class_name_en].some(
      (t) => t !== t.trim() || /\s{2,}/.test(t),
    );
  });
  expect(bad.map((r) => r.source.file_serial_number)).toEqual([]);
});

test("page header and page number do not leak into records", () => {
  const leaked = class_table_json.filter((r) =>
    /序号|中文类名|英文类名|流水号/.test(JSON.stringify(r.record)),
  );
  expect(leaked.map((r) => r.source.file_serial_number)).toEqual([]);
});

test("page numbers are within range and non-decreasing", () => {
  const pages = class_table_json.map((r) => Number(r.source.page_number));
  expect(Math.min(...pages)).toBe(4059);
  expect(Math.max(...pages)).toBe(4147);
  expect(pages.every((p, i) => i === 0 || p >= pages[i - 1]!)).toBe(true);
});
