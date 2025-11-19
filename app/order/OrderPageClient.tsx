'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import OrderNavbar from '@/components/OrderNavbar'
import { trackOrderRoute, clearOrderRouteTracking } from '@/lib/route-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { Plus, Minus, ShoppingCart, X, AlertCircle, Search, SlidersHorizontal } from 'lucide-react'
import { MenuCategorySection } from '@/components/menu/MenuCategorySection'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MenuItemDialog } from '@/components/menu/MenuItemDialog'
import {
  getMenuCategories,
  getMenuItems,
  type MenuItemWithCategory,
  type MenuItemWithModifiers,
  type MenuCategory,
} from '@/lib/api/menu'
import { submitOrder, generateIdempotencyKey, saveGuestOrderReference, type CartItem as OrderCartItem } from '@/lib/api/orders'
import { getUser, isAuthenticated, getAuth0Token } from '@/lib/auth'
import { isValidUrl, parseImageUrl } from '@/lib/utils'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog'
import type { CheckoutFormData } from '@/components/checkout/CheckoutForm'
import { saveProfileFromCheckout } from '@/lib/api/profile'
import { NotificationBanner } from '@/components/NotificationBanner'

// Cart Types with Modifiers Support
interface CartItemModifier {
  modifier_group_id: string
  modifier_group_name: string
  modifier_option_id: string
  modifier_option_name: string
  price_delta: number
}

interface CartItem {
  id: string // Unique ID for this cart item (combination of menu_item_id + modifiers)
  menu_item_id: string
  menu_item_name: string
  menu_item_description: string | null
  menu_item_image_url: string | null
  unit_price: number
  quantity: number
  modifiers: CartItemModifier[]
  notes?: string
  // Calculated
  line_total: number // (unit_price + sum of modifier price_deltas) * quantity
}

// LocalStorage key for cart persistence
const CART_STORAGE_KEY = 'order_system_cart'

// Helper functions for localStorage operations
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    // Validate that parsed data is an array
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    return []
  }
}

const saveCartToStorage = (cart: CartItem[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
    // Handle quota exceeded error gracefully
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, cart not saved')
    }
  }
}

interface OrderPageClientProps {
  initialCategories: MenuCategory[]
  initialMenuItems: MenuItemWithCategory[]
}

