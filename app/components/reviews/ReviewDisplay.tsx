'use client'

import { Star, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Review } from '@/lib/api/reviews'
import { formatDistanceToNow } from 'date-fns'

interface ReviewDisplayProps {
  review: Review
  showUser?: boolean
}

export function ReviewDisplay({ review, showUser = false }: ReviewDisplayProps) {
  const displayName = review.user_profile?.display_name
  const avatarUrl = review.user_profile?.avatar_url
  const initials = displayName
    ? displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null

  return (
    <div className="space-y-3 border-b pb-4 last:border-b-0">
      {/* User Info and Rating */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={displayName || 'User'} />
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            {initials || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* User Name and Date */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              {displayName || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-3.5 w-3.5',
                  star <= review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                )}
              />
            ))}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              {review.rating}
            </span>
          </div>

          {/* Review Text */}
          {review.text && (
            <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface ReviewListProps {
  reviews: Review[]
  showUser?: boolean
  emptyMessage?: string
}

export function ReviewList({ reviews, showUser = false, emptyMessage = 'No reviews yet' }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewDisplay key={review.id} review={review} showUser={showUser} />
      ))}
    </div>
  )
}

interface RatingSummaryProps {
  average: number
  count: number
}

export function RatingSummary({ average, count }: RatingSummaryProps) {
  const fullStars = Math.floor(average)
  const hasHalfStar = average % 1 >= 0.5

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= fullStars) {
            return (
              <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            )
          } else if (star === fullStars + 1 && hasHalfStar) {
            return (
              <div key={star} className="relative h-5 w-5">
                <Star className="h-5 w-5 fill-gray-200 text-gray-300" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            )
          } else {
            return (
              <Star key={star} className="h-5 w-5 fill-gray-200 text-gray-300" />
            )
          }
        })}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">{average.toFixed(1)}</span>
        <Badge variant="secondary" className="text-xs">
          {count} {count === 1 ? 'review' : 'reviews'}
        </Badge>
      </div>
    </div>
  )
}

