'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewList, RatingSummary } from '@/components/reviews/ReviewDisplay'
import { ReviewDialog } from '@/components/reviews/ReviewDialog'
import { 
  getMenuItemReviews, 
  hasUserReviewedMenuItem,
  getMenuItemAverageRating,
  submitReview,
  type ReviewSubmissionRequest 
} from '@/lib/api/reviews'
import { useToast } from '@/hooks/use-toast'
import { getUser } from '@/lib/auth'
import { AuthDialog } from '@/components/AuthDialog'
import { Star, MessageSquare, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItemReviewsProps {
  menuItemId: string
  menuItemName: string
  className?: string
}

export function MenuItemReviews({ 
  menuItemId, 
  menuItemName,
  className 
}: MenuItemReviewsProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getUser()
      setIsAuthenticated(!!user?.sub)
    }
    checkAuth()
  }, [])

  // Fetch reviews
  const { data: reviews = [], refetch: refetchReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['menuItemReviews', menuItemId],
    queryFn: () => getMenuItemReviews(menuItemId),
  })

  // Check if user has reviewed
  const { data: hasReviewed = false } = useQuery({
    queryKey: ['hasReviewed', menuItemId],
    queryFn: () => hasUserReviewedMenuItem(menuItemId),
    enabled: isAuthenticated,
  })

  // Get average rating
  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: ['averageRating', menuItemId],
    queryFn: () => getMenuItemAverageRating(menuItemId),
  })

  const handleOpenReviewDialog = () => {
    if (!isAuthenticated) {
      setIsAuthDialogOpen(true)
      return
    }
    setIsReviewDialogOpen(true)
  }

  const handleSubmitReview = async (data: { rating: number; text: string }) => {
    try {
      const request: ReviewSubmissionRequest = {
        menu_item_id: menuItemId,
        rating: data.rating,
        text: data.text || undefined,
      }

      await submitReview(request)
      
      toast({
        title: 'Review submitted!',
        description: 'Your review has been submitted and is pending moderation.',
      })

      setIsReviewDialogOpen(false)
      refetchReviews()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Reviews</h3>
          </div>
          {/* Rating Summary - below Reviews title, smaller */}
          {ratingLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : ratingData ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const fullStars = Math.floor(ratingData.average)
                  const hasHalfStar = ratingData.average % 1 >= 0.5
                  if (star <= fullStars) {
                    return (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )
                  } else if (star === fullStars + 1 && hasHalfStar) {
                    return (
                      <div key={star} className="relative h-3 w-3">
                        <Star className="h-3 w-3 fill-gray-200 text-gray-300" />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <Star key={star} className="h-3 w-3 fill-gray-200 text-gray-300" />
                    )
                  }
                })}
              </div>
              <span className="text-xs font-semibold">{ratingData.average.toFixed(1)}</span>
              <Badge variant="secondary" className="text-xs h-3.5 px-1.5 rounded-full">
                {ratingData.count} {ratingData.count === 1 ? 'review' : 'reviews'}
              </Badge>
            </div>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenReviewDialog}
          disabled={hasReviewed}
          className="gap-2"
        >
          {hasReviewed ? (
            <>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Reviewed
            </>
          ) : (
            <>
              <SquarePen className="h-4 w-4" />
              Write Review
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Reviews List */}
      {reviewsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <ReviewList 
          reviews={reviews} 
          emptyMessage="Be the first to review this item!"
        />
      )}

      {/* Review Dialog */}
      <ReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        onSubmit={handleSubmitReview}
        menuItemName={menuItemName}
      />

      {/* Auth Dialog */}
      <AuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onSuccess={async () => {
          setIsAuthDialogOpen(false)
          // Refresh authentication status
          const user = await getUser()
          setIsAuthenticated(!!user?.sub)
        }}
      />
    </div>
  )
}

