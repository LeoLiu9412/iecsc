import { PDFExtract, type PDFExtractText } from "pdf.js-extract";

interface detectedContentArgs {
  file_path: string;
  page_number: number;
  detective_str: string;
}

/**
 * To detect specific content within a PDF file on a given page.
 * @example detectContent({ file_path: "source/2013-01-14__000014672_2013-00075/中国现有化学物质名录.pdf", page_number: 3, detective_str: "乙烷" });
 */
export async function detectContent(args: detectedContentArgs) {
  const pdf_data = await new PDFExtract().extract(args.file_path, {
    firstPage: args.page_number,
    lastPage: args.page_number,
  });

  const matched_items: PDFExtractText[] = [];

  for (const item of pdf_data.pages[0]?.content || []) {
    if (item.str.trim().includes(args.detective_str)) {
      matched_items.push(item);
    }
  }

  return matched_items;
}
