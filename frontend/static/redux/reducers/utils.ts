/**
 * Helper function for retrieving the value of a hidden HTML input element.
 *
 * @param id the id of the hidden HTML input element.
 * @return value of the hidden HTML input element if it exists.
 */
export function getHiddenValue(id: string): string | undefined {
  const hiddenElem: HTMLInputElement | null = document.getElementById(id) as HTMLInputElement;
  if (hiddenElem) {
    if (hiddenElem.value === 'None') {
      return undefined;
    }
    return hiddenElem.value ?? undefined;
  }
  return undefined;
}

export const toBool = (value?: string): boolean => (value ?? '').toLowerCase() === 'true';

/**
 * Convert a string value to a float.
 *
 * @param value the string to convert
 * @param returnUndefined if true, return undefined when the string is empty or missing, 0.0 otherwise.
 * @return the float parsed from the string input or undefined.
 */
export function toFloat(value?: string, returnUndefined = false): number | undefined {
  if (value === undefined && returnUndefined) {
    return undefined;
  }
  if (value) {
    const parsedVal = parseFloat(value);
    if (parsedVal) {
      return parsedVal;
    }
  }
  return 0.0;
}

export const toJson = <T>(value?: string): T => (value ? JSON.parse(value) : {}) as T;
