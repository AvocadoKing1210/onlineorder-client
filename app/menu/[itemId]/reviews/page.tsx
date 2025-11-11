'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Star } from 'lucide-react'
import { MenuItemReviews } from '@/components/menu/MenuItemReviews'
import { getMenuItemWithModifiers } from '@/lib/api/menu'
import { parseImageUrl, isValidUrl } from '@/lib/utils'
import Image from 'next/image'
import { ImageCarousel } from '@/components/menu/ImageCarousel'
import { parseAllImageUrls } from '@/lib/utils'

interface PageProps {
  params: Promise<{ itemId: string }>
}

export default function MenuItemReviewsPage({ params }: PageProps) {
  const { itemId } = use(params)
  const router = useRouter()

  // Fetch menu item details
  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['menuItem', itemId],
    queryFn: () => getMenuItemWithModifiers(itemId),
  })

  if (itemLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Menu Item Not Found</h1>
          <p className="text-muted-foreground">The menu item you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/order')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
        </div>
      </div>
    )
  }

  const images = parseAllImageUrls(item.image_url)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Menu Item Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Image */}
              {images.length > 0 && (
                <div className="flex-shrink-0 sm:w-48">
                  <ImageCarousel 
                    images={images} 
                    alt={item.name}
                    className="h-48 sm:h-auto"
                  />
                </div>
              )}

              {/* Item Info */}
              <div className="flex-1 space-y-2">
                <CardTitle className="text-2xl">{item.name}</CardTitle>
                {item.description && (
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <span className="font-geist text-xl text-foreground">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardContent className="pt-6">
            <MenuItemReviews 
              menuItemId={itemId} 
              menuItemName={item.name}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

