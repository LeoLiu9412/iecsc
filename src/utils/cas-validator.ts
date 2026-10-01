const cas_regexp = /^\d{2,7}-\d{2}-\d$/;

/**
 * To validate if a given string is a valid CAS number.
 */
export function casValidator(cas: string) {
  return cas_regexp.test(cas);
}
