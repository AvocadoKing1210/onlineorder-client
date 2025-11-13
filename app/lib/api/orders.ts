/**
 * Orders API
 * Handles order submission via Cloudflare Worker
 */

// Types
export interface CartItem {
  menu_item_id: string
  quantity: number
  modifiers?: Array<{
    modifier_option_id: string
    quantity?: number
  }>
  notes?: string
}

export interface DeliveryAddress {
  street: string
  city: string
  province: string
  postal_code: string
  country?: string
  unit?: string
  instructions?: string
}

export interface OrderSubmissionRequest {
  cart: CartItem[]
  mode: 'dine_in' | 'takeout' | 'delivery'
  special_instructions?: string
  idempotency_key?: string
  user_id?: string // For guest checkout
  // Customer information
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: DeliveryAddress
}

export interface OrderSubmissionResponse {
  order_id: string
  reference_number: string
  status: string
  total_amount: string
}

/**
 * Get Next.js API route URL for order submission
 * This proxies to Cloudflare Worker with server-side API key
 */
function getOrderSubmitUrl(): string {
  // Use Next.js API route instead of direct Cloudflare Worker
  // The API route handles the API key server-side
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL
    return '/api/orders/submit'
  }
  // Server-side: construct full URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/orders/submit`
}

/**
 * Submit order via Cloudflare Worker
 * 
 * @param request - Order submission request with cart and order details
 * @param authToken - Optional Auth0 JWT token for authenticated users
 * @returns Order submission response with order_id and reference_number
 */
export async function submitOrder(
  request: OrderSubmissionRequest,
  authToken?: string
): Promise<OrderSubmissionResponse> {
  const url = getOrderSubmitUrl()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Add Auth0 token if provided (for authenticated users)
  // This will be forwarded by the Next.js API route to Cloudflare Worker
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `Failed to submit order: ${response.status}`)
  }

  return response.json()
}

/**
 * Generate idempotency key for order submission
 * Prevents duplicate orders if request is retried
 */
export function generateIdempotencyKey(): string {
  return `order-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Order details interface
 */
export interface OrderDetails {
  id: string
  user_id: string
  reference_number: string | null
  mode: 'dine_in' | 'takeout' | 'delivery' | 'view_only'
  status: 'created' | 'submitted' | 'accepted' | 'in_progress' | 'ready' | 'completed' | 'cancelled_by_user' | 'cancelled_by_store'
  subtotal: string
  tax_amount: string
  fees_amount: string
  tip_amount: string
  total_amount: string
  special_instructions: string | null
  estimated_preparation_minutes: number | null
  submitted_at: string | null
  accepted_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  item_name: string
  item_description: string | null
  unit_price: string
  quantity: number
  line_total: string
  notes: string | null
  created_at: string
}

/**
 * Get order by reference number (for guest checkout)
 * Works for both authenticated and anonymous users
 */
export async function getOrderByReference(referenceNumber: string): Promise<OrderDetails | null> {
  const supabase = await import('@/lib/auth').then(m => m.getSupabaseClient())
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  // Fetch order with items
  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('*')
    .eq('reference_number', referenceNumber)
    .single()

  if (orderError || !order) {
    return null
  }

  // Fetch order items
  const { data: items, error: itemsError } = await supabase
    .from('order_item')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  return {
    ...order,
    items: items || [],
  } as OrderDetails
}

/**
 * Get orders for authenticated user
 * Returns all orders for the logged-in user
 */
export async function getUserOrders(): Promise<OrderDetails[]> {
  const { getUser } = await import('@/lib/auth')
  const user = await getUser()
  
  if (!user?.sub) {
    return []
  }

  const supabase = await import('@/lib/auth').then(m => m.getSupabaseClient())
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  // Fetch orders for authenticated user
  const { data: orders, error } = await supabase
    .from('order')
    .select('*')
    .eq('user_id', user.sub)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user orders:', error)
    return []
  }

  if (!orders || orders.length === 0) {
    return []
  }

  // Fetch items for all orders
  const orderIds = orders.map(o => o.id)
  const { data: items } = await supabase
    .from('order_item')
    .select('*')
    .in('order_id', orderIds)
    .order('created_at', { ascending: true })

  // Group items by order_id
  const itemsByOrderId = new Map<string, OrderItem[]>()
  items?.forEach(item => {
    const orderItems = itemsByOrderId.get(item.order_id) || []
    orderItems.push(item as OrderItem)
    itemsByOrderId.set(item.order_id, orderItems)
  })

  // Attach items to orders
  return orders.map(order => ({
    ...order,
    items: itemsByOrderId.get(order.id) || [],
  })) as OrderDetails[]
}

/**
 * Get orders by reference numbers (for guest users)
 * Stores reference numbers in localStorage
 */
export function getGuestOrderReferences(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('guest_order_references')
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveGuestOrderReference(referenceNumber: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const existing = getGuestOrderReferences()
    if (!existing.includes(referenceNumber)) {
      existing.unshift(referenceNumber) // Add to beginning
      // Keep only last 20 orders
      const limited = existing.slice(0, 20)
      localStorage.setItem('guest_order_references', JSON.stringify(limited))
    }
  } catch (error) {
    console.error('Error saving guest order reference:', error)
  }
}

/**
 * Get orders by reference numbers (for guest users)
 */
export async function getGuestOrders(referenceNumbers: string[]): Promise<OrderDetails[]> {
  if (referenceNumbers.length === 0) return []

  const supabase = await import('@/lib/auth').then(m => m.getSupabaseClient())
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  // Fetch orders by reference numbers
  const { data: orders, error } = await supabase
    .from('order')
    .select('*')
    .in('reference_number', referenceNumbers)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching guest orders:', error)
    return []
  }

  if (!orders || orders.length === 0) {
    return []
  }

  // Fetch items for all orders
  const orderIds = orders.map(o => o.id)
  const { data: items } = await supabase
    .from('order_item')
    .select('*')
    .in('order_id', orderIds)
    .order('created_at', { ascending: true })

  // Group items by order_id
  const itemsByOrderId = new Map<string, OrderItem[]>()
  items?.forEach(item => {
    const orderItems = itemsByOrderId.get(item.order_id) || []
    orderItems.push(item as OrderItem)
    itemsByOrderId.set(item.order_id, orderItems)
  })

  // Attach items to orders
  return orders.map(order => ({
    ...order,
    items: itemsByOrderId.get(order.id) || [],
  })) as OrderDetails[]
}

