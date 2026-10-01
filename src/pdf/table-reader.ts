import { PDFExtract, type PDFExtractText } from "pdf.js-extract";

const CJK_REGEX = /[　-〿㐀-鿿＀-￯]/;

interface pdfTableReaderArgs {
  file_path: string;
  from_page: number;
  after_from_page_y_axis: number;
  to_page: number;
  before_to_page_y_axis: number;
  each_page_y_axis_range?: [number, number];
  table_columns: Record<string | "serial_id", [number, number]>;
  line_height: number;
  /** Columns whose wrapped lines are joined without a space, e.g. formula or CAS number. */
  no_space_columns?: string[];
}

function trimColumns(columns: Record<string, string>) {
  for (const key in columns) {
    columns[key] = columns[key]!.trim();
  }
  return columns;
}

/**
 * Join two pieces of text split by a line break.
 */
function joinWrappedText(prev_text: string, next_text: string) {
  const needs_space =
    prev_text.length > 0 &&
    next_text.length > 0 &&
    !/\s$/.test(prev_text) &&
    !/^\s/.test(next_text) &&
    !CJK_REGEX.test(prev_text.slice(-1)) &&
    !CJK_REGEX.test(next_text.charAt(0));

  return needs_space ? `${prev_text} ${next_text}` : prev_text + next_text;
}

/**
 * To extract table data from a PDF file based on specified column positions and y-axis ranges.
 */
export async function pdfTableReader(args: pdfTableReaderArgs) {
  const pdf_extract = new PDFExtract();

  console.log(`Starting to process file: ${args.file_path}`);

  const pdf_data = await pdf_extract.extract(args.file_path, {
    firstPage: args.from_page,
    lastPage: args.to_page,
  });

  const columns_template: Record<string | "serial_id", string> =
    Object.fromEntries(Object.keys(args.table_columns).map((key) => [key, ""]));

  let temp_columns = { ...columns_template };
  const rows: Record<string | "serial_id", string>[] = [];

  let prev_item: PDFExtractText | null = null;

  for (const page of pdf_data.pages) {
    for (const item of page.content) {
      // skip items outside the specified y-axis range on the first and last pages
      if (
        (page.info.num === args.from_page &&
          item.y < args.after_from_page_y_axis) ||
        (page.info.num === args.to_page && item.y > args.before_to_page_y_axis)
      ) {
        continue;
      }

      // skip items outside the specified y-axis range for each page if provided
      if (
        args.each_page_y_axis_range &&
        (item.y < args.each_page_y_axis_range[0] ||
          item.y > args.each_page_y_axis_range[1])
      ) {
        continue;
      }

      const should_scan_next_row =
        prev_item !== null &&
        item.x < prev_item.x &&
        Math.abs(Math.abs(item.y - prev_item.y) - args.line_height) >= 0.2;

      if (should_scan_next_row) {
        rows.push(trimColumns(temp_columns));
        temp_columns = { ...columns_template };
      }

      // Arrange the item into the appropriate column based on its x-axis position
      for (const [key, [x_start, x_end]] of Object.entries(
        args.table_columns,
      )) {
        if (item.x >= x_start && item.x <= x_end) {
          temp_columns[key] =
            prev_item &&
            prev_item.y < item.y &&
            !args.no_space_columns?.includes(key)
              ? joinWrappedText(temp_columns[key]!, item.str)
              : temp_columns[key] + item.str;

          // a row belongs to the page where its first item appears
          temp_columns["page_number"] ??= page.info.num.toString();
          break;
        }
      }

      prev_item = item;
    }
  }

  rows.push(trimColumns(temp_columns));

  for (let i = 0; i < rows.length - 1; i++) {
    const row = rows[i]!;

    // remove table header line
    if (row["serial_id"] === "序号") {
      rows.splice(i, 1);
      i--;
    }

    // To handle rows across multiple pages
    if (row["serial_id"] === "") {
      const prev_row = rows[i - 1];
      if (!prev_row) continue;

      for (const key in row) {
        // keep the page where the record starts
        if (key === "page_number") continue;
        prev_row[key] = args.no_space_columns?.includes(key)
          ? prev_row[key]! + row[key]
          : joinWrappedText(prev_row[key]!, row[key]!);
      }

      rows.splice(i, 1);
      i--;
    }
  }

  return rows;
}
