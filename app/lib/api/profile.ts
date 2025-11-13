/**
 * User Profile API
 * Handles fetching and updating user profile information
 * Uses Cloudflare Worker for profile operations
 */

import { getUser, getAuth0Token } from '@/lib/auth'

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  phone_number: string | null
  avatar_url: string | null
  preferred_locale: string
  created_at: string
  updated_at: string
}

/**
 * Get user profile for authenticated user via Next.js API route
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const authToken = await getAuth0Token()
  if (!authToken) {
    return null
  }

  const url = getProfileApiUrl()

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`, // This will be forwarded by the Next.js API route to Cloudflare Worker
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `Failed to fetch user profile: ${response.status}`)
  }

  return response.json()
}

/**
 * Get Next.js API route URL for profile operations
 * This proxies to Cloudflare Worker with server-side API key
 */
function getProfileApiUrl(): string {
  // Use Next.js API route instead of direct Cloudflare Worker
  // The API route handles the API key server-side
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL
    return '/api/profile'
  }
  // Server-side: construct full URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/profile`
}

/**
 * Update user profile via Next.js API route (which proxies to Cloudflare Worker)
 */
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'display_name' | 'phone_number' | 'avatar_url' | 'preferred_locale'>>
): Promise<UserProfile> {
  const user = await getUser()
  if (!user?.sub) {
    throw new Error('User not authenticated')
  }

  const authToken = await getAuth0Token()
  if (!authToken) {
    throw new Error('Failed to get authentication token')
  }

  const url = getProfileApiUrl()

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // This will be forwarded by the Next.js API route to Cloudflare Worker
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `Failed to update user profile: ${response.status}`)
  }

  return response.json()
}

/**
 * Create or update user profile from checkout information via Next.js API route
 */
export async function saveProfileFromCheckout(
  name: string,
  email: string,
  phone: string
): Promise<UserProfile> {
  const user = await getUser()
  if (!user?.sub) {
    throw new Error('User not authenticated')
  }

  const authToken = await getAuth0Token()
  if (!authToken) {
    throw new Error('Failed to get authentication token')
  }

  const url = getProfileApiUrl()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // This will be forwarded by the Next.js API route to Cloudflare Worker
    },
    body: JSON.stringify({
        email: email,
        display_name: name,
        phone_number: phone,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `Failed to save profile: ${response.status}`)
  }

  return response.json()
}

