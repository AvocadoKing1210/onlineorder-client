'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { login, logout } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { User, LogOut } from 'lucide-react'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [wasAuthenticatedOnOpen, setWasAuthenticatedOnOpen] = useState(false)

  // Track if user was already authenticated when dialog opened
  useEffect(() => {
    if (open) {
      setWasAuthenticatedOnOpen(isAuthenticated)
    }
  }, [open, isAuthenticated])

  // Only auto-close if user JUST logged in (wasn't authenticated before, now is)
  useEffect(() => {
    if (isAuthenticated && user && open && !wasAuthenticatedOnOpen && isLoggingIn) {
      // User just completed login - show success briefly then close
      setIsLoggingIn(false)
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 1500) // Give user time to see they're logged in
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, open, wasAuthenticatedOnOpen, isLoggingIn, onOpenChange])
  
  // Reset logging state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsLoggingIn(false)
    }
  }, [open])

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)
      // Use popup to keep user on the same page
      await login(true) // Pass true to use popup instead of redirect
      // If popup succeeds, the auth state will update automatically
      // The dialog will close via the useEffect that watches isAuthenticated
    } catch (error) {
      console.error('Login error:', error)
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout('/order')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-display">
            {isAuthenticated ? 'Account' : 'Sign In'}
          </DialogTitle>
          {isAuthenticated && (
            <DialogDescription className="text-sm">
              Manage your account and preferences
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Separator />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isAuthenticated && user ? (
            // Authenticated State
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/50">
                <div className="flex-shrink-0">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 border-card-border"
                    />
                  ) : (
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-card-border">
                      <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                    {user.name || 'User'}
                  </p>
                  {user.email && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
                className="w-full"
                size="lg"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </Button>

              <Separator />

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Don't have an account? Signing in will create one for you.
                </p>
                <p className="text-xs text-muted-foreground">
                  You can continue browsing without signing in.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

