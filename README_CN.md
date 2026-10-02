# IECSC 中国现有化学物质名录（合并数据）

简体中文 | [English](README.md)

本项目将**《中国现有化学物质名录》（Inventory of Existing Chemical Substances Produced or Imported in China，IECSC）**合并为机器可读的数据集。

生态环境部以 2013 年的基础名录，加上一系列增补、变更名录的 PDF 公告发布该名录。本项目从这些 PDF 中提取表格，合并成一份化学物质（substance）和化学物质类别（class）数据（JSON 和 CSV），每条记录都可追溯到对应的公告、附件和页码。

## 官方来源

- 官方页面：<https://www.mee.gov.cn/ywgz/gtfwyhxpgl/hxphjgl/wzml/index.shtml>
- 官方最近一次公告：**2026-08-04**（《关于增补和变更〈中国现有化学物质名录〉的公告》）。官方页面没有“最后更新”字段，此日期为页面上最新一条公告的日期。
- 数据整理日期：**2026-10-02**。本数据集包含截至 2026-08-04 的全部公告。

全部 29 份公告（2013-01-14 至 2026-08-04）的 PDF 及提取出的 JSON 保存在 [source/](source/)。

## 下载

[iecsc-data_2026-10-2.zip](https://github.com/LeoLiu9412/iecsc-chemical-substances/raw/main/data/iecsc-data_2026-10-2.zip)（约 5 MB），包含：

| 文件 | 内容 | 记录数 |
|---|---|---|
| `chemical-substance-table.json` / `.csv` | 化学物质 | 43,888 |
| `chemical-class-table.json` / `.csv` | 化学物质类别（以类别名称描述的物质，如聚合物、反应产物等） | 3,691 |

## 数据格式

每个 JSON 文件是一个记录数组：

- `kind`：`chemical-substance` 或 `chemical-class`
- `record`：名录条目内容
  - substance：`cas`、`serial_number`、`name_cn`、`name_en`、`synonym_cn`、`synonym_en`、`formula`、`use_control`、`remark`
  - class：`serial_number`、`class_name_cn`、`class_name_en`、`use_control`、`remark`
- `source`：记录来源，包括公告名称、日期、编号和链接，附件名称 `file_name`、页码 `page_number`、附件内序号 `file_serial_number`
- `note`：对公布内容所做的调整，或未通过校验的值。没有则为空。见[备注说明](#备注说明)。

CSV 文件是同一数据的扁平化版本（中文列名，列表字段合并为一列，`note` 对应“备注”）。

### Substance 样例（带 note）

CAS 号保持与官方原文一致，但未通过 CAS 校验位校验，因此加了标注：

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

### Class 样例

目前没有任何 class 记录带 note，因此这里给出一条普通记录：

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

## 备注说明

数据尽量保持官方原文。`note` 字段记录被调整过或疑似有误的情况（目前共 106 条 substance 记录）：

- `cas is invalid`：CAS 号未通过校验位校验（或格式不正确）。该值与源 PDF 一致，保持原样。
- `... has converted full-width alphanumeric characters to half-width`：`name_cn`、`name_en` 或 `formula` 中的全角字母/数字已转为半角。
- `... has a missing glyph ...`：PDF 字体缺字，提取为私有区字符；已根据英文名称补全，或因多余而删除。

源数据及提取过程中已知的问题记录在 [issue.md](issue.md)。

## 免责声明

本数据为非官方整理。用于法律或合规用途时，请务必以生态环境部的官方公告为准。
