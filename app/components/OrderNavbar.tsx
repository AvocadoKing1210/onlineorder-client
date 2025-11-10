'use client'

import { useState } from 'react'
import { Menu, X, User, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { config } from '@/lib/config'
import { useAuth } from '@/lib/auth-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthDialog } from '@/components/AuthDialog'

interface OrderNavbarProps {
  onCartClick?: () => void
  cartItemCount?: number
}

export default function OrderNavbar({ onCartClick, cartItemCount = 0 }: OrderNavbarProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  // Filter out "Order" from menu items
  const menuItems = config.navigation.menuItems.filter(
    item => item.sectionId !== 'order'
  )

  const handleNavigation = (sectionId: string) => {
    if (sectionId === 'order') {
      // Shouldn't happen since we filter it out, but just in case
      return
    } else {
      // Navigate to home and scroll to section
      router.push(`/#${sectionId}`)
    }
    setIsMobileMenuOpen(false)
  }

  const handleLogoClick = () => {
    router.push('/')
  }

  return (
    <>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 h-16 sm:h-20"
        data-testid="order-navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div 
            className="font-display text-xl sm:text-2xl cursor-pointer text-foreground"
            onClick={handleLogoClick}
            data-testid="navbar-logo"
          >
            {config.navigation.logo}
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <button
                key={item.sectionId}
                onClick={() => handleNavigation(item.sectionId)}
                className="text-sm tracking-widest uppercase text-foreground/80 hover:text-foreground transition-colors"
                data-testid={`nav-${item.sectionId}`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Desktop Account/Auth Button - Only avatar when logged in */}
            {isAuthenticated && user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAuthDialogOpen(true)}
                className="h-8 w-8 rounded-full hover:bg-muted/50"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'Account'}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAuthDialogOpen(true)}
                className="text-sm tracking-widest uppercase text-foreground/80 hover:text-foreground"
              >
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            )}
          </div>

          {/* Mobile Right Side - Cart, Auth, Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Cart Button */}
            {onCartClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCartClick}
                className="relative h-9 w-9"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            )}
            
            {/* Auth Avatar (when logged in) */}
            {isAuthenticated && user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAuthDialogOpen(true)}
                className="h-9 w-9 rounded-full hover:bg-muted/50"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'Account'}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            )}
            
            {/* Hamburger Button */}
            <button
              className="p-2 text-foreground/80 hover:text-foreground transition-colors relative"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <Menu 
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                  }`}
                />
                <X 
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen 
              ? 'max-h-96 opacity-100 translate-y-0' 
              : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="flex flex-col px-6 py-4 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.sectionId}
                onClick={() => handleNavigation(item.sectionId)}
                className="text-left text-sm tracking-widest uppercase text-foreground/80 hover:text-foreground transition-all duration-200 py-2 transform hover:translate-x-2"
                data-testid={`nav-${item.sectionId}-mobile`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Mobile Sign In Button (only show if not logged in) */}
            {!isAuthenticated && (
              <button
                onClick={() => {
                  setIsAuthDialogOpen(true)
                  setIsMobileMenuOpen(false)
                }}
                className="text-left text-sm tracking-widest uppercase text-foreground/80 hover:text-foreground transition-all duration-200 py-2 transform hover:translate-x-2"
              >
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Dialog */}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </>
  )
}

