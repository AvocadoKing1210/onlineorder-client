'use client'

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
import { useIsMobile } from '@/hooks/use-mobile'
import { ReviewForm, type ReviewFormData } from './ReviewForm'

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ReviewFormData) => void
  isSubmitting?: boolean
  menuItemName?: string
  initialRating?: number
  initialText?: string
}

export function ReviewDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  menuItemName,
  initialRating,
  initialText,
}: ReviewDialogProps) {
  const isMobile = useIsMobile()

  const reviewContent = (
    <ReviewForm
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialRating={initialRating}
      initialText={initialText}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh] flex flex-col">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl sm:text-2xl">
              Write a Review
            </DrawerTitle>
            <DrawerDescription>
              {menuItemName ? `Share your thoughts about ${menuItemName}` : 'Share your experience'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
            {reviewContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            {menuItemName ? `Share your thoughts about ${menuItemName}` : 'Share your experience'}
          </DialogDescription>
        </DialogHeader>
        {reviewContent}
      </DialogContent>
    </Dialog>
  )
}

