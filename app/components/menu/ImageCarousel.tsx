'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isValidUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  images: string[]
  alt: string
  className?: string
}

export function ImageCarousel({ images, alt, className }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const validImages = images.filter(url => isValidUrl(url))

  if (validImages.length === 0) {
    return (
      <div className={cn("relative w-full aspect-square sm:aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center", className)}>
        <span className="text-muted-foreground">No Image Available</span>
      </div>
    )
  }

  if (validImages.length === 1) {
    return (
      <div className={cn("relative w-full h-48 sm:h-auto sm:aspect-square rounded-lg bg-muted flex items-center justify-center", className)}>
        <Image
          src={validImages[0]}
          alt={alt}
          fill
          className="object-contain sm:object-cover"
          sizes="(max-width: 640px) 100vw, 288px"
          quality={85}
        />
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  // Swipe handlers
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    }
    if (isRightSwipe) {
      goToPrevious()
    }
  }

  return (
    <div 
      className={cn("relative w-full h-48 sm:h-auto sm:aspect-square rounded-lg bg-muted flex items-center justify-center group touch-pan-y", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Current Image */}
      <Image
        src={validImages[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        fill
        className="object-contain sm:object-cover transition-opacity duration-300"
        sizes="(max-width: 640px) 100vw, 288px"
        quality={85}
      />

      {/* Navigation Buttons */}
      <button
        type="button"
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-full z-10 shadow-md flex items-center justify-center border-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          goToPrevious()
        }}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-full z-10 shadow-md flex items-center justify-center border-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          goToNext()
        }}
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {validImages.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              index === currentIndex
                ? "bg-background w-4"
                : "bg-background/50 hover:bg-background/70"
            )}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex(index)
            }}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

