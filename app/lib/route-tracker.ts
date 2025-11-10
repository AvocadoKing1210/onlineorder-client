'use client'

/**
 * Route tracking utilities to handle redirects back to /order
 * when user logs out or navigates away
 */

const ORDER_ROUTE = '/order'
const STORAGE_KEY = 'wasOnOrder'

/**
 * Mark that user is currently on the order page
 */
export function trackOrderRoute() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, 'true')
  }
}

/**
 * Clear the order route tracking
 */
export function clearOrderRouteTracking() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Check if user was on the order page
 */
export function wasOnOrderPage(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

/**
 * Get the return path - returns /order if user was on order page, otherwise null
 */
export function getReturnPath(): string | null {
  if (wasOnOrderPage()) {
    return ORDER_ROUTE
  }
  return null
}

