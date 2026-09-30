export type TableColumnRange = {
  [key: string]: [number, number];
};

interface TableColumnsRangeCalculatorArgs {
  pixel_table_column_range: TableColumnRange;
  real_axis_x: number;
  pixel_axis_x: number;
}

/**
 *
 * @param args
 * @returns
 */
export function tableColumnsRangeCalculator(
  args: TableColumnsRangeCalculatorArgs,
) {
  const ratio = args.pixel_axis_x / args.real_axis_x;
  const calculated_column_range = structuredClone(
    args.pixel_table_column_range,
  );

  for (const key in calculated_column_range) {
    const [start, end] = calculated_column_range[key]!;
    calculated_column_range[key] = [start / ratio, end / ratio];
  }

  return calculated_column_range;
}
