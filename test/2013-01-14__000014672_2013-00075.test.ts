import { test, expect } from "bun:test";
import { file } from "bun";
import path from "path";
import { CONSTANTS } from "../constants";
import type { ChemicalSubstance, IECSC_Record } from "../src/types/record.type";
import { casValidator } from "../src/utils/cas-validator";

const output_file_path = path.join(
  CONSTANTS.OUTPUT_FOLDER_PATH,
  "2013-01-14__000014672_2013-00075",
  "substance_table.json",
);

const substance_table_json: IECSC_Record[] =
  await file(output_file_path).json();

const findBySerialId = (serial_id: string) => {
  const target_record = substance_table_json.find(
    (r) => r.source.file_serial_number === serial_id,
  );
  expect(target_record).toBeDefined();
  return target_record!;
};

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

test("name_cn with Greek letters", () => {
  // 8'-阿朴-β,ψ-胡萝卜醛
  const target_record = findBySerialId("15");
  const record = target_record.record as ChemicalSubstance;

  expect(record.cas).toBe("1107-26-2");
  expect(record.name_cn).toContain("β");
  expect(record.name_cn).toContain("ψ");
  expect(record.name_en).toBe("8'-Apo-β, ψ-carotenal");
  expect(record.formula).toBe("C30H40O");
  expect(target_record.source.page_number).toBe("5");
});

test("name with special symbols and full-width punctuation", () => {
  const target_record = findBySerialId("2910");
  const record = target_record.record as ChemicalSubstance;

  expect(record.cas).toBe("104098-48-8");
  expect(record.name_cn).toBe(
    "(±)-3-吡啶甲酸 2-[4，5-二氢-4-甲基-4-(1-甲基乙基)-5-氧代-1H-咪唑-2-基]-5-甲基酯",
  );
  expect(record.name_en).toBe(
    "3-Pyridinecarboxylic acid, 2-[4,5-dihydro-4-methyl-4-(1-methylethyl)-5-oxo-1H-imidazol-2-yl]-5-methyl-(±)-",
  );
});

test("non-empty synonym_cn", () => {
  const single = findBySerialId("3").record as ChemicalSubstance;
  expect(single.name_cn).toBe("吖啶");
  expect(single.synonym_cn).toEqual(["氮蒽"]);

  const multiple = findBySerialId("6").record as ChemicalSubstance;
  expect(multiple.synonym_cn).toEqual([
    "α-酮戊二酸",
    "α-氧代戊二酸",
    "α-胶酮酸",
  ]);
  expect(multiple.synonym_en).toEqual(["α-Ketoglutaric acid"]);
});

test("synonym_en that wraps across several lines", () => {
  const record = findBySerialId("31").record as ChemicalSubstance;

  expect(record.synonym_en).toEqual([
    "Armoise",
    "Armoise absolute",
    "Armoise oil",
    "French armoise absolute",
    "Lanyana oil",
    "Mugwort oil",
  ]);
});

test("invalid CAS number becomes serial_number", () => {
  for (const [serial_id, serial_number] of [
    ["2918", "0102"], // leading zero must be kept
    ["4001", "3274"],
    ["4010", "7426"],
  ] as const) {
    const record = findBySerialId(serial_id).record as ChemicalSubstance;
    expect(record.cas).toBe("");
    expect(record.serial_number).toBe(serial_number);
  }
});

test("page 450: rows without borders (serial 3999, 4000)", () => {
  const target_3999 = findBySerialId("3999");
  const record_3999 = target_3999.record as ChemicalSubstance;

  expect(target_3999.source.page_number).toBe("450");
  expect(record_3999.cas).toBe("107097-75-6");
  expect(record_3999.serial_number).toBe("");
  expect(record_3999.name_cn).toBe(
    "2-丙烯酸钠与 1-乙烯基-2-吡咯烷酮、2-甲基-2-[(1-氧-2-丙烯基)氨基]-1-丙磺酸单钠盐及 2-丙烯酰胺的聚合物",
  );
  expect(record_3999.name_en).toBe(
    "2-Propenoic acid, sodium salt, polymer with 1-ethenyl-2-pyrrolidinone, 2-methyl-2-[(1-oxo-2-propenyl)amino]-1-propanesulfonic acid monosodium salt and 2-propenamide",
  );
  expect(record_3999.formula).toBe(
    "(C3H4O2Na)w·(C6H9NO)x·(C5H9NO)y·(C7H3NSO4Na)z",
  );

  // last row of the page, must not take anything from the next page
  const target_4000 = findBySerialId("4000");
  const record_4000 = target_4000.record as ChemicalSubstance;

  expect(target_4000.source.page_number).toBe("450");
  expect(record_4000.cas).toBe("20069-66-3");
  expect(record_4000.serial_number).toBe("");
  expect(record_4000.name_en).toBe("2-Propenoic acid, 1-naphthalenyl ester");
});

