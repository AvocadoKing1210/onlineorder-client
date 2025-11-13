import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js API Route: User Profile Proxy
 * 
 * This route acts as a secure proxy between the client and Cloudflare Worker.
 * The API key is stored server-side and never exposed to the client.
 */

interface UserProfileRequest {
  email?: string
  display_name?: string
  avatar_url?: string
  phone_number?: string
  preferred_locale?: string
}

export async function GET(request: NextRequest) {
  try {
    // Get the Cloudflare Worker URL
    const workerUrl = process.env.CLOUDFLARE_PROFILE_WORKER_URL || 
                      process.env.NEXT_PUBLIC_CLOUDFLARE_PROFILE_URL
    if (!workerUrl) {
      console.error('CLOUDFLARE_PROFILE_WORKER_URL or NEXT_PUBLIC_CLOUDFLARE_PROFILE_URL is not configured')
      return NextResponse.json(
        { error: 'Server configuration error: Cloudflare Worker URL not found' },
        { status: 500 }
      )
    }

    // Get the API key (server-side only, never exposed to client)
    const apiKey = process.env.CLOUDFLARE_PROFILE_WORKER_API_KEY
    if (!apiKey) {
      console.error('CLOUDFLARE_PROFILE_WORKER_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error: API key not found' },
        { status: 500 }
      )
    }

    // Forward the Authorization header from client (for JWT tokens)
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Prepare headers for Cloudflare Worker
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey, // Server-side API key
      'Authorization': authHeader, // Forward JWT token
    }

    // Forward request to Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: 'GET',
      headers,
    })

    // Get response data
    const data = await response.json()

    // Forward the response status and data
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Profile fetch proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile. Please try again.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return handleWriteRequest(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return handleWriteRequest(request, 'PUT')
}

export async function PATCH(request: NextRequest) {
  return handleWriteRequest(request, 'PATCH')
}

async function handleWriteRequest(request: NextRequest, method: string) {
  try {
    // Get the Cloudflare Worker URL
    const workerUrl = process.env.CLOUDFLARE_PROFILE_WORKER_URL || 
                      process.env.NEXT_PUBLIC_CLOUDFLARE_PROFILE_URL
    if (!workerUrl) {
      console.error('CLOUDFLARE_PROFILE_WORKER_URL or NEXT_PUBLIC_CLOUDFLARE_PROFILE_URL is not configured')
      return NextResponse.json(
        { error: 'Server configuration error: Cloudflare Worker URL not found' },
        { status: 500 }
      )
    }

    // Get the API key (server-side only, never exposed to client)
    const apiKey = process.env.CLOUDFLARE_PROFILE_WORKER_API_KEY
    if (!apiKey) {
      console.error('CLOUDFLARE_PROFILE_WORKER_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error: API key not found' },
        { status: 500 }
      )
    }

    // Parse request body from client
    const body: UserProfileRequest = await request.json()

    // Forward the Authorization header from client (for JWT tokens)
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Prepare headers for Cloudflare Worker
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey, // Server-side API key
      'Authorization': authHeader, // Forward JWT token
    }

    // Forward request to Cloudflare Worker
    const response = await fetch(workerUrl, {
      method,
      headers,
      body: JSON.stringify(body),
    })

    // Get response data
    const data = await response.json()

    // Forward the response status and data
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Profile update proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile. Please try again.' },
      { status: 500 }
    )
  }
}

