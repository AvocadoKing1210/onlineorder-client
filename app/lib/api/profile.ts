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
 * Get user profile for authenticated user
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const authToken = await getAuth0Token()
  if (!authToken) {
    return null
  }

  const url = getCloudflareProfileUrl()

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
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
 * Get Cloudflare Worker URL from environment
 */
function getCloudflareProfileUrl(): string {
  const url = process.env.NEXT_PUBLIC_CLOUDFLARE_PROFILE_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_CLOUDFLARE_PROFILE_URL is not configured')
  }
  return url
}

/**
 * Update user profile via Cloudflare Worker
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

  const url = getCloudflareProfileUrl()

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
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
 * Create or update user profile from checkout information via Cloudflare Worker
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

  const url = getCloudflareProfileUrl()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
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

