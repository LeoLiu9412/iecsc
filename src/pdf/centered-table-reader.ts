import { PDFExtract, type PDFExtractText } from "pdf.js-extract";

const CJK_REGEX = /[　-〿㐀-鿿＀-￯]/;

/** A line this close to the column's right edge, without any whitespace, was broken inside a word. */
const FORCED_WRAP_EDGE_TOLERANCE = 8;

interface pdfCenteredTableReaderArgs {
  file_path: string;
  from_page: number;
  after_from_page_y_axis: number;
  to_page: number;
  before_to_page_y_axis: number;
  each_page_y_axis_range?: [number, number];
  table_columns: Record<string | "serial_id", [number, number]>;
  line_height: number;
  /**
   * Start a new row whenever an item shows up in this column, instead of guessing from line spacing.
   * For tables whose cells are vertically centered, so lines of one row are not evenly spaced.
   */
  row_start_column?: string;
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
 * Variant of pdfTableReader for tables whose cells may be vertically centered, or whose text has
 * sub/superscripts, so lines are not reliably one `line_height` apart.
 * - Line spacing is measured from the baseline, ignoring sub/superscripts a fraction of a point off it.
 * - `row_start_column` can mark row boundaries explicitly instead of guessing from line spacing.
 */
export async function pdfCenteredTableReader(args: pdfCenteredTableReaderArgs) {
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

  // y of the last baseline, ignoring sub/superscripts that sit a fraction of a point off it
  let baseline_y = 0;

  // the line currently being read in each column
  let current_lines: Record<string, { text: string; end_x: number }> = {};

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

      const row_start_range = args.row_start_column
        ? args.table_columns[args.row_start_column]
        : undefined;

      const should_scan_next_row = row_start_range
        ? Object.entries(temp_columns).some(
            ([key, text]) => key !== "page_number" && text.trim() !== "",
          ) &&
          item.str.trim() !== "" &&
          item.x >= row_start_range[0] &&
          item.x <= row_start_range[1]
        : prev_item !== null &&
          item.x < prev_item.x &&
          Math.abs(Math.abs(item.y - baseline_y) - args.line_height) >= 0.2;

      if (should_scan_next_row) {
        rows.push(trimColumns(temp_columns));
        temp_columns = { ...columns_template };
        current_lines = {};
      }

      // Arrange the item into the appropriate column based on its x-axis position
      for (const [key, [x_start, x_end]] of Object.entries(
        args.table_columns,
      )) {
        if (item.x >= x_start && item.x <= x_end) {
          const is_new_line = prev_item !== null && item.y - baseline_y > 1;
          const last_line = current_lines[key];

          // a long word has no break opportunity, so the PDF breaks it at the column's right edge
          const is_forced_wrap =
            is_new_line &&
            last_line !== undefined &&
            !/\s/.test(last_line.text.trim()) &&
            x_end - last_line.end_x < FORCED_WRAP_EDGE_TOLERANCE;

          temp_columns[key] =
            is_new_line &&
            !is_forced_wrap &&
            !args.no_space_columns?.includes(key)
              ? joinWrappedText(temp_columns[key]!, item.str)
              : temp_columns[key] + item.str;

          if (is_new_line || !last_line) {
            current_lines[key] = { text: "", end_x: 0 };
          }
          const line = current_lines[key]!;
          line.text += item.str;
          if (item.str.trim()) line.end_x = item.x + item.width;

          // a row belongs to the page where its first item appears
          temp_columns["page_number"] ??= page.info.num.toString();
          break;
        }
      }

      if (Math.abs(item.y - baseline_y) > 1) baseline_y = item.y;
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
