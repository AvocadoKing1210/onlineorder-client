'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient, isAuthenticated, getUser } from '@/lib/auth'
import { 
  getUserOrders, 
  getGuestOrders, 
  getGuestOrderReferences,
  type OrderDetails 
} from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import OrderNavbar from '@/components/OrderNavbar'
import { 
  Clock, 
  Package, 
  ChefHat, 
  Truck, 
  CheckCircle2,
  XCircle,
  ArrowRight,
  History,
  ShoppingBag,
  Copy,
  Check
} from 'lucide-react'

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  created: {
    label: 'Created',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  submitted: {
    label: 'Submitted',
    icon: <Package className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  accepted: {
    label: 'Accepted',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  in_progress: {
    label: 'In Progress',
    icon: <ChefHat className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  ready: {
    label: 'Ready',
    icon: <Truck className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  cancelled_by_user: {
    label: 'Cancelled',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
  cancelled_by_store: {
    label: 'Cancelled',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
}

function OrderCard({ order, isPastOrder = false }: { order: OrderDetails; isPastOrder?: boolean }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.submitted
  const itemCount = order.items?.length || 0
  const isFinished = ['completed', 'cancelled_by_user', 'cancelled_by_store'].includes(order.status)
  const totalItems = order.items?.length || 0
  const showBadge = totalItems > 1

  // For past orders, use the detail page layout
  if (isPastOrder) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Order #</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold tabular-nums">{order.reference_number || order.id.slice(0, 8)}</p>
                {order.reference_number && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => {
                      if (order.reference_number) {
                        await navigator.clipboard.writeText(order.reference_number)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }
                    }}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            <Badge variant="outline" className="mb-1">
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Items in Accordion */}
          {order.items && order.items.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="items">
                <AccordionTrigger className="text-sm">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} • ${parseFloat(order.total_amount).toFixed(2)}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex-1 flex items-center gap-2">
                          <p className="font-medium">{item.item_name}</p>
                          {showBadge && (
                            <Badge variant="outline" className="text-xs">
                              {item.quantity}
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold">${parseFloat(item.line_total).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground">No items</p>
          )}

          {order.special_instructions && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                  Special Instructions
                </h3>
                <p className="text-sm">{order.special_instructions}</p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            {order.reference_number && (
              <Button
                size="sm"
                onClick={() => router.push(`/order/track/${order.reference_number}`)}
                className="gap-2 bg-foreground text-background hover:bg-foreground/90 border-transparent"
              >
                View Details
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // For ongoing orders, use simplified layout with estimated finish time
  const getEstimatedFinishTime = () => {
    if (!order.estimated_preparation_minutes) return null
    
    // Use accepted_at if available, otherwise use submitted_at or created_at
    const startTime = order.accepted_at 
      ? new Date(order.accepted_at)
      : order.submitted_at
      ? new Date(order.submitted_at)
      : new Date(order.created_at)
    
    const finishTime = new Date(startTime.getTime() + order.estimated_preparation_minutes * 60 * 1000)
    return finishTime
  }

  const estimatedFinishTime = getEstimatedFinishTime()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Order #</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold tabular-nums">{order.reference_number || order.id.slice(0, 8)}</p>
              {order.reference_number && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    if (order.reference_number) {
                      await navigator.clipboard.writeText(order.reference_number)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }
                  }}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          {estimatedFinishTime && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Estimated ready</p>
              <p className="text-2xl font-semibold tabular-nums">
                {estimatedFinishTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {order.special_instructions && (
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
              Special Instructions
            </h3>
            <p className="text-sm">{order.special_instructions}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {order.reference_number && (
            <Button
              size="sm"
              onClick={() => router.push(`/order/track/${order.reference_number}`)}
              className="gap-2 bg-foreground text-background hover:bg-foreground/90 border-transparent"
            >
              Track Order
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated()
      setIsUserAuthenticated(auth)
    }
    checkAuth()
  }, [])

  // Fetch orders for authenticated users
  const { data: userOrders = [], isLoading: userOrdersLoading } = useQuery({
    queryKey: ['userOrders'],
    queryFn: getUserOrders,
    enabled: isUserAuthenticated === true,
  })

  // Fetch orders for guest users
  const { data: guestOrders = [], isLoading: guestOrdersLoading } = useQuery({
    queryKey: ['guestOrders'],
    queryFn: async () => {
      const references = getGuestOrderReferences()
      if (references.length === 0) return []
      return getGuestOrders(references)
    },
    enabled: isUserAuthenticated === false,
  })

  // Set up Realtime subscription for ongoing orders
  useEffect(() => {
    if (isUserAuthenticated === null) return

    let channel: any = null

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient()
        if (!supabase) return

        // Subscribe to order updates
        // RLS will automatically filter based on user authentication
        // For authenticated users: shows their orders
        // For guests: shows orders by reference_number (via RLS policy)
        channel = supabase
          .channel('order-history-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'order',
              // No filter needed - RLS handles filtering
            },
            () => {
              // Refetch orders when updates occur
              // Invalidate and refetch queries
              setTimeout(() => {
                if (isUserAuthenticated) {
                  queryClient.invalidateQueries({ queryKey: ['userOrders'] })
                } else {
                  queryClient.invalidateQueries({ queryKey: ['guestOrders'] })
                }
              }, 500) // Small delay to avoid rapid refetches
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscribed to order history updates')
            }
          })
      } catch (error) {
        console.error('Error setting up Realtime subscription:', error)
      }
    }

    setupRealtime()

    return () => {
      if (channel) {
        const cleanup = async () => {
          const supabase = await getSupabaseClient()
          if (supabase) {
            await supabase.removeChannel(channel).catch(console.error)
          }
        }
        cleanup()
      }
    }
  }, [isUserAuthenticated, queryClient])

  const orders = isUserAuthenticated ? userOrders : guestOrders
  const isLoading = isUserAuthenticated === null || 
    (isUserAuthenticated ? userOrdersLoading : guestOrdersLoading)

  // Separate ongoing and past orders
  const ongoingOrders = orders.filter(
    order => !['completed', 'cancelled_by_user', 'cancelled_by_store'].includes(order.status)
  )
  const pastOrders = orders.filter(
    order => ['completed', 'cancelled_by_user', 'cancelled_by_store'].includes(order.status)
  )

  return (
    <div className="min-h-screen bg-background">
      <OrderNavbar onCartClick={() => router.push('/order')} cartItemCount={0} />
      
      <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-2 text-foreground">
              Order History
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {isUserAuthenticated 
                ? 'View and track all your orders'
                : 'View your recent orders (guest checkout)'}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">
                  {isUserAuthenticated
                    ? "You haven't placed any orders yet. Start ordering now!"
                    : "You haven't placed any orders yet. Orders placed as a guest will appear here."}
                </p>
                <Button 
                  onClick={() => router.push('/order')}
                  className="bg-foreground text-background hover:bg-foreground/90 border-transparent"
                >
                  Start Ordering
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="ongoing" className="w-full">
              <TabsList>
                <TabsTrigger value="ongoing" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Ongoing ({ongoingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-2">
                  <History className="h-4 w-4" />
                  Past ({pastOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ongoing" className="space-y-4 mt-6">
                {ongoingOrders.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No ongoing orders</h3>
                      <p className="text-muted-foreground">
                        All your orders have been completed or cancelled.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ongoingOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-6">
                {pastOrders.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No past orders</h3>
                      <p className="text-muted-foreground">
                        Your completed and cancelled orders will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pastOrders.map((order) => (
                      <OrderCard key={order.id} order={order} isPastOrder={true} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}

