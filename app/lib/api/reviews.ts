/**
 * Reviews API
 * Handles review submission via Cloudflare Worker
 * Also provides functions to fetch reviews from Supabase
 */

import { getAuth0Token } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/auth'

// Types
export interface ReviewSubmissionRequest {
  menu_item_id: string
  rating: number // 1-5
  text?: string // Optional review text
}

export interface Review {
  id: string
  user_id: string
  menu_item_id: string
  rating: number
  text: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  // User profile data (joined from user_profile table)
  user_profile?: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

export interface ReviewResponse {
  id: string
  user_id: string
  menu_item_id: string
  rating: number
  text: string | null
  status: string
  created_at: string
}

/**
 * Get Next.js API route URL for review submission
 * This proxies to Cloudflare Worker with server-side API key
 */
function getReviewSubmitUrl(): string {
  // Use Next.js API route instead of direct Cloudflare Worker
  // The API route handles the API key server-side
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL
    return '/api/reviews/submit'
  }
  // Server-side: construct full URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/reviews/submit`
}

/**
 * Submit review via Next.js API route (which proxies to Cloudflare Worker)
 * 
 * @param request - Review submission request with menu_item_id, rating, and optional text
 * @returns Review response with review details
 */
export async function submitReview(
  request: ReviewSubmissionRequest
): Promise<ReviewResponse> {
  const authToken = await getAuth0Token()
  if (!authToken) {
    throw new Error('Authentication required. Please log in to submit a review.')
  }

  const url = getReviewSubmitUrl()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`, // This will be forwarded by the Next.js API route to Cloudflare Worker
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `Failed to submit review: ${response.status}`)
  }

  return response.json()
}

/**
 * Get reviews for a specific menu item
 * Returns only approved reviews (visible to customers)
 * Includes user profile data (display_name, avatar_url) if available
 */
export async function getMenuItemReviews(menuItemId: string): Promise<Review[]> {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  // Fetch reviews
  const { data: reviews, error } = await supabase
    .from('review')
    .select('*')
    .eq('menu_item_id', menuItemId)
    .eq('status', 'approved') // Only show approved reviews
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }

  if (!reviews || reviews.length === 0) {
    return []
  }

  // Fetch user profiles for all review authors
  // Using public_user_profile view for security (only exposes display_name and avatar_url)
  // If the view doesn't exist, fall back to user_profile table with explicit column selection
  const userIds = [...new Set(reviews.map((r: any) => r.user_id))]
  
  // Try to fetch from secure view first, fallback to table if view doesn't exist
  let profiles: any[] | null = null
  
  // Try the secure view first (recommended)
  const { data: viewProfiles, error: viewError } = await supabase
    .from('public_user_profile')
    .select('id, display_name, avatar_url')
    .in('id', userIds)
  
  if (!viewError && viewProfiles) {
    profiles = viewProfiles
  } else {
    // Fallback to user_profile table (only if view doesn't exist)
    // Explicitly select only safe columns to avoid exposing sensitive data
    const { data: tableProfiles, error: tableError } = await supabase
      .from('user_profile')
      .select('id, display_name, avatar_url')
      .in('id', userIds)
    
    if (tableError) {
      console.warn('Could not fetch user profiles (RLS may be blocking):', tableError)
      console.warn('Consider creating the public_user_profile view for better security')
      // Continue without profile data - reviews will show as anonymous
      profiles = null
    } else {
      profiles = tableProfiles
    }
  }

  // Create a map of user_id -> profile
  const profileMap = new Map(
    (profiles || []).map((profile: any) => [
      profile.id,
      {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
    ])
  )

  // Merge reviews with user profiles
  return reviews.map((review: any) => ({
    ...review,
    user_profile: profileMap.get(review.user_id) || null,
  })) as Review[]
}

/**
 * Get user's own reviews (all statuses)
 * Returns reviews for the authenticated user
 */
export async function getUserReviews(): Promise<Review[]> {
  const { getUser } = await import('@/lib/auth')
  const user = await getUser()
  
  if (!user?.sub) {
    return []
  }

  const supabase = await getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  const { data: reviews, error } = await supabase
    .from('review')
    .select('*')
    .eq('user_id', user.sub)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user reviews:', error)
    return []
  }

  return (reviews || []) as Review[]
}

/**
 * Check if user has already reviewed a menu item
 */
export async function hasUserReviewedMenuItem(menuItemId: string): Promise<boolean> {
  const { getUser } = await import('@/lib/auth')
  const user = await getUser()
  
  if (!user?.sub) {
    return false
  }

  const supabase = await getSupabaseClient()
  if (!supabase) {
    return false
  }

  const { data, error } = await supabase
    .from('review')
    .select('id')
    .eq('user_id', user.sub)
    .eq('menu_item_id', menuItemId)
    .limit(1)

  if (error) {
    console.error('Error checking existing review:', error)
    return false
  }

  return (data?.length || 0) > 0
}

/**
 * Calculate average rating for a menu item
 */
export async function getMenuItemAverageRating(menuItemId: string): Promise<{
  average: number
  count: number
} | null> {
  const reviews = await getMenuItemReviews(menuItemId)
  
  if (reviews.length === 0) {
    return null
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const average = totalRating / reviews.length

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal place
    count: reviews.length,
  }
}

