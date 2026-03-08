/**
 * Utility for merging translated structured content with original content.
 *
 * Problem: GPT translates enum/categorical values (e.g., priority: 'high' → 'hoch')
 * which breaks template rendering that relies on exact English string matches.
 *
 * Solution: After merging translated content over original, recursively restore
 * enum field values from the original content so templates always see English enums.
 */

/** Fields known to contain enum/categorical values that must stay in English */
const ENUM_FIELDS = new Set([
  'priority',
  'status',
  'severity',
  'sentiment',
  'qualification',
  'influence',
  'callType',
  'category',
  'overallStatus',
  'type',
]);

/**
 * Recursively walks the translated object and restores enum field values
 * from the original, so templates always receive English enum strings.
 *
 * - For object fields in ENUM_FIELDS: copies the original value
 * - For arrays: recurses into each element (matched by index)
 * - For nested objects: recurses into children
 */
function preserveEnumFields<T>(translated: T, original: T): T {
  if (
    !translated ||
    !original ||
    typeof translated !== 'object' ||
    typeof original !== 'object'
  ) {
    return translated;
  }

  // Handle arrays — recurse into each element
  if (Array.isArray(translated) && Array.isArray(original)) {
    return translated.map((item, i) =>
      i < original.length ? preserveEnumFields(item, original[i]) : item,
    ) as T;
  }

  const result = { ...translated } as Record<string, unknown>;
  const orig = original as Record<string, unknown>;

  for (const key of Object.keys(result)) {
    if (!(key in orig)) continue;

    if (ENUM_FIELDS.has(key) && typeof orig[key] === 'string') {
      // Restore original enum value
      result[key] = orig[key];
    } else if (
      typeof result[key] === 'object' &&
      result[key] !== null &&
      typeof orig[key] === 'object' &&
      orig[key] !== null
    ) {
      // Recurse into nested objects/arrays
      result[key] = preserveEnumFields(result[key], orig[key]);
    }
  }

  return result as T;
}

/**
 * Merges translated structured content with original content.
 *
 * 1. Spreads original as base (fills any fields GPT dropped)
 * 2. Spreads translated over it (applies translations)
 * 3. Preserves the `type` discriminator from original
 * 4. Restores enum fields from original so templates work correctly
 */
export function mergeTranslatedContent<T extends Record<string, unknown>>(
  original: T,
  translated: T,
): T {
  // Base merge: original fills gaps, translated overrides
  const merged = { ...original, ...translated };

  // Preserve the type discriminator for OutputRenderer template matching
  if ('type' in original) {
    (merged as Record<string, unknown>).type = (original as Record<string, unknown>).type;
  }

  // Restore enum fields that GPT may have translated
  return preserveEnumFields(merged, original);
}
