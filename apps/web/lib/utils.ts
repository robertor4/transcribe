/**
 * Combines class names, filtering out falsy values.
 * A simple alternative to clsx/classnames.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', undefined, 'text-white')
 * // Returns: 'px-4 py-2 bg-blue-500 text-white'
 */
export function cn(
  ...inputs: (string | undefined | null | false)[]
): string {
  return inputs.filter(Boolean).join(' ');
}