export default function OrderPageClient({ initialCategories, initialMenuItems }: OrderPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCartLoaded, setIsCartLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromStorage()
    if (savedCart.length > 0) {
      setCart(savedCart)
    }
    setIsCartLoaded(true)
  }, [])

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    // Only save after initial load to avoid overwriting with empty cart
    if (isCartLoaded) {
      saveCartToStorage(cart)
    }
  }, [cart, isCartLoaded])

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

  // Fetch menu categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menuCategories'],
    queryFn: getMenuCategories,
    initialData: initialCategories,
  })

  // Fetch menu items
  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => getMenuItems(),
    initialData: initialMenuItems,
  })

  // Filter menu items based on search query and category - memoized for performance
  const filteredMenuItems = useMemo(() => {
    let filtered = menuItems

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category_id === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query)
        const descriptionMatch = item.description?.toLowerCase().includes(query) || false
        return nameMatch || descriptionMatch
      })
    }

    return filtered
  }, [menuItems, selectedCategory, searchQuery])

  // Group filtered items by category - memoized for performance
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MenuItemWithCategory[]> = {}
    filteredMenuItems.forEach((item) => {
      const categoryId = item.category_id
      if (!grouped[categoryId]) {
        grouped[categoryId] = []
      }
      grouped[categoryId].push(item)
    })
    return grouped
  }, [filteredMenuItems])

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.line_total, 0)
  }

  // Get total items count
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Generate unique ID for cart item based on menu item and modifiers
  const generateCartItemId = (
    menuItemId: string,
    modifiers: CartItemModifier[]
  ): string => {
    const modifierKey = modifiers
      .map((m) => `${m.modifier_group_id}:${m.modifier_option_id}`)
      .sort()
      .join(',')
    return `${menuItemId}:${modifierKey}`
  }

  // Add item to cart with modifiers
  const handleAddToCart = (
    item: MenuItemWithModifiers,
    selectedModifiers: Record<string, string[]>,
    quantity: number = 1
  ) => {
    const basePrice = parseFloat(item.price)

    // Build modifiers array
    const modifiers: CartItemModifier[] = []
    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      const group = item.modifier_groups.find((g) => g.id === groupId)
      if (group) {
        optionIds.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId)
          if (option) {
            modifiers.push({
              modifier_group_id: groupId,
              modifier_group_name: group.name,
              modifier_option_id: optionId,
              modifier_option_name: option.name,
              price_delta: parseFloat(option.price_delta),
            })
          }
        })
      }
    })

    // Calculate modifier price delta
    const modifierTotal = modifiers.reduce(
      (sum, m) => sum + m.price_delta,
      0
    )
    const unitPrice = basePrice + modifierTotal

    // Generate unique ID
    const cartItemId = generateCartItemId(item.id, modifiers)

    setCart((prevCart) => {
      const existingItem = prevCart.find((ci) => ci.id === cartItemId)
      if (existingItem) {
        // Update quantity and recalculate line_total
        return prevCart.map((ci) =>
          ci.id === cartItemId
            ? {
                ...ci,
                quantity: ci.quantity + quantity,
                line_total: unitPrice * (ci.quantity + quantity),
              }
            : ci
        )
      }

      // Add new item - parse image URL from JSON array if needed
      const parsedImageUrl = parseImageUrl(item.image_url)
      const newItem: CartItem = {
        id: cartItemId,
        menu_item_id: item.id,
        menu_item_name: item.name,
        menu_item_description: item.description,
        menu_item_image_url: parsedImageUrl,
        unit_price: unitPrice,
        quantity: quantity,
        modifiers,
        line_total: unitPrice * quantity,
      }

      return [...prevCart, newItem]
    })

    setIsCartOpen(true)
  }

  // Handle item selection (open dialog) - memoized with useCallback
  const handleItemSelect = useCallback((item: MenuItemWithCategory) => {
    setSelectedItemId(item.id)
    setIsDialogOpen(true)
  }, [])

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId))
  }

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            line_total: item.unit_price * quantity,
          }
        }
        return item
      })
    )
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    // Clear from localStorage as well
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_STORAGE_KEY)
      } catch (error) {
        console.error('Error clearing cart from localStorage:', error)
      }
    }
  }

  // Handle checkout button click - open checkout dialog - memoized with useCallback
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checkout',
        variant: 'destructive',
      })
      return
    }

    setIsCheckoutDialogOpen(true)
  }, [cart.length, toast])

  // Handle checkout form submission
  const handleCheckoutSubmit = async (formData: CheckoutFormData) => {
    setIsSubmitting(true)

    try {
      // Check if user is authenticated
      const authenticated = await isAuthenticated()
      let authToken: string | undefined
      let userId: string | undefined

      if (authenticated) {
        // Get Auth0 token for authenticated users
        const user = await getUser()
        if (user?.sub) {
          userId = user.sub
          authToken = await getAuth0Token() || undefined
        }
      } else {
        // Guest checkout - generate guest user_id
        userId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }

      // Save profile if requested (for logged-in users)
      if (authenticated && formData.save_to_profile && !formData.use_existing_profile) {
        try {
          await saveProfileFromCheckout(
            formData.customer_name,
            formData.customer_email,
            formData.customer_phone
          )
        } catch (error) {
          console.error('Error saving profile:', error)
          // Don't block order submission if profile save fails
        }
      }

      // Convert cart items to API format
      const orderCart: OrderCartItem[] = cart.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        modifiers: item.modifiers.map(m => ({
          modifier_option_id: m.modifier_option_id,
        })),
        notes: item.notes,
      }))

      // Submit order with customer information
      const response = await submitOrder(
        {
          cart: orderCart,
          mode: formData.mode,
          special_instructions: formData.special_instructions,
          idempotency_key: generateIdempotencyKey(),
          user_id: userId,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
        },
        authToken
      )

      // Success!
      toast({
        title: 'Order submitted successfully!',
        description: `Order #${response.reference_number} - Total: $${response.total_amount}`,
      })

      // Save reference number for guest users (for order history)
      if (response.reference_number && !authenticated) {
        saveGuestOrderReference(response.reference_number)
      }

      // Clear cart and close dialogs
      clearCart()
      setIsCartOpen(false)
      setIsCheckoutDialogOpen(false)

      // Navigate to order tracking page
      if (response.reference_number) {
        router.push(`/order/track/${response.reference_number}`)
      }
    } catch (error: any) {
      console.error('Error submitting order:', error)
      toast({
        title: 'Failed to submit order',
        description: error.message || 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = categoriesLoading || itemsLoading

  return (
    <div className="min-h-screen bg-background">
      <OrderNavbar 
        onCartClick={() => setIsCartOpen(true)}
        cartItemCount={getTotalItems()}
      />
      <NotificationBanner />
      
      {/* Cart Content Component */}
      {(() => {
        const cartContent = (
          <>
          {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-3 sm:space-y-4 min-h-0" style={{ minHeight: cart.length > 0 && cart.length < 3 ? '280px' : 'auto' }}>
            {cart.length === 0 ? (
              <Empty
                icon={
                  <div className="rounded-md bg-muted p-3 border border-border">
                    <ShoppingCart className="h-5 w-5 text-foreground" />
                  </div>
                }
                title="Your cart is empty"
                description="Add items from the menu to get started"
                action={
                  <Button
                    onClick={() => {
                      setIsCartOpen(false)
                      // Scroll to top of menu after a brief delay
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }, 100)
                    }}
                    className="bg-foreground text-background hover:bg-foreground/90"
                    size="default"
                  >
                    Start Shopping
                  </Button>
                }
              >
                {/* Recommendations */}
                {menuItems.length > 0 && (
                  <div className="px-4 sm:px-6">
                    <p className="text-xs sm:text-sm font-medium text-foreground mb-3">
                      Recommendations
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide">
                      {menuItems.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-28 sm:w-32"
                        >
                          <Card
                            className="border-card-border hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                          >
                            <CardContent className="p-0 flex flex-col">
                              <div
                                className="relative w-full aspect-square overflow-hidden cursor-pointer flex-shrink-0"
                                onClick={() => {
                                  setIsCartOpen(false)
                                  handleItemSelect(item)
                                }}
                              >
                                {(() => {
                                  const imageUrl = parseImageUrl(item.image_url)
                                  return isValidUrl(imageUrl) ? (
                                    <Image
                                      src={imageUrl!}
                                      alt={item.name}
                                      fill
                                      className="object-cover hover:scale-105 transition-transform duration-300"
                                      sizes="(max-width: 640px) 112px, 128px"
                                      loading="lazy"
                                      unoptimized={imageUrl?.startsWith('http')}
                                    />
                                  ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  )
                                })()}
                              </div>
                              <div className="p-2 flex flex-col flex-1 min-h-[60px]">
                                <p className="text-xs font-medium text-foreground line-clamp-2 mb-1.5 min-h-[2.5rem]">
                                  {item.name}
                                </p>
                                <div className="flex items-center justify-between gap-1 mt-auto">
                                  <span className="text-xs font-geist text-foreground">
                                    ${parseFloat(item.price).toFixed(2)}
                                  </span>
                                  <Button
                                    variant="default"
                                    size="icon"
                                    className="h-6 w-6 rounded-full bg-foreground text-background hover:bg-foreground/90 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setIsCartOpen(false)
                                      handleItemSelect(item)
                                    }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
              </div>
                )}
              </Empty>
            ) : (
              <>
                {cart.map((item) => (
                    <Card key={item.id} className="border-card-border">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                          {(() => {
                            const imageUrl = parseImageUrl(item.menu_item_image_url)
                            return isValidUrl(imageUrl) ? (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden relative">
                                <Image
                                  src={imageUrl!}
                                  alt={item.menu_item_name}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                  loading="lazy"
                                  unoptimized={imageUrl?.startsWith('http')}
                          />
                        </div>
                            ) : null
                          })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 sm:mb-2 gap-2">
                            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate flex-1">
                                {item.menu_item_name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 no-default-hover-elevate no-default-active-elevate"
                                onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                            {/* Remove description in cart */}
                            {/* Modifiers */}
                            {item.modifiers.length > 0 && (
                              <div className="mb-2 text-xs text-muted-foreground">
                                <div className="border-l border-border space-y-1">
                                  {item.modifiers.map((modifier, idx) => (
                                    <div key={`${modifier.modifier_option_id}-${idx}`} className="pl-3">
                                      {modifier.modifier_option_name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 no-default-hover-elevate no-default-active-elevate"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 no-default-hover-elevate no-default-active-elevate"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                            <span className="font-geist text-base sm:text-lg text-foreground whitespace-nowrap">
                              ${item.line_total.toFixed(2)}
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
              <div className="border-t pt-4 px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
                <div className="flex items-center justify-between text-base sm:text-lg">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-geist text-xl sm:text-2xl text-foreground">
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>
                <div className="flex flex-col gap-2">
                <Button
                   className="w-full no-default-hover-elevate no-default-active-elevate bg-foreground text-background hover:bg-foreground/90 border-transparent"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? 'Submitting...' : 'Proceed to Checkout'}
                </Button>
                <Button
                  variant="outline"
                   className="w-full no-default-hover-elevate no-default-active-elevate"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </div>
              </div>
            )}
          </>
        )

        return (
          <>
            {/* Mobile: Drawer */}
            <Drawer open={isCartOpen && isMobile} onOpenChange={setIsCartOpen}>
              <DrawerContent className="max-h-[96vh] flex flex-col min-h-[550px]">
                <DrawerHeader className="text-left flex-shrink-0">
                  <DrawerTitle className="font-display text-xl sm:text-2xl">
                    Your Order
                  </DrawerTitle>
                  <DrawerDescription>
                    {cart.length === 0 
                      ? 'Your cart is empty' 
                      : `${getTotalItems()} ${getTotalItems() === 1 ? 'item' : 'items'} in your cart`}
                  </DrawerDescription>
                </DrawerHeader>
                {cartContent}
        </DrawerContent>
      </Drawer>

            {/* Desktop: Sheet */}
            <Sheet open={isCartOpen && !isMobile} onOpenChange={setIsCartOpen}>
              <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4">
                  <SheetTitle className="font-display text-xl sm:text-2xl">
                    Your Order
                  </SheetTitle>
                  <SheetDescription>
                    {cart.length === 0 
                      ? 'Your cart is empty' 
                      : `${getTotalItems()} ${getTotalItems() === 1 ? 'item' : 'items'} in your cart`}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  {cartContent}
                </div>
              </SheetContent>
            </Sheet>
          </>
        )
      })()}

      {/* Main Content */}
      <div 
        className="pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8"
        style={{ 
          paddingTop: `calc(5rem + var(--notification-banner-height, 0px))`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Search and Filter Bar */}
          <div className="mb-6 md:mb-8">
            <div className="flex gap-2 sm:gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {/* Mobile: Icon-only filter button */}
              {isMobile && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 flex-shrink-0 focus:ring-0 focus:ring-offset-0"
                  onClick={() => setIsFilterSheetOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              )}
              {/* Desktop: Category Filter Dropdown */}
              {!isMobile && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] h-11 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Menu Content */}
          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-64" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
          <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-base sm:text-lg">
                No menu items available at this time
            </p>
          </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg mb-2">
                No items found matching your search
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
          </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {categories.map((category, index) => {
                const items = itemsByCategory[category.id] || []
                if (items.length === 0) return null

                return (
                  <MenuCategorySection
                    key={category.id}
                    category={category}
                    items={items}
                    onItemSelect={handleItemSelect}
                    priority={index === 0}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Menu Item Dialog */}
      <MenuItemDialog
        itemId={selectedItemId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
        onSubmit={handleCheckoutSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Mobile Filter Drawer */}
      {isMobile && (
        <Drawer open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <DrawerContent className="max-h-[96vh] flex flex-col">
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-display text-xl sm:text-2xl">
                Filter by Category
              </DrawerTitle>
              <DrawerDescription>
                Select a category to filter menu items
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-3 sm:space-y-4">
              <Card
                className={`border-card-border cursor-pointer transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedCategory('all')
                  setIsFilterSheetOpen(false)
                }}
              >
                <CardContent className="p-4">
                  <p className="font-semibold text-sm sm:text-base">
                    All Categories
                  </p>
                </CardContent>
              </Card>
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className={`border-card-border cursor-pointer transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setIsFilterSheetOpen(false)
                  }}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm sm:text-base">
                      {category.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
