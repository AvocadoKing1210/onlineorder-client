/**
 * Debug helper for review profile fetching
 * Use this to diagnose why user profiles aren't loading
 */

import { getSupabaseClient } from '@/lib/auth'

export async function debugReviewProfiles(menuItemId: string) {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    console.error('❌ Supabase client not available')
    return
  }

  console.log('🔍 Debugging review profile fetching...')

  // Step 1: Fetch reviews
  console.log('\n1️⃣ Fetching reviews...')
  const { data: reviews, error: reviewError } = await supabase
    .from('review')
    .select('*')
    .eq('menu_item_id', menuItemId)
    .eq('status', 'approved')

  if (reviewError) {
    console.error('❌ Error fetching reviews:', reviewError)
    return
  }

  console.log(`✅ Found ${reviews?.length || 0} reviews`)
  if (reviews && reviews.length > 0) {
    const userIds = [...new Set(reviews.map((r: any) => r.user_id))]
    console.log(`📋 Unique user IDs:`, userIds)

    // Step 2: Try to fetch profiles
    console.log('\n2️⃣ Fetching user profiles...')
    const { data: profiles, error: profileError } = await supabase
      .from('user_profile')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
      console.error('   Code:', profileError.code)
      console.error('   Message:', profileError.message)
      console.error('   Details:', profileError.details)
      console.error('   Hint:', profileError.hint)
      console.log('\n💡 This is likely an RLS (Row Level Security) issue.')
      console.log('   You need to add a policy to allow reading user profiles.')
      console.log('   See: onlineorder-infra/database_setup/user_profile/add_public_read_policy.sql')
      return
    }

    console.log(`✅ Found ${profiles?.length || 0} profiles`)
    if (profiles && profiles.length > 0) {
      console.log('📋 Profiles:', profiles)
    } else {
      console.log('⚠️  No profiles found - users may not have created profiles yet')
    }
  }
}

