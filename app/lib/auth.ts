'use client'

import { createClient } from '@supabase/supabase-js'
import { createAuth0Client, type Auth0Client, type User } from '@auth0/auth0-spa-js'

// Export Auth0Client type for use in other files
export type { Auth0Client, User }

let auth0Client: Auth0Client | null = null
let supabaseClient: ReturnType<typeof createClient> | null = null

/**
 * Check if Auth0 is configured
 * Note: NEXT_PUBLIC_AUTH0_CLIENT_ID is safe to expose - it's a public identifier, not a secret.
 * For Single Page Applications, Auth0 doesn't use client secrets.
 */
export function isAuth0Configured(): boolean {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID
  return !!(domain && clientId)
}

export async function getAuth0Client(): Promise<Auth0Client | null> {
  // Return null if not configured instead of throwing
  if (!isAuth0Configured()) {
    return null
  }

  if (auth0Client) {
    return auth0Client
  }

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!

  try {
    auth0Client = await createAuth0Client({
      domain,
      clientId,
      authorizationParams: {
        redirect_uri: typeof window !== 'undefined' 
          ? window.location.origin + '/callback'
          : process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
        // Enable refresh tokens for automatic token renewal
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE, // Optional: if using API audience
      },
      cacheLocation: 'localstorage',
      // Enable automatic token refresh
      useRefreshTokens: true,
    })

    return auth0Client
  } catch (error) {
    console.error('Error initializing Auth0 client:', error)
    return null
  }
}

export async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  // Ensure we have the required public credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured. Some features may not work.')
    return null
  }

  // Create Supabase client
  // For anonymous users (guests), the client will work without a token
  // RLS policies allow anonymous access to menu data
  // Note: This client works for both authenticated and anonymous users
  // Anonymous users will use the 'anon' role automatically
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      },
  })

  return supabaseClient
}

export async function login(usePopup = false) {
  const auth0 = await getAuth0Client()
  if (!auth0) {
    console.warn('Auth0 is not configured. Please set NEXT_PUBLIC_AUTH0_DOMAIN and NEXT_PUBLIC_AUTH0_CLIENT_ID in your environment variables.')
    return
  }
  
  if (usePopup) {
    // Use popup to avoid page redirect
    try {
      await auth0.loginWithPopup({
        authorizationParams: {
          redirect_uri: typeof window !== 'undefined' 
            ? window.location.origin + '/callback'
            : process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
        },
      })
    } catch (error: any) {
      // If popup is blocked or fails, fallback to redirect
      if (error?.error === 'popup_closed' || error?.error === 'popup_blocked') {
        console.warn('Popup blocked or closed, falling back to redirect')
        await auth0.loginWithRedirect()
      } else {
        throw error
      }
    }
  } else {
    // Use redirect (default behavior)
    await auth0.loginWithRedirect()
  }
}

export async function logout(returnTo?: string) {
  const auth0 = await getAuth0Client()
  if (!auth0) return
  
  // Determine return URL
  let returnUrl = '/'
  if (typeof window !== 'undefined') {
    // Check if we should return to /order
    const wasOnOrder = sessionStorage.getItem('wasOnOrder') === 'true'
    if (wasOnOrder && !returnTo) {
      returnUrl = window.location.origin + '/order'
    } else if (returnTo) {
      returnUrl = returnTo.startsWith('http') ? returnTo : window.location.origin + returnTo
    } else {
      returnUrl = window.location.origin + '/'
    }
  }
  
  await auth0.logout({
    logoutParams: {
      returnTo: returnUrl,
    },
  })
}

export async function getUser(): Promise<User | null> {
  try {
    const auth0 = await getAuth0Client()
    if (!auth0) return null
    const u = await auth0.getUser()
    return u ?? null
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const auth0 = await getAuth0Client()
    if (!auth0) return false
    return await auth0.isAuthenticated()
  } catch (error) {
    return false
  }
}

export async function getUserGroups(): Promise<string[]> {
  try {
    const auth0 = await getAuth0Client()
    if (!auth0) return []
    const claims = await auth0.getIdTokenClaims()
    return (claims?.user_group as string[]) || []
  } catch (error) {
    console.error('Error getting user groups:', error)
    return []
  }
}

export async function getJWTClaims(): Promise<any> {
  try {
    const auth0 = await getAuth0Client()
    if (!auth0) return null
    const claims = await auth0.getIdTokenClaims()
    return claims || null
  } catch (error) {
    console.error('Error getting JWT claims:', error)
    return null
  }
}

/**
 * Get Auth0 ID token as raw JWT string
 * Returns null if user is not authenticated
 */
export async function getAuth0Token(): Promise<string | null> {
  try {
    const auth0 = await getAuth0Client()
    if (!auth0) return null
    
    const isAuth = await auth0.isAuthenticated()
    if (!isAuth) return null
    
    const claims = await auth0.getIdTokenClaims()
    return claims?.__raw || null
  } catch (error) {
    console.error('Error getting Auth0 token:', error)
    return null
  }
}

