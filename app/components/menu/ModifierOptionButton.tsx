'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { type ModifierOption } from '@/lib/api/menu'
import { cn } from '@/lib/utils'

interface ModifierOptionButtonProps {
  option: ModifierOption
  selected: boolean
  onToggle: (optionId: string) => void
  disabled?: boolean
}

export function ModifierOptionButton({
  option,
  selected,
  onToggle,
  disabled = false,
}: ModifierOptionButtonProps) {
  const priceDelta = parseFloat(option.price_delta)
  const hasPriceDelta = priceDelta !== 0

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      className={cn(
        'w-full justify-start text-left h-auto py-3 px-4 rounded-md border transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border bg-background hover:bg-accent hover:text-accent-foreground',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      onClick={() => !disabled && onToggle(option.id)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onToggle(option.id)
        }
      }}
    >
      <div className="flex items-center gap-3 w-full">
        <Checkbox
          checked={selected}
          onCheckedChange={() => !disabled && onToggle(option.id)}
          disabled={disabled}
          className="flex-shrink-0 pointer-events-none"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm sm:text-base">
            {option.name}
          </div>
        </div>
        {hasPriceDelta && (
          <div className="flex-shrink-0 text-sm sm:text-base font-geist">
            {priceDelta > 0 ? '+' : ''}${priceDelta.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}

