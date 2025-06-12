/**
 * Simple className utility to combine class names conditionally
 * Replaces the need for external libraries like clsx or classnames
 * Maintains ASCII theme compatibility
 */

/**
 * Combines class names, filtering out falsy values
 * @param {...(string|Object|Array)} args - Class names or conditional objects
 * @returns {string} Combined class names
 */
export function cn(...args) {
  return args
    .flatMap(arg => {
      if (!arg) return [];
      if (typeof arg === 'string') return [arg];
      if (Array.isArray(arg)) return arg.filter(Boolean);
      if (typeof arg === 'object') {
        return Object.entries(arg)
          .filter(([, condition]) => condition)
          .map(([className]) => className);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Create conditional class name from base and condition
 * @param {string} baseClass - Base class name
 * @param {string} conditionalClass - Class to add when condition is true
 * @param {boolean} condition - Whether to include conditional class
 * @returns {string} Combined class names
 */
export function conditional(baseClass, conditionalClass, condition) {
  return cn(baseClass, condition && conditionalClass);
}

export default cn;