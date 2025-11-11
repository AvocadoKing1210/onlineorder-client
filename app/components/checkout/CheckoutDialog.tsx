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
import { CheckoutForm, type CheckoutFormData } from './CheckoutForm'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CheckoutFormData) => void
  isSubmitting?: boolean
}

export function CheckoutDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CheckoutDialogProps) {
  const isMobile = useIsMobile()

  const checkoutContent = (
    <CheckoutForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh] flex flex-col">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl sm:text-2xl">
              Checkout
            </DrawerTitle>
            <DrawerDescription>
              Please provide your information to complete your order
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
            {checkoutContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Please provide your information to complete your order
          </DialogDescription>
        </DialogHeader>
        {checkoutContent}
      </DialogContent>
    </Dialog>
  )
}

