/**
 * Reservations API
 * Handles reservation creation and management
 */

import { getSupabaseClient } from '@/lib/auth'

// Types
export interface ReservationSubmissionRequest {
  table_id?: string | null // Optional - staff will assign table later
  reservation_time: string // ISO 8601 timestamp
  covers: number
  customer_name: string
  contact_phone: string
  contact_email?: string
  special_requests?: string
  duration_hours?: number // Default 2.0
  idempotency_key?: string
}

export interface ReservationSubmissionResponse {
  reservation_id: string
  status: string
  message?: string
}

export interface AvailableTimeSlot {
  table_id: string
  table_name: string
  seat_count: number
  available_slots: string[] // ISO 8601 timestamps
}

/**
 * Get Next.js API route URL for reservation submission
 */
function getReservationSubmitUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/reservations/submit'
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/reservations/submit`
}

/**
 * Submit reservation
 * 
 * @param request - Reservation submission request
 * @returns Reservation submission response
 */
export async function submitReservation(
  request: ReservationSubmissionRequest
): Promise<ReservationSubmissionResponse> {
  const url = getReservationSubmitUrl()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || error.message || `Failed to submit reservation: ${response.status}`)
  }

  return response.json()
}

/**
 * Get available time slots for a given date and party size
 * 
 * @param requestedDate - Date for which to get available slots
 * @param covers - Number of guests
 * @param durationHours - Expected duration in hours (default 2.0)
 * @param slotIntervalMinutes - Interval between slots in minutes (default 15)
 * @returns Array of tables with available time slots
 */
export async function getAvailableTimeSlots(
  requestedDate: Date,
  covers: number,
  durationHours: number = 2.0,
  slotIntervalMinutes: number = 15
): Promise<AvailableTimeSlot[]> {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  // Format date as YYYY-MM-DD
  const dateStr = requestedDate.toISOString().split('T')[0]

  const { data, error } = await supabase.rpc('get_available_time_slots', {
    p_requested_date: dateStr,
    p_covers: covers,
    p_duration_hours: durationHours,
    p_slot_interval_minutes: slotIntervalMinutes,
  } as any)

  if (error) {
    console.error('Error fetching available time slots:', error)
    throw new Error(`Failed to fetch available time slots: ${error.message}`)
  }

  return (data || []) as AvailableTimeSlot[]
}

/**
 * Generate idempotency key for reservation submission
 * Prevents duplicate reservations if request is retried
 */
export function generateReservationIdempotencyKey(): string {
  return `reservation-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

