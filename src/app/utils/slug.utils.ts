/**
 * Utility functions for URL slug generation and management
 */

/**
 * Convert a string to a URL-friendly slug
 * @param text The text to convert
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Generate a unique slug by appending ID if needed
 * @param name The product name
 * @param id The product ID (to ensure uniqueness)
 * @returns Unique slug
 */
export function generateProductSlug(name: string, id: number): string {
  const baseSlug = generateSlug(name);
  return `${baseSlug}-${id}`;
}

/**
 * Extract product ID from slug
 * @param slug The slug containing ID
 * @returns Product ID or null if not found
 */
export function extractProductIdFromSlug(slug: string): number | null {
  if (!slug) return null;
  
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  const id = parseInt(lastPart, 10);
  return isNaN(id) ? null : id;
}
