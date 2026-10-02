/** Full-width digits and Latin letters (U+FF10–FF19, FF21–FF3A, FF41–FF5A). */
const FULL_WIDTH_ALPHANUMERIC_REGEX = /[０-９Ａ-Ｚａ-ｚ]/g;

/** Offset between a full-width alphanumeric and its ASCII counterpart. */
const FULL_WIDTH_OFFSET = 0xfee0;

/**
 * Convert full-width digits and Latin letters to half-width, e.g. "C６Ｈ５" -> "C6H5".
 * Full-width punctuation is left alone, since it is legitimate in Chinese text.
 * `is_valid` is false when the text had to be converted, so the caller can note the adjustment.
 */
export function toHalfWidthAlphanumeric(text: string) {
  const converted = text.replace(FULL_WIDTH_ALPHANUMERIC_REGEX, (char) =>
    String.fromCharCode(char.charCodeAt(0) - FULL_WIDTH_OFFSET),
  );

  return { text: converted, is_valid: converted === text };
}

/**
 * The note for a column whose text was converted by toHalfWidthAlphanumeric.
 */
export function fullWidthNote(column: string) {
  return `${column} has converted full-width alphanumeric characters to half-width`;
}
