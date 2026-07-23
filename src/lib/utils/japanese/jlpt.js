//@ts-nocheck
/**
 * Normalizes and returns JLPT badge metadata.
 * @param {number|string|null|undefined} level
 * @returns {{ label: string, cssClass: string } | null}
 */
export function getJlptBadge(level) {
  if (level === null || level === undefined || level === '') return null;

  let num = level;
  if (typeof level === 'string') {
    num = parseInt(level.replace(/[^0-9]/g, ''), 10);
  }

  if (isNaN(num) || num < 1 || num > 5) return null;

  return {
    label: `N${num}`,
    cssClass: `jlpt-n${num}`
  };
}