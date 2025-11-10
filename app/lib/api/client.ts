import { getSupabaseClient } from '@/lib/auth'

export async function getSupabaseClientForAPI() {
  const client = await getSupabaseClient()
  if (!client) {
    throw new Error('Supabase client not available. Please ensure you are authenticated and Supabase is configured.')
  }
  return client
}

