'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type MenuItemWithCategory } from '@/lib/api/menu'
import { isValidUrl, parseImageUrl } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getMenuItemAverageRating } from '@/lib/api/reviews'
import { Plus, Star } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface MenuItemCardProps {
  item: MenuItemWithCategory
  onSelect: (item: MenuItemWithCategory) => void
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const price = parseFloat(item.price)
  const imageUrl = parseImageUrl(item.image_url)
  const hasImage = isValidUrl(imageUrl)
  const primaryTag = item.dietary_tags?.[0] ?? null
  const [shouldFetchRating, setShouldFetchRating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Only fetch rating when card is visible in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldFetchRating(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // Fetch average rating only when visible
  const { data: ratingData } = useQuery({
    queryKey: ['averageRating', item.id],
    queryFn: () => getMenuItemAverageRating(item.id),
    enabled: shouldFetchRating, // Only fetch when card is visible
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return (
    <Card ref={cardRef} className="group hover:shadow-md transition-shadow border-card-border overflow-hidden w-full">
      <CardContent className="p-0">
        <div className="flex flex-row gap-0">
          {/* Image */}
          {hasImage ? (
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 overflow-hidden">
              <Image
                src={imageUrl!}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 112px, 144px"
                loading="lazy"
                unoptimized={imageUrl?.startsWith('http')}
              />
              {primaryTag && (
                <Badge 
                  variant="outline"
                  className="absolute top-2 left-2 z-20 text-xs px-2 py-0.5 rounded-full bg-background/95 border-background/50 backdrop-blur-sm"
                >
                  {primaryTag}
                </Badge>
              )}
            </div>
          ) : (
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 bg-muted flex items-center justify-center">
              {primaryTag && (
                <Badge 
                  variant="outline"
                  className="absolute top-2 left-2 z-20 text-xs px-2 py-0.5 rounded-full bg-background/95 border-background/50 backdrop-blur-sm"
                >
                  {primaryTag}
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">No Image</span>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 px-2.5 sm:px-3 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2 flex flex-col min-h-0 h-28 sm:h-36">
            <div className="flex-1 min-h-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                  {item.name}
                </h3>
              </div>
              
              {item.description && (
                <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">
                  {item.description}
                </p>
              )}
              
              {/* Rating */}
              {ratingData && (
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="flex items-center gap-0.5">
                    <Star className={cn(
                      "h-3 w-3",
                      "fill-yellow-400 text-yellow-400"
                    )} />
                    <span className="text-xs font-medium text-foreground">
                      {ratingData.average.toFixed(1)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs h-4 px-1.5 rounded-full">
                    {ratingData.count}
                  </Badge>
                </div>
              )}
              
              {/* Availability Notes */}
              {item.availability_notes && (
                <p className="text-xs text-muted-foreground italic mb-1.5">
                  {item.availability_notes}
                </p>
              )}
            </div>
            
            {/* Price and Add Button Row */}
            <div className="flex items-center justify-between gap-2 mt-auto">
              <span className="font-geist text-base sm:text-lg text-foreground whitespace-nowrap">
                ${price.toFixed(2)}
              </span>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(item)
                }}
                variant="ghost"
                className="bg-foreground text-background hover:bg-foreground/90 rounded-lg border-0"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

