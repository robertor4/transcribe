/**
 * Utility functions for safely displaying AI-generated content.
 * AI models don't always strictly follow JSON schemas and may return objects
 * where strings are expected. These helpers convert any value to a displayable format.
 */

/**
 * Safely converts any value to a displayable string.
 * Handles objects that AI might return instead of strings.
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Handle common object patterns from AI
    if (obj.name && obj.reason) return `${obj.name}: ${obj.reason}`;
    if (obj.name && obj.role) return `${obj.name} (${obj.role})`;
    if (obj.name && obj.description) return `${obj.name}: ${obj.description}`;
    if (obj.title && obj.description) return `${obj.title}: ${obj.description}`;
    if (obj.item && obj.detail) return `${obj.item}: ${obj.detail}`;
    if (obj.action) return String(obj.action);
    if (obj.text) return String(obj.text);
    if (obj.content) return String(obj.content);
    if (obj.summary) return String(obj.summary);
    if (obj.description) return String(obj.description);
    if (obj.value) return String(obj.value);
    if (obj.message) return String(obj.message);
    if (obj.name) return String(obj.name);
    if (obj.title) return String(obj.title);
    if (obj.label) return String(obj.label);
    // Fallback
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }

  return String(value);
}

/**
 * Safely converts any value to a displayable string or undefined.
 * Returns undefined for null/undefined/empty values.
 * Useful for optional fields that shouldn't render if empty.
 */
export function safeStringOrUndefined(value: unknown): string | undefined {
  const result = safeString(value);
  return result === '' ? undefined : result;
}
