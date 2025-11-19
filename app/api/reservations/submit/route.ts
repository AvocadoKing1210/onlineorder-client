import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Next.js API Route: Reservation Submission
 * 
 * This route handles reservation creation using Supabase RPC function
 */

/**
 * Get Supabase client for server-side API routes
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

interface ReservationSubmissionRequest {
  table_id?: string | null // Optional - staff will assign table later
  reservation_time: string // ISO 8601 timestamp
  covers: number
  customer_name: string
  contact_phone: string
  contact_email?: string
  special_requests?: string
  duration_hours?: number
  idempotency_key?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ReservationSubmissionRequest = await request.json()

    // Validate required fields (table_id is optional)
    if (!body.reservation_time || !body.covers || !body.customer_name || !body.contact_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: reservation_time, covers, customer_name, contact_phone' },
        { status: 400 }
      )
    }

    // Validate covers is positive
    if (body.covers <= 0) {
      return NextResponse.json(
        { error: 'Number of guests must be greater than 0' },
        { status: 400 }
      )
    }

    // Get Supabase client
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch (error: any) {
      console.error('Supabase client creation error:', error)
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Call the create_reservation function (table_id is optional and must be last parameter)
    const { data, error } = await supabase.rpc('create_reservation', {
      p_reservation_time: body.reservation_time,
      p_covers: body.covers,
      p_customer_name: body.customer_name,
      p_contact_phone: body.contact_phone,
      p_contact_email: body.contact_email || null,
      p_special_requests: body.special_requests || null,
      p_duration_hours: body.duration_hours || 2.0,
      p_idempotency_key: body.idempotency_key || null,
      p_table_id: body.table_id || null,
    })

    if (error) {
      console.error('Reservation creation error:', error)
      
      // Handle specific error cases
      if (error.message.includes('already reserved') || error.message.includes('Time slot')) {
        return NextResponse.json(
          { error: 'This time slot is no longer available. Please select another time.' },
          { status: 409 }
        )
      }
      
      if (error.message.includes('exceeds table capacity')) {
        return NextResponse.json(
          { error: 'Party size exceeds table capacity. Please select a larger table or reduce party size.' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('blackout')) {
        return NextResponse.json(
          { error: 'This time slot is not available for reservations.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: error.message || 'Failed to create reservation. Please try again.' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Reservation creation failed. No reservation ID returned.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reservation_id: data,
      status: 'confirmed',
      message: 'Reservation created successfully',
    })
  } catch (error: any) {
    console.error('Reservation submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit reservation. Please try again.' },
      { status: 500 }
    )
  }
}

