'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/auth'
import { getOrderByReference, type OrderDetails } from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Clock, Copy, Check, CheckCircle2, RefreshCcw } from 'lucide-react'
import OrderNavbar from '@/components/OrderNavbar'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

// Order status configuration - simple labels only
const STATUS_CONFIG: Record<string, { label: string }> = {
  created: {
    label: 'Created',
  },
  submitted: {
    label: 'Submitted',
  },
  accepted: {
    label: 'Accepted',
  },
  in_progress: {
    label: 'In Progress',
  },
  ready: {
    label: 'Ready',
  },
  completed: {
    label: 'Completed',
  },
  cancelled_by_user: {
    label: 'Cancelled by You',
  },
  cancelled_by_store: {
    label: 'Cancelled by Store',
  },
}

// Status progression for visual timeline
const STATUS_PROGRESSION = [
  'submitted',
  'accepted',
  'in_progress',
  'ready',
  'completed',
]

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const referenceNumber = params.referenceNumber as string
  const isMobile = useIsMobile()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRealtimeConnectedRef = useRef(false)

  // Load order data
  const loadOrder = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      const orderData = await getOrderByReference(referenceNumber)
      if (!orderData) {
        if (showLoading) {
          toast({
            title: 'Order not found',
            description: 'The order with this reference number could not be found.',
            variant: 'destructive',
          })
          router.push('/order')
        }
        return
      }
      setOrder(orderData)
    } catch (error: any) {
      console.error('Error loading order:', error)
      if (showLoading) {
        toast({
          title: 'Failed to load order',
          description: error.message || 'Please try again',
          variant: 'destructive',
        })
      }
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  // Set up Realtime subscription
  useEffect(() => {
    if (!referenceNumber) return

    let channel: any = null
    let setupTimeout: NodeJS.Timeout | null = null

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient()
        if (!supabase) {
          console.warn('⚠️ Supabase client not available, skipping Realtime setup')
          return
        }

        // Use a unique channel name to avoid conflicts
        const channelName = `order-tracking-${referenceNumber}-${Date.now()}`
        
        // Subscribe to order updates
        // For anonymous users, RLS policy allows reading orders with reference_number
        // We'll filter in the callback to only process this specific order
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'order',
              // No filter - RLS will handle filtering
              // Anonymous users can only see orders with reference_number (via RLS)
            },
            async (payload) => {
              try {
                console.log('🔔 Order update received:', payload.new)
                
                const updatedOrder = payload.new as OrderDetails
                
                // Only process updates for this specific order
                // This is important because RLS allows reading any order with reference_number
                if (!updatedOrder.reference_number || updatedOrder.reference_number !== referenceNumber) {
                  console.log('Skipping update - not for this order:', updatedOrder.reference_number)
                  return
                }
                
                setOrder(prev => prev ? { ...prev, ...updatedOrder } : null)

                // Show toast for status changes
                const oldStatus = (payload.old as any)?.status
                const newStatus = updatedOrder.status
                
                if (oldStatus && oldStatus !== newStatus) {
                  const statusConfig = STATUS_CONFIG[newStatus]
                  const toastResult = toast({
                    title: 'Order status updated',
                    description: `Your order is now ${statusConfig?.label.toLowerCase() || newStatus}`,
                  })
                  // Auto-dismiss after 10 seconds
                  setTimeout(() => {
                    toastResult.dismiss()
                  }, 10000)

                  // If order is completed or cancelled, cleanup after a delay
                  if (newStatus === 'completed' || newStatus === 'cancelled_by_user' || newStatus === 'cancelled_by_store') {
                    // Cleanup subscription after showing final status
                    setTimeout(() => {
                      if (channel) {
                        supabase.removeChannel(channel).catch(console.error)
                      }
                    }, 5000) // Keep subscription for 5 seconds after completion
                  }
                }
              } catch (error) {
                console.error('Error processing Realtime update:', error)
              }
            }
          )
          .subscribe((status, err) => {
            console.log('📡 Realtime subscription status:', status)
            
            if (err) {
              // Only log error, don't show to user - polling will handle updates
              console.warn('⚠️ Realtime subscription error (non-critical, polling will handle updates):', {
                status,
                error: err,
                errorType: typeof err,
                errorString: String(err),
                referenceNumber,
              })
              setIsRealtimeConnected(false)
              isRealtimeConnectedRef.current = false
              return
            }
            
            const connected = status === 'SUBSCRIBED'
            setIsRealtimeConnected(connected)
            isRealtimeConnectedRef.current = connected
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscribed to order updates for:', referenceNumber)
              console.log('📋 Listening for UPDATE events on order table')
              // Stop polling if Realtime is connected
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
                console.log('🛑 Stopped polling - Realtime connected')
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              console.warn('⚠️ Realtime subscription status:', status)
              setIsRealtimeConnected(false)
              isRealtimeConnectedRef.current = false
            } else {
              console.log('ℹ️ Realtime subscription status:', status)
            }
          })
      } catch (error) {
        console.error('Error setting up Realtime subscription:', error)
        setIsRealtimeConnected(false)
        isRealtimeConnectedRef.current = false
      }
    }

    // Load order first
    loadOrder()
    
    // Delay Realtime setup to ensure Supabase client is fully ready
    // This fixes the issue where subscription fails on initial navigation
    setupTimeout = setTimeout(() => {
      setupRealtime()
    }, 500) // Small delay to ensure client is ready

    // Always start polling as a backup - it will stop if Realtime connects
    // This ensures users get updates even if Realtime fails silently
    const startPolling = () => {
      if (pollIntervalRef.current) {
        return // Already polling
      }
      console.log('🔄 Starting polling for order updates (will stop if Realtime connects)')
      const interval = setInterval(() => {
        // Check if Realtime is connected - if so, stop polling
        if (isRealtimeConnectedRef.current) {
          clearInterval(interval)
          pollIntervalRef.current = null
          console.log('🛑 Stopped polling - Realtime connected')
          return
        }
        console.log('🔄 Polling for order updates')
        loadOrder(false) // Don't show loading state during polling
      }, 5000) // Poll every 5 seconds
      pollIntervalRef.current = interval
    }

    // Start polling immediately - it will stop automatically if Realtime connects
    // This ensures updates work even if Realtime fails
    startPolling()

    // Cleanup: unsubscribe when component unmounts or order is finished
    return () => {
      if (setupTimeout) {
        clearTimeout(setupTimeout)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
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
  }, [referenceNumber])

  // Calculate and update remaining time in real-time
  useEffect(() => {
    if (!order || !order.estimated_preparation_minutes) {
      setRemainingMinutes(null)
      return
    }

    // Only show countdown for orders that have been accepted
    if (!order.accepted_at) {
      setRemainingMinutes(order.estimated_preparation_minutes)
      return
    }

    const calculateRemaining = () => {
      const acceptedAt = new Date(order.accepted_at!)
      const now = new Date()
      const elapsedMinutes = Math.floor((now.getTime() - acceptedAt.getTime()) / (1000 * 60))
      const remaining = Math.max(0, order.estimated_preparation_minutes! - elapsedMinutes)
      setRemainingMinutes(remaining)
    }

    // Calculate immediately
    calculateRemaining()

    // Update every minute
    countdownIntervalRef.current = setInterval(calculateRemaining, 60000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [order?.estimated_preparation_minutes, order?.accepted_at, order?.status])

  // Auto-cleanup when order is finished
  useEffect(() => {
    if (!order) return

    const finishedStatuses = ['completed', 'cancelled_by_user', 'cancelled_by_store']
    if (finishedStatuses.includes(order.status)) {
      // Clear countdown when order is finished
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      setRemainingMinutes(null)
      
      // Order is finished, cleanup subscription after a delay
      const timer = setTimeout(() => {
        // Subscription will be cleaned up in the useEffect cleanup
        console.log('Order finished, subscription will be cleaned up')
      }, 10000) // Keep for 10 seconds after completion to show final status

      return () => clearTimeout(timer)
    }
  }, [order?.status])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <OrderNavbar onCartClick={() => {}} cartItemCount={0} />
        <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <OrderNavbar onCartClick={() => {}} cartItemCount={0} />
        <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Order not found</p>
                <Button 
                  onClick={() => router.push('/order')} 
                  className="mt-4 w-full bg-foreground text-background hover:bg-foreground/90 border-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.submitted
  const currentStatusIndex = STATUS_PROGRESSION.indexOf(order.status)
  const isFinished = ['completed', 'cancelled_by_user', 'cancelled_by_store'].includes(order.status)

  return (
    <div className="min-h-screen bg-background">
      <OrderNavbar onCartClick={() => {}} cartItemCount={0} />
      
      <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => router.push('/order')}
              variant="ghost"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Menu
            </Button>
            <div className="flex items-center gap-3">
              {isRealtimeConnected && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Live updates
                </div>
              )}
              <Button
                size={isMobile ? "icon" : "sm"}
                variant="ghost"
                onClick={() => loadOrder()}
                className={isMobile ? "" : "gap-2"}
              >
                {isMobile ? (
                  <RefreshCcw className="h-4 w-4" />
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Order Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Order #</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold tabular-nums">{order.reference_number}</p>
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
                  </div>
                </div>
                {order.status === 'ready' || order.status === 'completed' ? (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Ready at</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {new Date(order.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                ) : order.estimated_preparation_minutes && remainingMinutes !== null && (order.status === 'accepted' || order.status === 'in_progress') ? (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated wait time</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {remainingMinutes > 0 ? `${remainingMinutes} min` : 'Ready soon'}
                    </p>
                  </div>
                ) : order.estimated_preparation_minutes && (order.status === 'accepted' || order.status === 'in_progress') ? (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated wait time</p>
                    <p className="text-2xl font-semibold tabular-nums">{order.estimated_preparation_minutes} min</p>
                  </div>
                ) : (
                  <Badge variant="outline" className="mb-1">
                    {statusConfig.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Order Progress
                </h3>
                <div className="space-y-0">
                  {STATUS_PROGRESSION.map((status, index) => {
                    const config = STATUS_CONFIG[status]
                    const isActive = index <= currentStatusIndex
                    const isCurrent = order.status === status
                    const isLast = index === STATUS_PROGRESSION.length - 1
                    // Show spinner on the NEXT status after current (waiting for it)
                    // e.g., if current is "submitted" (index 0), show spinner on "accepted" (index 1)
                    const nextStatusIndex = currentStatusIndex + 1
                    const isWaitingForThis = index === nextStatusIndex && !isFinished && currentStatusIndex >= 0
                    // Completed states show check icon (all statuses up to and including current)
                    const isCompleted = index <= currentStatusIndex

                    return (
                      <div key={status} className="flex items-start gap-4">
                        {/* Timeline dot and line */}
                        <div className="flex flex-col items-center">
                          <div className="w-5 h-5 flex items-center justify-center mb-2 mt-2">
                            {isWaitingForThis ? (
                              <Spinner size="sm" className="h-5 w-5" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-foreground" />
                            ) : (
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full transition-colors",
                                  "bg-muted-foreground/30"
                                )}
                              />
                            )}
                          </div>
                          {!isLast && (
                            <div
                              className={cn(
                                "w-px min-h-[2rem] mt-1 transition-colors",
                                isActive && index < currentStatusIndex
                                  ? "bg-foreground"
                                  : "bg-border"
                              )}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p
                            className={cn(
                              "font-medium mt-1.5",
                              isActive ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {config.label}
                          </p>
                          {isCurrent && order.status === 'accepted' && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              {order.accepted_at && (
                                <p>Accepted at {new Date(order.accepted_at).toLocaleTimeString()}</p>
                              )}
                              {order.estimated_preparation_minutes && (
                                <p>Estimated wait time: {order.estimated_preparation_minutes} minutes</p>
                              )}
                            </div>
                          )}
                          {isCurrent && order.status === 'in_progress' && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <p>Preparing your order...</p>
                              {order.estimated_preparation_minutes && (
                                <p>Estimated wait time: {order.estimated_preparation_minutes} minutes</p>
                              )}
                            </div>
                          )}
                          {isCurrent && (order.status === 'ready' || order.status === 'completed') && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ready at {new Date(order.updated_at).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Order Items
                </h3>
                <ul className="space-y-3 pl-6 list-disc">
                  {order.items?.map((item) => {
                    const totalItems = order.items?.length || 0
                    const showBadge = totalItems > 1
                    
                    return (
                      <li key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex-1 flex items-center gap-2">
                          <p className="font-medium">{item.item_name}</p>
                          {showBadge && (
                            <Badge variant="outline" className="text-xs">
                              {item.quantity}
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold">${parseFloat(item.line_total).toFixed(2)}</p>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(order.tax_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${parseFloat(order.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(order.fees_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fees</span>
                    <span>${parseFloat(order.fees_amount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(order.tip_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tip</span>
                    <span>${parseFloat(order.tip_amount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>

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

              {isFinished && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {order.status === 'completed'
                        ? 'Thank you for your order!'
                        : 'This order has been cancelled.'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

