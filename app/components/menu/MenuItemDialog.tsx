'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ModifierGroupSelector } from './ModifierGroupSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  type MenuItemWithModifiers,
  type ModifierGroupWithOptions,
  getMenuItemWithModifiers,
} from '@/lib/api/menu'
import { parseAllImageUrls } from '@/lib/utils'
import { Plus, Minus } from 'lucide-react'
import { ImageCarousel } from './ImageCarousel'

interface MenuItemDialogProps {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: (item: MenuItemWithModifiers, selectedModifiers: Record<string, string[]>, quantity: number) => void
}

export function MenuItemDialog({
  itemId,
  open,
  onOpenChange,
  onAddToCart,
}: MenuItemDialogProps) {
  const isMobile = useIsMobile()
  const [item, setItem] = useState<MenuItemWithModifiers | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [quantity, setQuantity] = useState(1)

  // Reset state when dialog opens/closes or item changes
  useEffect(() => {
    if (!open || !itemId) {
      setItem(null)
      setSelectedModifiers({})
      setErrors({})
      setQuantity(1)
      return
    }

    // Fetch item details
    setLoading(true)
    getMenuItemWithModifiers(itemId)
      .then((data) => {
        setItem(data)
        // Initialize selected modifiers
        if (data) {
          const initial: Record<string, string[]> = {}
          data.modifier_groups.forEach((group) => {
            initial[group.id] = []
          })
          setSelectedModifiers(initial)
        }
      })
      .catch((error) => {
        console.error('Error fetching menu item:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open, itemId])

  const handleOptionToggle = (groupId: string, optionId: string) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || []
      const isSelected = current.includes(optionId)
      
      return {
        ...prev,
        [groupId]: isSelected
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      }
    })
    
    // Clear error for this group when user interacts
    setErrors((prev) => {
      const next = { ...prev }
      delete next[groupId]
      return next
    })
  }

  const validateModifiers = (): boolean => {
    if (!item) return false

    const newErrors: Record<string, boolean> = {}
    let isValid = true

    item.modifier_groups.forEach((group) => {
      const minSelect = group.min_select_override ?? group.min_select
      const required = group.required_override ?? group.required
      const selected = selectedModifiers[group.id] || []
      const count = selected.length

      if (required && count < minSelect) {
        newErrors[group.id] = true
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleAddToCart = () => {
    if (!item) return

    if (!validateModifiers()) {
      return
    }

    onAddToCart(item, selectedModifiers, quantity)
    onOpenChange(false)
  }

  const calculateTotalPrice = (): number => {
    if (!item) return 0

    const basePrice = parseFloat(item.price)
    let modifierTotal = 0

    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      const group = item.modifier_groups.find((g) => g.id === groupId)
      if (group) {
        optionIds.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId)
          if (option) {
            modifierTotal += parseFloat(option.price_delta)
          }
        })
      }
    })

    return (basePrice + modifierTotal) * quantity
  }

  // Shared content component
  const content = (
    <>
      {loading ? (
        <div className="px-4 sm:px-6 space-y-4 overflow-y-auto scrollbar-hide flex-1 min-h-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : item ? (
        <>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 px-4 sm:px-6 flex-1 min-h-0 overflow-hidden">
            {/* Image - Left Side (Fixed) */}
            <div className="flex-shrink-0 sm:w-72 flex flex-col gap-3">
              <ImageCarousel 
                images={parseAllImageUrls(item.image_url)} 
                alt={item.name}
                className="h-48 sm:h-auto"
              />

              {/* Dietary Tags - Under Image */}
              {item.dietary_tags && item.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.dietary_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content - Right Side (Scrollable) */}
            <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide space-y-4 sm:space-y-6 pb-4">
              {/* Availability Notes */}
              {item.availability_notes && (
                <p className="text-sm text-muted-foreground italic">
                  {item.availability_notes}
                </p>
              )}

              <Separator />

              {/* Modifier Groups */}
              {item.modifier_groups.length > 0 ? (
                <div className="space-y-6">
                  {item.modifier_groups.map((group) => (
                    <ModifierGroupSelector
                      key={group.id}
                      group={group}
                      selectedOptionIds={selectedModifiers[group.id] || []}
                      onOptionToggle={(optionId) =>
                        handleOptionToggle(group.id, optionId)
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No customization options available for this item.
                </p>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t pt-4 gap-3 sm:gap-2 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between w-full sm:w-auto mb-3 sm:mb-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium text-sm">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 sm:ml-6">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-geist text-base sm:text-lg text-foreground">
                  ${calculateTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 tracking-tight whitespace-normal h-12 sm:h-auto sm:min-h-9"
            >
              <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1.5 flex-shrink-0" />
              <span className="text-sm sm:text-xs">Add to Cart</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="px-4 sm:px-6 pb-6 text-center">
          <p className="text-muted-foreground">Item not found</p>
        </div>
      )}
    </>
  )

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle className="text-xl font-display">
              {loading ? 'Loading...' : item ? item.name : 'Menu Item'}
            </DrawerTitle>
            {item && (
              <DrawerDescription className="text-sm">
                {item.description || 'Customize your selection'}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 sm:p-6">
        <DialogHeader className="px-6 pt-6 pb-4 sm:px-0 sm:pt-0 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-display">
            {loading ? 'Loading...' : item ? item.name : 'Menu Item'}
          </DialogTitle>
          {item && (
            <DialogDescription className="text-sm sm:text-base">
              {item.description || 'Customize your selection'}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}

