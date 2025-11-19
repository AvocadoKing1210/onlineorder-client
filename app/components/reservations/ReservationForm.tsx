'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, addDays, setHours, setMinutes, isPast, startOfDay, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Clock, Users, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAuthenticated } from '@/lib/auth'
import { getUserProfile as fetchUserProfile, type UserProfile } from '@/lib/api/profile'
import { useIsMobile } from '@/hooks/use-mobile'
import { 
  submitReservation, 
  getAvailableTimeSlots,
  generateReservationIdempotencyKey,
  type AvailableTimeSlot
} from '@/lib/api/reservations'
import { useToast } from '@/hooks/use-toast'

// Form validation schema
const reservationFormSchema = z.object({
  reservation_date: z.date({
    required_error: 'Please select a date',
  }),
  reservation_time: z.string().min(1, 'Please select a time'),
  covers: z.number().min(1, 'At least 1 guest is required').max(20, 'Maximum 20 guests'),
  customer_name: z.string().min(1, 'Name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(1, 'Phone number is required'),
  special_requests: z.string().optional(),
})

export type ReservationFormData = z.infer<typeof reservationFormSchema>

interface ReservationFormProps {
  onSuccess?: (reservationId: string) => void
  onCancel?: () => void
}

export function ReservationForm({ onSuccess, onCancel }: ReservationFormProps) {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([])
  const [availableTimes, setAvailableTimes] = useState<Set<string>>(new Set())
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM')
  const [selectedHour, setSelectedHour] = useState<string>('')
  const [selectedMinute, setSelectedMinute] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()
  const { toast } = useToast()

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      reservation_date: addDays(new Date(), 1), // Default to tomorrow
      reservation_time: '',
      covers: 2,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_requests: '',
    },
  })

  const selectedDate = form.watch('reservation_date')
  const selectedCovers = form.watch('covers')

  // Check authentication and load profile (non-blocking - form works without auth)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await isAuthenticated()
        setIsUserAuthenticated(auth)

        if (auth) {
          // Try to load profile, but don't block if it fails
          const profile = await fetchUserProfile()
          if (profile) {
            setUserProfile(profile)
            form.setValue('customer_name', profile.display_name || '')
            form.setValue('customer_email', profile.email)
            form.setValue('customer_phone', profile.phone_number || '')
          }
        }
      } catch (error) {
        // Silently handle errors - form should work for guests
        console.warn('Could not load user profile (form will work as guest):', error)
      }
    }

    checkAuth()
  }, [form])

  // Load available time slots based on date and party size
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!selectedDate || !selectedCovers || selectedCovers < 1) {
        setAvailableSlots([])
        setAvailableTimes(new Set())
        form.setValue('reservation_time', '')
        setSelectedHour('')
        setSelectedMinute('')
        return
      }

      // Don't allow past dates
      if (isPast(startOfDay(selectedDate))) {
        setAvailableSlots([])
        setAvailableTimes(new Set())
        form.setValue('reservation_time', '')
        setSelectedHour('')
        setSelectedMinute('')
        return
      }

      setLoadingTimeSlots(true)
      try {
        const slots = await getAvailableTimeSlots(selectedDate, selectedCovers, 2.0, 15)
        setAvailableSlots(slots)

        // Extract all available times from all tables
        const allAvailableTimes = new Set<string>()
        slots.forEach(slot => {
          slot.available_slots.forEach(timeStr => {
            const time = new Date(timeStr)
            const timeFormatted = format(time, 'HH:mm')
            allAvailableTimes.add(timeFormatted)
          })
        })

        // If selected date is today, filter out past times
        const now = new Date()
        const isToday = isSameDay(selectedDate, now)
        
        if (isToday) {
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()
          const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
          
          // Filter out times that have already passed today
          const filteredTimes = new Set<string>()
          allAvailableTimes.forEach(time => {
            if (time > currentTimeStr) {
              filteredTimes.add(time)
            }
          })
          setAvailableTimes(filteredTimes)
        } else {
          setAvailableTimes(allAvailableTimes)
        }

        // Reset time selection if current selection is no longer available
        const currentTime = form.watch('reservation_time')
        if (currentTime) {
          const [hours, minutes] = currentTime.split(':').map(Number)
          const currentTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          if (!allAvailableTimes.has(currentTimeStr)) {
            form.setValue('reservation_time', '')
            setSelectedHour('')
            setSelectedMinute('')
            setSelectedPeriod('AM')
          } else {
            // Sync dropdowns with current time
            const hour12 = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours)
            setSelectedPeriod(hours >= 12 ? 'PM' : 'AM')
            setSelectedHour(hour12.toString())
            setSelectedMinute(minutes.toString().padStart(2, '0'))
          }
        } else {
          setSelectedHour('')
          setSelectedMinute('')
          setSelectedPeriod('AM')
        }
      } catch (error: any) {
        console.error('Error loading time slots:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to load available time slots',
          variant: 'destructive',
        })
        setAvailableSlots([])
        setAvailableTimes(new Set())
      } finally {
        setLoadingTimeSlots(false)
      }
    }

    loadTimeSlots()
  }, [selectedDate, selectedCovers, form, toast])

  // Update time when period, hour, or minute changes
  useEffect(() => {
    if (selectedHour && selectedMinute) {
      // Convert 12-hour format to 24-hour format
      let hour24 = parseInt(selectedHour)
      if (selectedPeriod === 'PM' && hour24 !== 12) {
        hour24 += 12
      } else if (selectedPeriod === 'AM' && hour24 === 12) {
        hour24 = 0
      }
      
      const timeStr = `${hour24.toString().padStart(2, '0')}:${selectedMinute}`
      
      // Check if this time is available
      if (availableTimes.has(timeStr)) {
        form.setValue('reservation_time', timeStr)
      } else {
        form.setValue('reservation_time', '')
      }
    } else {
      form.setValue('reservation_time', '')
    }
  }, [selectedPeriod, selectedHour, selectedMinute, availableTimes, form])

  // Get available hours for selected period
  const getAvailableHours = (): string[] => {
    const hours: string[] = []
    const startHour = selectedPeriod === 'AM' ? 9 : (selectedPeriod === 'PM' ? 12 : 9)
    const endHour = selectedPeriod === 'AM' ? 11 : (selectedPeriod === 'PM' ? 9 : 11)
    
    for (let h = startHour; h <= endHour; h++) {
      const hour12 = h === 0 ? 12 : (h > 12 ? h - 12 : h)
      const hourStr = hour12.toString()
      
      // Check if this hour has any available times
      const hasAvailableTime = Array.from(availableTimes).some(time => {
        const [hour24] = time.split(':').map(Number)
        const hour12Check = hour24 === 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24)
        return hour12Check === hour12 && 
               ((selectedPeriod === 'AM' && hour24 < 12) || 
                (selectedPeriod === 'PM' && hour24 >= 12))
      })
      
      if (hasAvailableTime) {
        hours.push(hourStr)
      }
    }
    
    return hours
  }

  // Get available minutes for selected hour and period
  const getAvailableMinutes = (): string[] => {
    if (!selectedHour) return []
    
    const minutes = ['00', '15', '30', '45']
    const availableMinutes: string[] = []
    
    // Convert 12-hour format to 24-hour format
    let hour24 = parseInt(selectedHour)
    if (selectedPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (selectedPeriod === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    
    minutes.forEach(min => {
      const timeStr = `${hour24.toString().padStart(2, '0')}:${min}`
      if (availableTimes.has(timeStr)) {
        availableMinutes.push(min)
      }
    })
    
    return availableMinutes
  }

  const handleSubmit = async (data: ReservationFormData) => {
    // Validate time is selected
    if (!data.reservation_time) {
      toast({
        title: 'Time Selection Required',
        description: 'Please select a time for your reservation',
        variant: 'destructive',
      })
      return
    }

    // Combine date and time into a single timestamp
    const [hours, minutes] = data.reservation_time.split(':').map(Number)
    const reservationDateTime = setMinutes(setHours(data.reservation_date, hours), minutes)

    setIsSubmitting(true)
    try {
      const idempotencyKey = generateReservationIdempotencyKey()
      
      // Submit reservation without table assignment - staff will assign table later
      const result = await submitReservation({
        table_id: null, // No table assigned - staff will assign later
        reservation_time: reservationDateTime.toISOString(),
        covers: data.covers,
        customer_name: data.customer_name,
        contact_phone: data.customer_phone,
        contact_email: data.customer_email,
        special_requests: data.special_requests || undefined,
        duration_hours: 2.0,
        idempotency_key: idempotencyKey,
      })

      toast({
        title: 'Reservation Confirmed!',
        description: 'Your reservation has been successfully created.',
      })

      onSuccess?.(result.reservation_id)
    } catch (error: any) {
      console.error('Reservation submission error:', error)
      toast({
        title: 'Reservation Failed',
        description: error.message || 'Failed to create reservation. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Make a Reservation</CardTitle>
        <CardDescription>
          Book your table for an unforgettable dining experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Date Selection */}
            <FormField
              control={form.control}
              name="reservation_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => isPast(startOfDay(date))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of Guests */}
            <FormField
              control={form.control}
              name="covers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Number of Guests
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            <FormField
              control={form.control}
              name="reservation_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </FormLabel>
                  {loadingTimeSlots ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading available times...
                    </div>
                  ) : availableTimes.size === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedDate && !isPast(startOfDay(selectedDate))
                        ? 'No available times for this date and party size. Please try a different date or party size.'
                        : 'Please select a valid date and party size'}
                    </p>
                  ) : (
                    <div className="flex gap-2 items-end">
                      {/* AM/PM Selector */}
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">Period</Label>
                        <Select value={selectedPeriod} onValueChange={(value: 'AM' | 'PM') => {
                          setSelectedPeriod(value)
                          setSelectedHour('')
                          setSelectedMinute('')
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Hour Selector */}
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">Hour</Label>
                        <Select 
                          value={selectedHour} 
                          onValueChange={(value) => {
                            setSelectedHour(value)
                            setSelectedMinute('')
                          }}
                          disabled={getAvailableHours().length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableHours().map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Minute Selector */}
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">Minute</Label>
                        <Select 
                          value={selectedMinute} 
                          onValueChange={setSelectedMinute}
                          disabled={!selectedHour || getAvailableMinutes().length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableMinutes().map((min) => (
                              <SelectItem key={min} value={min}>
                                {min}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Contact Information</h3>

              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Special Requests */}
            <FormField
              control={form.control}
              name="special_requests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requests or dietary requirements..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className={cn(
                  'flex-1 bg-foreground text-background hover:bg-foreground/90',
                  !onCancel && 'w-full'
                )}
                disabled={isSubmitting || !form.watch('reservation_time')}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Reservation'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

