import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse image URL from database (can be a string or JSON array string)
 * Returns the first valid URL from the array, or the string itself if it's a single URL
 */
export function parseImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return null
  }

  try {
    // Try to parse as JSON array
    const parsed = JSON.parse(imageUrl)
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Return the first URL from the array
      return typeof parsed[0] === 'string' ? parsed[0] : null
    }
  } catch {
    // If parsing fails, treat it as a single URL string
    return imageUrl
  }

  return null
}

/**
 * Parse all image URLs from database (can be a string or JSON array string)
 * Returns an array of all valid URLs
 */
export function parseAllImageUrls(imageUrl: string | null | undefined): string[] {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return []
  }

  try {
    // Try to parse as JSON array
    const parsed = JSON.parse(imageUrl)
    if (Array.isArray(parsed)) {
      // Return all URLs from the array
      return parsed.filter(url => typeof url === 'string' && url.trim() !== '')
    }
  } catch {
    // If parsing fails, treat it as a single URL string
    return [imageUrl]
  }

  return []
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false
  }
  
  try {
    new URL(url)
    return true
  } catch {
    // If URL constructor fails, check if it's a relative path starting with /
    return url.startsWith('/')
  }
}
