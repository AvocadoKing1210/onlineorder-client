'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewDialog } from '@/components/reviews/ReviewDialog'
import { ReviewList, RatingSummary } from '@/components/reviews/ReviewDisplay'
import { 
  submitReview, 
  getMenuItemReviews, 
  hasUserReviewedMenuItem,
  getMenuItemAverageRating,
  type ReviewSubmissionRequest 
} from '@/lib/api/reviews'
import { getMenuItems, type MenuItem } from '@/lib/api/menu'
import { useToast } from '@/hooks/use-toast'
import { getUser, isAuthenticated } from '@/lib/auth'
import { AuthDialog } from '@/components/AuthDialog'
import { Star } from 'lucide-react'

export default function ReviewTestPage() {
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getUser()
      setUser(currentUser)
    }
    checkAuth()
  }, [])

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => getMenuItems(),
  })

  // Fetch reviews for selected menu item
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', selectedMenuItemId],
    queryFn: () => selectedMenuItemId ? getMenuItemReviews(selectedMenuItemId) : [],
    enabled: !!selectedMenuItemId,
  })

  // Check if user has reviewed
  const { data: hasReviewed = false } = useQuery({
    queryKey: ['hasReviewed', selectedMenuItemId, user?.sub],
    queryFn: () => selectedMenuItemId && user?.sub ? hasUserReviewedMenuItem(selectedMenuItemId) : false,
    enabled: !!selectedMenuItemId && !!user?.sub,
  })

  // Get average rating
  const { data: ratingData } = useQuery({
    queryKey: ['averageRating', selectedMenuItemId],
    queryFn: () => selectedMenuItemId ? getMenuItemAverageRating(selectedMenuItemId) : null,
    enabled: !!selectedMenuItemId,
  })

  const handleOpenReviewDialog = (menuItemId: string) => {
    if (!isAuthenticated()) {
      setIsAuthDialogOpen(true)
      return
    }
    setSelectedMenuItemId(menuItemId)
    setIsReviewDialogOpen(true)
  }

  const handleSubmitReview = async (data: { rating: number; text: string }) => {
    if (!selectedMenuItemId) return

    try {
      const request: ReviewSubmissionRequest = {
        menu_item_id: selectedMenuItemId,
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

  const selectedMenuItem = menuItems.find(item => item.id === selectedMenuItemId)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Review Test Page</h1>
          <p className="text-muted-foreground">
            Test review submission and display functionality
          </p>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <p className="text-sm">Logged in as: {user.email || user.sub}</p>
                <p className="text-xs text-muted-foreground">User ID: {user.sub}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Not authenticated</p>
                <Button onClick={() => setIsAuthDialogOpen(true)}>
                  Log In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardHeader>
            <CardTitle>Select Menu Item to Review</CardTitle>
            <CardDescription>
              Choose a menu item to view or submit a review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {menuItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No menu items available</p>
              ) : (
                menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedMenuItemId(item.id)}
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenReviewDialog(item.id)
                      }}
                    >
                      {item.id === selectedMenuItemId && hasReviewed
                        ? 'Update Review'
                        : 'Review'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Menu Item Reviews */}
        {selectedMenuItemId && selectedMenuItem && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedMenuItem.name}</CardTitle>
              <CardDescription>{selectedMenuItem.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating Summary */}
              {ratingData && (
                <div>
                  <RatingSummary average={ratingData.average} count={ratingData.count} />
                </div>
              )}

              {/* Submit Review Button */}
              <div>
                <Button
                  onClick={() => handleOpenReviewDialog(selectedMenuItemId)}
                  disabled={hasReviewed}
                >
                  {hasReviewed ? (
                    <>
                      <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                      You&apos;ve already reviewed this item
                    </>
                  ) : (
                    'Write a Review'
                  )}
                </Button>
              </div>

              {/* Reviews List */}
              <div>
                <h3 className="font-semibold mb-3">Reviews</h3>
                <ReviewList reviews={reviews} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        onSubmit={handleSubmitReview}
        menuItemName={selectedMenuItem?.name}
      />

      {/* Auth Dialog */}
      <AuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onSuccess={() => {
          setIsAuthDialogOpen(false)
          // Refresh user state
          getUser().then(setUser)
        }}
      />
    </div>
  )
}

