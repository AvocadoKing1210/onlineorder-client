'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import OrderNavbar from '@/components/OrderNavbar'
import { trackOrderRoute, clearOrderRouteTracking } from '@/lib/route-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Plus, Minus, ShoppingCart, X } from 'lucide-react'

interface MenuItem {
  name: string
  description: string
  price: string
  image: string
}

interface CartItem extends MenuItem {
  quantity: number
}

export default function OrderPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Track that user is on order page
  useEffect(() => {
    if (pathname === '/order') {
      trackOrderRoute()
    }
    // Cleanup: clear tracking when component unmounts (user navigates away via direct link)
    return () => {
      // Only clear if navigating to home directly
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath === '/') {
          clearOrderRouteTracking()
        }
      }
    }
  }, [pathname])

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace('$', ''))
      return total + (price * item.quantity)
    }, 0)
  }

  // Get total items count
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.name === item.name)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  // Remove item from cart
  const removeFromCart = (itemName: string) => {
    setCart(prevCart => prevCart.filter(item => item.name !== itemName))
  }

  // Update item quantity
  const updateQuantity = (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemName)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.name === itemName ? { ...item, quantity } : item
      )
    )
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  return (
    <div className="min-h-screen bg-background">
      <OrderNavbar 
        onCartClick={() => setIsCartOpen(true)}
        cartItemCount={getTotalItems()}
      />
      
      {/* Cart Drawer */}
      <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl sm:text-2xl">
              Your Order
            </DrawerTitle>
            <DrawerDescription>
              {cart.length === 0 
                ? 'Your cart is empty' 
                : `${getTotalItems()} ${getTotalItems() === 1 ? 'item' : 'items'} in your cart`}
            </DrawerDescription>
          </DrawerHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 sm:space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base mb-2">Your cart is empty</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Add items from the menu to get started
                </p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <Card key={item.name} className="border-card-border">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 sm:mb-2 gap-2">
                            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate flex-1">
                              {item.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                              onClick={() => removeFromCart(item.name)}
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => updateQuantity(item.name, item.quantity - 1)}
                              >
                                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => updateQuantity(item.name, item.quantity + 1)}
                              >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                            <span className="font-serif text-base sm:text-lg text-foreground whitespace-nowrap">
                              ${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <DrawerFooter className="gap-3">
              <div className="flex items-center justify-between text-base sm:text-lg px-4">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-display text-xl sm:text-2xl text-foreground">
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-2 px-4 pb-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    // TODO: Implement checkout
                    alert('Checkout functionality coming soon!')
                  }}
                >
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </div>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-2 text-foreground">
                Order Online
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Select items from our menu to add to your order
              </p>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Menu Placeholder */}
          <div className="text-center py-16">
            <p className="text-muted-foreground text-base sm:text-lg">
              Menu coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
