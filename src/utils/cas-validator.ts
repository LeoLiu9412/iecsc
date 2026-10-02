const cas_regexp = /^\d{2,7}-\d{2}-\d$/;

/**
 * To validate if a given string is a valid CAS number (format only).
 */
export function casValidator(cas: string) {
  return cas_regexp.test(cas);
}

/**
 * To validate the check digit of a CAS number: the digits before it, counted from the right and
 * multiplied by 1, 2, 3 ..., sum up to a number whose last digit is the check digit.
 */
export function casChecksumValidator(cas: string) {
  if (!casValidator(cas)) return false;

  const digits = cas.replaceAll("-", "");
  const check_digit = Number(digits.slice(-1));
  const sum = [...digits.slice(0, -1)]
    .reverse()
    .reduce((acc, digit, i) => acc + Number(digit) * (i + 1), 0);

  return sum % 10 === check_digit;
}

/**
 * The note to attach to a record whose CAS number is well-formed but fails the check digit.
 * The CAS number itself is kept as published, empty when there is nothing to note.
 */
export function casChecksumNote(cas: string) {
  return casValidator(cas) && !casChecksumValidator(cas)
    ? "cas is invalid"
    : "";
}
