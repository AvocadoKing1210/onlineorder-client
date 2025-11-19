'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ReservationForm } from './ReservationForm'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

interface ReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReservationDialog({ open, onOpenChange }: ReservationDialogProps) {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)
  const isMobile = useIsMobile()

  const handleSuccess = (reservationId: string) => {
    setIsSuccess(true)
    // Close dialog after a short delay to show success message
    setTimeout(() => {
      onOpenChange(false)
      setIsSuccess(false)
      // Optionally redirect or refresh
      router.refresh()
    }, 2000)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setIsSuccess(false)
  }

  const content = (
    <>
      {isSuccess ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold mb-2">Reservation Confirmed!</h3>
          <p className="text-muted-foreground">
            Your reservation has been successfully created. We look forward to seeing you!
          </p>
        </div>
      ) : (
        <ReservationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      )}
    </>
  )

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh] flex flex-col">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl sm:text-2xl">
              Make a Reservation
            </DrawerTitle>
            <DrawerDescription>
              Book your table for an unforgettable dining experience
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make a Reservation</DialogTitle>
          <DialogDescription>
            Book your table for an unforgettable dining experience
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

