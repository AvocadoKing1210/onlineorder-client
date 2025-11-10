'use client'

import { type ModifierGroupWithOptions } from '@/lib/api/menu'
import { ModifierOptionButton } from './ModifierOptionButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModifierGroupSelectorProps {
  group: ModifierGroupWithOptions
  selectedOptionIds: string[]
  onOptionToggle: (optionId: string) => void
}

export function ModifierGroupSelector({
  group,
  selectedOptionIds,
  onOptionToggle,
}: ModifierGroupSelectorProps) {
  // Use overrides if available, otherwise use group defaults
  const minSelect = group.min_select_override ?? group.min_select
  const maxSelect = group.max_select_override ?? group.max_select
  const required = group.required_override ?? group.required

  const selectedCount = selectedOptionIds.length
  const canSelectMore = selectedCount < maxSelect
  const mustSelectMore = selectedCount < minSelect
  const isInvalid = required && mustSelectMore

  const handleToggle = (optionId: string) => {
    const isSelected = selectedOptionIds.includes(optionId)
    
    if (isSelected) {
      // Deselect
      onOptionToggle(optionId)
    } else {
      // Select - check if we can select more
      if (canSelectMore) {
        onOptionToggle(optionId)
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-semibold text-base sm:text-lg text-foreground mb-1">
            {group.name}
            {required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {minSelect === maxSelect
              ? `Select ${minSelect} ${minSelect === 1 ? 'option' : 'options'}`
              : `Select ${minSelect} to ${maxSelect} options`}
            {selectedCount > 0 && (
              <span className="ml-1">
                ({selectedCount} selected)
              </span>
            )}
          </p>
        </div>
      </div>

      {isInvalid && (
        <Alert variant="destructive" className="py-2.5 px-3 bg-destructive/5 border-destructive/30 [&>svg]:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <AlertDescription className="text-xs sm:text-sm text-destructive/90 !pl-0">
              Please select at least {minSelect} {minSelect === 1 ? 'option' : 'options'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="space-y-2">
        {group.options.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id)
          const disabled = !isSelected && !canSelectMore

          return (
            <ModifierOptionButton
              key={option.id}
              option={option}
              selected={isSelected}
              onToggle={handleToggle}
              disabled={disabled}
            />
          )
        })}
      </div>
    </div>
  )
}

