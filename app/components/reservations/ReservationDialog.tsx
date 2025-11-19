'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReservationForm } from './ReservationForm'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

interface ReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReservationDialog({ open, onOpenChange }: ReservationDialogProps) {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make a Reservation</DialogTitle>
          <DialogDescription>
            Book your table for an unforgettable dining experience
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  )
}