test("page 451: first row of the page (serial 4001)", () => {
  const target_record = findBySerialId("4001");
  const record = target_record.record as ChemicalSubstance;

  expect(target_record.source.page_number).toBe("451");
  expect(record.cas).toBe("");
  expect(record.serial_number).toBe("3274");
  expect(record.name_cn).toBe("丙烯酸（2-[2-(1-萘氧基)乙氧基]乙基）酯");
  expect(record.name_en).toBe("2-[2-(1-Naphthyloxy)ethoxy]ethyl acrylate");
});

test("record that continues on the next page (serial 2909)", () => {
  const target_record = findBySerialId("2909");
  const record = target_record.record as ChemicalSubstance;

  expect(target_record.source.page_number).toBe("331");
  expect(record.cas).toBe("873-69-8");
  expect(record.synonym_en.slice(-2)).toEqual([
    "2-Pyridylaldoxime",
    "Pyrine-2-aldoximate",
  ]);
});

test("last record", () => {
  const target_record = substance_table_json.at(-1)!;
  const record = target_record.record as ChemicalSubstance;

  expect(target_record.source.file_serial_number).toBe("42342");
  expect(target_record.source.page_number).toBe("4058");
  expect(record.cas).toBe("");
  expect(record.serial_number).toBe("2900");
  expect(record.name_cn).toBe("左旋肉碱左旋酒石酸盐");
  expect(record.name_en).toBe("l-Carnitine l-tartrate");
  expect(record.synonym_cn).toEqual([]);
  expect(record.synonym_en).toEqual([]);
  expect(record.formula).toBe("");
});

test("file serial numbers are continuous from 1 to 42342", () => {
  const serial_ids = substance_table_json.map((r) =>
    Number(r.source.file_serial_number),
  );
  expect(serial_ids).toEqual(Array.from({ length: 42342 }, (_, i) => i + 1));
});

test("every record has exactly one of cas / serial_number, and cas is valid", () => {
  for (const { record, source } of substance_table_json) {
    const r = record as ChemicalSubstance;
    const id = source.file_serial_number;

    expect(Boolean(r.cas) !== Boolean(r.serial_number), id).toBe(true);
    if (r.cas) expect(casValidator(r.cas), id).toBe(true);
  }
});

test("page header text does not leak into records", () => {
  const leaked = substance_table_json.filter((r) =>
    /或流水号|序号|中文名称|英文名称|分子式/.test(JSON.stringify(r.record)),
  );
  expect(leaked.map((r) => r.source.file_serial_number)).toEqual([]);
});

test("page numbers are within range and non-decreasing", () => {
  const pages = substance_table_json.map((r) => Number(r.source.page_number));
  expect(Math.min(...pages)).toBe(3);
  expect(Math.max(...pages)).toBe(4058);
  expect(pages.every((p, i) => i === 0 || p >= pages[i - 1]!)).toBe(true);
});

test("English name broken inside a word at the column's right edge", () => {
  // 2911: "...-2" / "H-1-benzopyran..." was broken between "2" and "H"
  const record_2911 = findBySerialId("2911").record as ChemicalSubstance;
  expect(record_2911.name_en).toBe(
    "3-Pyridinecarboxylic acid, 3,4-dihydro-2,5,7,8-tetramethyl-2-(4,8,12-trimethyltridecyl)-2H-1-benzopyran-6-yl ester",
  );

  const record_47 = findBySerialId("47").record as ChemicalSubstance;
  expect(record_47.name_en).toContain("diimino]bis[4-hydroxy");
  expect(record_47.name_en).toEndWith("2-naphthalenesulfonate");

  const record_7109 = findBySerialId("7109").record as ChemicalSubstance;
  expect(record_7109.name_en).toContain("4-hydroxy-3-[(2-hydroxy-5-nitrophenyl)azo]");
  expect(record_7109.name_en).toContain("naphthalenedisulfonato(4-)");

  const record_27385 = findBySerialId("27385").record as ChemicalSubstance;
  expect(record_27385.name_en).toContain("trimethylcyclohexane copolymer");
});

test("synonym_en broken inside a word at the column's right edge", () => {
  const record = findBySerialId("31964").record as ChemicalSubstance;

  expect(record.synonym_en).toEqual([
    "Benzenesulfonic acid, 2,2'-(1,2-ethenediyl)-5-[[4-bis(2-hydroxyethyl)amino-6-methoxy-1,3,5-triazin-2-yl]amino]-5'-[[6-methoxy-4-(2-sulfoethyl)amino-1,3,5-triazin-2-yl]amino]bis-, trisodium salt",
  ]);
});
