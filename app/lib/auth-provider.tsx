'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Auth0Client } from '@auth0/auth0-spa-js'
import { getUser, isAuthenticated as checkAuth, getAuth0Client } from './auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  auth0Client: Auth0Client | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  auth0Client: null,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [auth0Client, setAuth0Client] = useState<Auth0Client | null>(null)

  const refreshAuth = async () => {
    try {
      const client = await getAuth0Client()
      setAuth0Client(client)

      // Only check auth if Auth0 is configured
      if (client) {
        // Check if user is authenticated
        const authenticated = await checkAuth()
        setIsAuthenticated(authenticated)

        if (authenticated) {
          const userData = await getUser()
          setUser(userData)
        } else {
          setUser(null)
        }
      } else {
        // Auth0 not configured - app works without auth
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing auth:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshAuth()
  }, [])

  // Listen for auth state changes (e.g., after popup login)
  useEffect(() => {
    if (typeof window === 'undefined' || !auth0Client) return

    const handleFocus = () => {
      // Refresh auth when window regains focus (popup might have closed)
      // Small delay to ensure Auth0 SDK has updated localStorage
      setTimeout(() => {
        refreshAuth()
      }, 500)
    }

    // Listen for focus events (popup closes and main window regains focus)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [auth0Client])

  // Periodic token refresh to ensure tokens stay valid
  // Refresh every 30 minutes to keep tokens fresh (tokens expire in 24 hours)
  useEffect(() => {
    if (typeof window === 'undefined' || !auth0Client || !isAuthenticated) return

    const refreshInterval = setInterval(async () => {
      try {
        // Silently refresh the token - Auth0 SDK handles this automatically
        // This ensures tokens are refreshed before expiration
        await auth0Client!.getTokenSilently()
        // Optionally refresh user data
        const userData = await getUser()
        if (userData) {
          setUser(userData)
        }
      } catch (error) {
        // If refresh fails, user might need to re-authenticate
        console.warn('Token refresh failed, user may need to re-login:', error)
        // Don't clear auth state here - let the next API call handle it
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      clearInterval(refreshInterval)
    }
  }, [auth0Client, isAuthenticated])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        auth0Client,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

