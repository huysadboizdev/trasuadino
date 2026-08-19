/**
 * Utilities for Vietnamese Dong (VNĐ) currency formatting and input handling.
 */

/**
 * Format raw number or string into Vietnamese standard thousands separator format (e.g. 600000 -> 600.000).
 * Returns empty string if value is empty/null/undefined.
 */
export function formatVNDInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  
  // Extract all numeric digits
  const rawDigits = String(value).replace(/\D/g, "");
  if (!rawDigits) return "";

  // Convert to BigInt or Number to remove leading zeros if any, but preserve "0" if single digit
  const numericString = String(BigInt(rawDigits));
  
  // Format with dots as thousands separator (vi-VN style)
  return numericString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Parse a formatted string (e.g. "600.000" or "600,000" or "600000") into a raw numeric integer.
 * Returns empty string "" if no valid digits are found.
 */
export function parseVNDInput(formatted: string | null | undefined): number | "" {
  if (formatted === null || formatted === undefined || formatted === "") return "";
  const rawDigits = String(formatted).replace(/\D/g, "");
  if (!rawDigits) return "";
  const num = Number(rawDigits);
  return isNaN(num) ? "" : num;
}

/**
 * Calculate the new caret (cursor) position when an input value changes with dot formatting.
 * This prevents the cursor from jumping to the end of the text input during real-time formatting.
 */
export function calculateNewCursorPosition(
  oldValue: string,
  newValue: string,
  oldCursorPos: number
): number {
  // Count how many raw digits appeared before the old cursor position
  const digitsBeforeCursor = oldValue
    .slice(0, oldCursorPos)
    .replace(/\D/g, "").length;

  // Find the new cursor position in the formatted string corresponding to the same digit count
  let newCursorPos = 0;
  let digitsCounted = 0;

  for (let i = 0; i < newValue.length; i++) {
    if (/\d/.test(newValue[i])) {
      digitsCounted++;
    }
    newCursorPos = i + 1;
    if (digitsCounted === digitsBeforeCursor) {
      break;
    }
  }

  return newCursorPos;
}
