'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReviewFormData {
  rating: number
  text: string
}

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => void
  isSubmitting?: boolean
  initialRating?: number
  initialText?: string
}

export function ReviewForm({
  onSubmit,
  isSubmitting = false,
  initialRating = 0,
  initialText = '',
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [text, setText] = useState(initialText)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating < 1 || rating > 5) {
      return
    }

    onSubmit({
      rating,
      text: text.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Selection */}
      <div className="space-y-2">
        <Label htmlFor="rating" className="text-base font-medium">
          Rating <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= (hoveredRating || rating)
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    isActive
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-300 hover:fill-gray-300 hover:text-gray-400'
                  )}
                />
              </button>
            )
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} {rating === 1 ? 'star' : 'stars'}
            </span>
          )}
        </div>
        {rating === 0 && (
          <p className="text-sm text-muted-foreground">
            Please select a rating
          </p>
        )}
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <Label htmlFor="review-text">
          Review (Optional)
        </Label>
        <Textarea
          id="review-text"
          placeholder="Share your experience with this item..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={2000}
          className="resize-none"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Optional but helps others make better choices</span>
          <span>{text.length}/2000</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={rating < 1 || rating > 5 || isSubmitting}
          className="min-w-[120px] bg-black text-white hover:bg-black/90 border-transparent"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  )
}

