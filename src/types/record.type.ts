export type Source = {
  publish_name: string;
  publish_date: string;
  publish_serial_number: string;
  link: string;
  file_name: string;
  page_number: string;
  file_serial_number: string;
};

export type ChemicalSubstance = {
  cas: string;
  serial_number: string;
  name_cn: string;
  name_en: string;
  synonym_cn: string[];
  synonym_en: string[];
  formula: string;
  use_control: string[];
  remark: string;
};

export type ChemicalClass = {
  serial_number: string;
  class_name_cn: string;
  class_name_en: string;
  use_control: string[];
  remark: string;
};

export type IECSC_Record = {
  kind: "chemical-substance" | "chemical-class";
  record: ChemicalSubstance | ChemicalClass;
  source: Source;
};
