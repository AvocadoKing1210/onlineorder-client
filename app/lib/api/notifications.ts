import { getSupabaseClientForAPI } from './client'

// Types
export interface Notification {
  id: string
  title: string
  body: string
  audience: 'all_customers' | 'recent_purchasers'
  published_at: string
  expiry_at?: string | null
  created_at: string
  updated_at: string
}

/**
 * Fetch active notifications for customers
 * RLS policies will automatically filter based on:
 * - Authentication status
 * - Audience (all_customers vs recent_purchasers)
 * - Published/expiry dates
 */
export async function getActiveNotifications(): Promise<Notification[]> {
  const supabase = await getSupabaseClientForAPI()
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('notification')
    .select('*')
    .lte('published_at', now)
    .or(`expiry_at.is.null,expiry_at.gt.${now}`)
    .order('published_at', { ascending: false })

  if (error) {
    // Don't throw error - just return empty array if RLS blocks or other issues
    // This allows the app to work even if notifications can't be fetched
    console.warn('Failed to fetch notifications:', error.message)
    return []
  }

  return (data || []) as Notification[]
}

