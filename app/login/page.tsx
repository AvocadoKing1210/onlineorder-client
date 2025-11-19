'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { login, logout } from '@/lib/auth'
import { wasOnOrderPage, getReturnPath } from '@/lib/route-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { User, LogIn, LogOut, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { config } from '@/lib/config'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Check if user came from order page
  const returnTo = getReturnPath()
  const fromOrder = wasOnOrderPage()

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)
      // Store return path before login redirect
      if (fromOrder && typeof window !== 'undefined') {
        sessionStorage.setItem('returnAfterLogin', '/order')
      }
      await login()
    } catch (error) {
      console.error('Login error:', error)
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      // If user was on order page, redirect back there after logout
      const returnUrl = fromOrder ? '/order' : undefined
      await logout(returnUrl)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    // If user came from order, go back to order
    if (fromOrder) {
      router.push('/order')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromOrder ? 'Back to Order' : 'Back to Home'}
          </Button>

          <Card className="border-card-border shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-display">
                {isAuthenticated ? 'Account' : 'Sign In'}
              </CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? 'Manage your account and preferences'
                  : 'Sign in to access your account and order history'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : isAuthenticated && user ? (
                // Authenticated State
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      {user.picture ? (
                        <div className="relative h-16 w-16 rounded-full border-2 border-card-border overflow-hidden">
                          <Image
                            src={user.picture}
                            alt={user.name || 'User'}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-card-border">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {user.name || 'User'}
                      </p>
                      {user.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground">
                        {user.email || 'Not provided'}
                      </p>
                    </div>
                    {user.nickname && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Username</p>
                        <p className="font-medium text-foreground">
                          {user.nickname}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                // Unauthenticated State
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Sign in to access your account, view order history, and save your preferences.
                    </p>
                  </div>

                  <Button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 border-transparent"
                    size="lg"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Don&apos;t have an account? Signing in will create one for you.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can continue browsing without signing in.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          {!isAuthenticated && (
            <Card className="mt-6 border-card-border">
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Why sign in?
                    </h3>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Save your favorite items</li>
                      <li>Track your order history</li>
                      <li>Faster checkout experience</li>
                      <li>Personalized recommendations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}

