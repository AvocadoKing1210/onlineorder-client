import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js API Route: Review Submission Proxy
 * 
 * This route acts as a secure proxy between the client and Cloudflare Worker.
 * The API key is stored server-side and never exposed to the client.
 */

interface ReviewSubmissionRequest {
  menu_item_id: string
  rating: number // 1-5
  text?: string // Optional review text
}

export async function POST(request: NextRequest) {
  try {
    // Get the Cloudflare Worker URL
    // Try server-side variable first, then fall back to NEXT_PUBLIC_ version
    const workerUrl = process.env.CLOUDFLARE_REVIEW_WORKER_URL || 
                      process.env.NEXT_PUBLIC_CLOUDFLARE_REVIEW_URL
    if (!workerUrl) {
      console.error('CLOUDFLARE_REVIEW_WORKER_URL or NEXT_PUBLIC_CLOUDFLARE_REVIEW_URL is not configured')
      return NextResponse.json(
        { error: 'Server configuration error: Cloudflare Worker URL not found' },
        { status: 500 }
      )
    }

    // Get the API key (server-side only, never exposed to client)
    // IMPORTANT: This must NOT have NEXT_PUBLIC_ prefix to stay secure
    const apiKey = process.env.CLOUDFLARE_REVIEW_WORKER_API_KEY
    if (!apiKey) {
      console.error('CLOUDFLARE_REVIEW_WORKER_API_KEY is not configured')
      console.error('Note: This must be a server-side variable (no NEXT_PUBLIC_ prefix)')
      return NextResponse.json(
        { error: 'Server configuration error: API key not found' },
        { status: 500 }
      )
    }

    // Parse request body from client
    const body: ReviewSubmissionRequest = await request.json()

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
    console.error('Review submission proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review. Please try again.' },
      { status: 500 }
    )
  }
}

