import { PDFExtract, type PDFExtractText } from "pdf.js-extract";

interface pdfTableReaderArgs {
  file_path: string;
  from_page: number;
  after_from_page_y_axis: number;
  to_page: number;
  before_to_page_y_axis: number;
  table_columns: Record<string, [number, number]>;
  line_height_threshold: number;
}

export async function pdfTableReader(args: pdfTableReaderArgs) {
  const pdf_extract = new PDFExtract();

  const pdf_data = await pdf_extract.extract(args.file_path, {
    firstPage: args.from_page,
    lastPage: args.to_page,
  });

  const columns_template: Record<string, string> = Object.fromEntries(
    Object.keys(args.table_columns).map((key) => [key, ""]),
  );

  let temp_columns = { ...columns_template };
  const rows: Record<string, string>[] = [];

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

      const should_scan_next_row =
        prev_item !== null &&
        item.x < prev_item.x &&
        Math.abs(item.y - prev_item.y) > args.line_height_threshold;

      if (should_scan_next_row) {
        rows.push(temp_columns);
        temp_columns = { ...columns_template };
      }

      // Arrange the item into the appropriate column based on its x-axis position
      for (const [key, [x_start, x_end]] of Object.entries(
        args.table_columns,
      )) {
        if (item.x >= x_start && item.x <= x_end) {
          temp_columns[key] += (temp_columns[key] ? " " : "") + item.str;
          break;
        }
      }

      prev_item = item;
    }
  }

  rows.push(temp_columns);

  return rows;
}
