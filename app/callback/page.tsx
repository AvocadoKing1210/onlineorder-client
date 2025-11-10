'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth0Client } from '@/lib/auth'
import { wasOnOrderPage, clearOrderRouteTracking } from '@/lib/route-tracker'

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const auth0 = await getAuth0Client()
        if (!auth0) {
          setError('Authentication is not configured. Please contact support.')
          setTimeout(() => {
            router.push('/?error=callback')
          }, 3000)
          return
        }
        await auth0.handleRedirectCallback()
        // Check if user should return to order page
        const returnAfterLogin = typeof window !== 'undefined' 
          ? sessionStorage.getItem('returnAfterLogin')
          : null
        
        // Check if we should return to order page
        const shouldReturnToOrder = returnAfterLogin === '/order' || wasOnOrderPage()
        
        if (shouldReturnToOrder) {
          // Clear the tracking since we're redirecting
          clearOrderRouteTracking()
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('returnAfterLogin')
          }
          router.push('/order')
        } else {
          // Clear any tracking and go to home
          clearOrderRouteTracking()
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('returnAfterLogin')
          }
          router.push('/')
        }
      } catch (error) {
        console.error('Error handling callback:', error)
        setError('Authentication failed. Please try again.')
        // Redirect to home with error after a short delay
        setTimeout(() => {
          router.push('/?error=callback')
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing login...</h1>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}

