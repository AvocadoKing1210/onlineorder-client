'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { isAuthenticated } from '@/lib/auth'
import { getUserProfile as fetchUserProfile, type UserProfile } from '@/lib/api/profile'
import { useIsMobile } from '@/hooks/use-mobile'

// Form validation schema
const checkoutFormSchema = z.object({
  mode: z.enum(['dine_in', 'takeout'], {
    required_error: 'Please select an order mode',
  }),
  customer_name: z.string().min(1, 'Name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(1, 'Phone number is required'),
  special_instructions: z.string().optional(),
  save_to_profile: z.boolean().default(false),
  use_existing_profile: z.boolean().default(false),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => void
  isSubmitting?: boolean
}

export function CheckoutForm({ onSubmit, isSubmitting = false }: CheckoutFormProps) {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [useExistingProfile, setUseExistingProfile] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const isMobile = useIsMobile()

  // Check authentication and load profile
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await isAuthenticated()
        setIsUserAuthenticated(auth)

        if (auth) {
          try {
            const profile = await fetchUserProfile()
            if (profile) {
              setUserProfile(profile)
                // If profile exists, default to using it
                setUseExistingProfile(true)
            }
          } catch (error) {
            console.error('Error fetching user profile:', error)
          }
        }
      } catch (error) {
        console.error('Error checking auth/profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    checkAuth()
  }, [])

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      mode: 'takeout',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_instructions: '',
      save_to_profile: false,
      use_existing_profile: false,
    },
  })

  // Update form when user profile is loaded or when useExistingProfile changes
  useEffect(() => {
    if (userProfile && useExistingProfile) {
      form.setValue('customer_name', userProfile.display_name || '')
      form.setValue('customer_email', userProfile.email)
      form.setValue('customer_phone', userProfile.phone_number || '')
      form.setValue('use_existing_profile', true)
    } else if (!useExistingProfile) {
      form.setValue('customer_name', '')
      form.setValue('customer_email', '')
      form.setValue('customer_phone', '')
      form.setValue('use_existing_profile', false)
    }
  }, [userProfile, useExistingProfile, form])

  const handleSubmit = (data: CheckoutFormData) => {
    onSubmit(data)
  }

  if (loadingProfile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Order Mode Selection */}
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="takeout">Takeout</SelectItem>
                  <SelectItem value="dine_in">Dine In</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* For logged-in users with profile: Option to use existing profile */}
        {isUserAuthenticated && userProfile && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-existing-profile"
                checked={useExistingProfile}
                onCheckedChange={(checked) => {
                  setUseExistingProfile(checked === true)
                  form.setValue('use_existing_profile', checked === true)
                }}
                className="border-foreground data-[state=checked]:bg-foreground data-[state=checked]:border-foreground data-[state=checked]:text-background"
              />
              <Label
                htmlFor="use-existing-profile"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use my saved information
              </Label>
            </div>
            {useExistingProfile && userProfile && (
              <div className="mt-4 rounded-md border border-border bg-muted/30 p-4 text-sm">
                <p className="mb-2 text-muted-foreground">Saved contact details</p>
                <div className="space-y-1">
                  <p className="font-medium">
                    {userProfile.display_name || 'Name not set'}
                  </p>
                  <p>{userProfile.email}</p>
                  <p>{userProfile.phone_number || 'Phone number not set'}</p>
                </div>
              </div>
            )}
            {useExistingProfile && <Separator />}
          </>
        )}

        {/* Customer Information */}
        {(!isUserAuthenticated || !userProfile || !useExistingProfile) && (
          <>
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
                    <div className="flex items-center gap-2">
                      <FormLabel>Phone Number</FormLabel>
                      {!isMobile && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>We'll use this to contact you about your order</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isMobile && (
                        <span className="text-xs text-muted-foreground">
                          We'll use this to contact you about your order
                        </span>
                      )}
                    </div>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Save to profile option (for logged-in users without profile or when not using existing) */}
            {isUserAuthenticated && (
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="save_to_profile"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-foreground data-[state=checked]:bg-foreground data-[state=checked]:border-foreground data-[state=checked]:text-background"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FormLabel>Save this information to my profile</FormLabel>
                          {!isMobile && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>We'll remember your information for future orders</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {isMobile && (
                          <p className="text-xs text-muted-foreground mt-1">
                            We'll remember your information for future orders
                          </p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </>
        )}

        {/* Special Instructions */}
        <FormField
          control={form.control}
          name="special_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requests or notes for your order..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full bg-foreground text-background hover:bg-foreground/90 border-transparent" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting Order...' : 'Submit Order'}
        </Button>
        </form>
      </Form>
    </TooltipProvider>
  )
}

