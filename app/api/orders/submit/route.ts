import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js API Route: Order Submission Proxy
 * 
 * This route acts as a secure proxy between the client and Cloudflare Worker.
 * The API key is stored server-side and never exposed to the client.
 */

interface OrderSubmissionRequest {
  cart: Array<{
    menu_item_id: string
    quantity: number
    modifiers?: Array<{
      modifier_option_id: string
      quantity?: number
    }>
    notes?: string
  }>
  mode: 'dine_in' | 'takeout' | 'delivery'
  special_instructions?: string
  idempotency_key?: string
  user_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: {
    street: string
    city: string
    province: string
    postal_code: string
    country?: string
    unit?: string
    instructions?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the Cloudflare Worker URL
    // Try server-side variable first, then fall back to NEXT_PUBLIC_ version
    const workerUrl = process.env.CLOUDFLARE_ORDER_WORKER_URL || 
                      process.env.NEXT_PUBLIC_CLOUDFLARE_ORDER_URL
    if (!workerUrl) {
      console.error('CLOUDFLARE_ORDER_WORKER_URL or NEXT_PUBLIC_CLOUDFLARE_ORDER_URL is not configured')
      return NextResponse.json(
        { error: 'Server configuration error: Cloudflare Worker URL not found' },
        { status: 500 }
      )
    }

    // Get the API key (server-side only, never exposed to client)
    // IMPORTANT: This must NOT have NEXT_PUBLIC_ prefix to stay secure
    const apiKey = process.env.CLOUDFLARE_ORDER_WORKER_API_KEY
    if (!apiKey) {
      console.error('CLOUDFLARE_ORDER_WORKER_API_KEY is not configured')
      console.error('Note: This must be a server-side variable (no NEXT_PUBLIC_ prefix)')
      return NextResponse.json(
        { error: 'Server configuration error: API key not found' },
        { status: 500 }
      )
    }

    // Parse request body from client
    const body: OrderSubmissionRequest = await request.json()

    // Forward the Authorization header from client (for JWT tokens)
    const authHeader = request.headers.get('Authorization')

    // Prepare headers for Cloudflare Worker
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey, // Server-side API key
    }

    // Forward Auth0 JWT token if provided by client
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Forward request to Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    // Get response data
    const data = await response.json()

    // Forward the response status and data
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Order submission proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to submit order. Please try again.' },
      { status: 500 }
    )
  }
}

