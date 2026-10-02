# Inventory of Existing Chemical Substances in China (IECSC)

[简体中文](README_CN.md) | English

A merged, machine-readable version of the **Inventory of Existing Chemical Substances Produced or Imported in China (中国现有化学物质名录, IECSC)**.

The Ministry of Ecology and Environment of China (MEE) publishes the inventory as a 2013 base list plus a series of PDF announcements that add or modify entries. This project extracts the tables from those PDFs and merges them into a single dataset of chemical substances and chemical classes (JSON and CSV), with every record traceable to the announcement, file and page it came from.

## Official source

- Official page: <https://www.mee.gov.cn/ywgz/gtfwyhxpgl/hxphjgl/wzml/index.shtml>
- Latest official announcement: **2026-08-04** (《关于增补和变更〈中国现有化学物质名录〉的公告》). The official page has no "last updated" field, so this is the date of its newest entry.
- Data compiled on: **2026-10-02**. This dataset includes all announcements up to 2026-08-04.

The original PDFs/JSON extracts of all 29 announcements (from 2013-01-14 to 2026-08-04) are kept in [source/](source/).

## Download

[iecsc-data_2026-10-2.zip](https://github.com/LeoLiu9412/iecsc-chemical-substances/raw/main/data/iecsc-data_2026-10-2.zip) (~5 MB), containing:

| File | Content | Records |
| --- | --- | --- |
| `chemical-substance-table.json` / `.csv` | Chemical substances | 43,888 |
| `chemical-class-table.json` / `.csv` | Chemical classes (substances described by a class name, e.g. polymers and reaction products) | 3,691 |

## Data format

Each JSON file is an array of records:

- `kind`: `chemical-substance` or `chemical-class`
- `record`: the content of the entry
  - substance: `cas`, `serial_number`, `name_cn`, `name_en`, `synonym_cn`, `synonym_en`, `formula`, `use_control`, `remark`
  - class: `serial_number`, `class_name_cn`, `class_name_en`, `use_control`, `remark`
- `source`: where the record comes from: announcement name, date, serial number and link, attachment `file_name`, `page_number` and `file_serial_number` (row number in that file)
- `note`: adjustments made to the published content, or values that failed validation. Empty when there is none. See [Notes](#notes).

The CSV files are flattened versions of the same data (Chinese column headers, list fields joined, `note` as `备注`).

### Substance example (with a note)

The CAS number is kept exactly as published, but fails CAS check-digit validation, so it is flagged:

```json
{
  "kind": "chemical-substance",
  "note": "cas is invalid",
  "record": {
    "cas": "12239-89-1",
    "serial_number": "",
    "name_cn": "C.I.颜料蓝15:2",
    "name_en": "C.I.Pigment Blue 15:2",
    "synonym_cn": ["酞菁蓝(NCNF稳定α-型)"],
    "synonym_en": [
      "Copper,[C-chloro-29H, 31H-phthalocyaninato(2-)-κN29 ,κN30 ,κN31 ,κN32 ]-",
      "Phthalo Blue(NCNFα-Form)"
    ],
    "formula": "C32H16CuN8/C32H15ClCuN8",
    "use_control": [],
    "remark": ""
  },
  "source": {
    "publish_name": "关于增补《中国现有化学物质名录》的公告",
    "publish_date": "2021-04-16",
    "publish_serial_number": "000014672/2021-00312",
    "link": "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202104/t20210421_829704.html",
    "file_name": "列入《中国现有化学物质名录》的204种符合增补要求的化学物质.pdf",
    "page_number": "21",
    "file_serial_number": "200"
  }
}
```

### Class example

No class record currently has a note, so this is a regular record:

```json
{
  "kind": "chemical-class",
  "note": "",
  "record": {
    "class_name_cn": "苯酚与卤代二芳基醚和多卤代二芳基醚的反应产物的卤化物",
    "class_name_en": "Phenol, reaction products with halogeno(diaryl ether) and polyhalogeno(diaryl ether), halogenated",
    "serial_number": "9561",
    "use_control": ["一般类"],
    "remark": ""
  },
  "source": {
    "publish_name": "关于增补《中国现有化学物质名录》的公告",
    "publish_date": "2020-10-15",
    "publish_serial_number": "000014672/2020-01314",
    "link": "https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202010/t20201022_804385.html",
    "file_name": "列入《中国现有化学物质名录》的18种符合要求的《新化学物质环境管理办法》（环境保护部令第7号）下已登记新化学物质",
    "page_number": "1",
    "file_serial_number": "1"
  }
}
```

## Notes

Published content is kept as-is wherever possible. The `note` field records the cases where it was adjusted or looks wrong (106 substance records at present):

- `cas is invalid`: the CAS number fails check-digit validation (or is malformed). The value matches the source PDF and is kept unchanged.
- `... has converted full-width alphanumeric characters to half-width`: full-width letters/digits in `name_cn`, `name_en` or `formula` were converted to half-width.
- `... has a missing glyph ...`: the PDF font lacked a glyph, so the character was extracted as a private-use character. It was filled in from the English name, or removed if stray.

Known problems in the source data and the extraction are listed in [issue.md](issue.md) (Chinese).

## Disclaimer

This is an unofficial compilation. For legal or compliance use, always check the official announcements from the MEE.
