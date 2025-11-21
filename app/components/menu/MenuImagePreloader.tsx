'use client'

import { useEffect } from 'react'
import { type MenuItemWithCategory } from '@/lib/api/menu'
import { parseImageUrl, isValidUrl } from '@/lib/utils'

interface MenuImagePreloaderProps {
  items: MenuItemWithCategory[]
}

/**
 * Aggressively preloads ALL menu item images immediately
 * This ensures images are already cached when users scroll to them
 * Trading initial bandwidth for better UX (no blank spaces during scrolling)
 */
export function MenuImagePreloader({ items }: MenuImagePreloaderProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || items.length === 0) return

    // Extract all valid image URLs
    const imageUrls = items
      .map(item => parseImageUrl(item.image_url))
      .filter(url => isValidUrl(url)) as string[]

    console.log(`[Image Preloader] Starting aggressive preload of ${imageUrls.length} images...`)

    // Strategy 1: Create link preload elements for the first batch (highest priority)
    const firstBatchSize = 12
    const firstBatchUrls = imageUrls.slice(0, firstBatchSize)
    const linkElements: HTMLLinkElement[] = []
    
    firstBatchUrls.forEach((url, index) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      link.fetchPriority = 'high'
      document.head.appendChild(link)
      linkElements.push(link)
    })

    // Strategy 2: Use Image() constructor for remaining images (parallel download)
    const remainingUrls = imageUrls.slice(firstBatchSize)
    const imageElements: HTMLImageElement[] = []
    
    // Preload in small batches to avoid overwhelming the browser
    const preloadRemaining = async () => {
      const batchSize = 6
      for (let i = 0; i < remainingUrls.length; i += batchSize) {
        const batch = remainingUrls.slice(i, i + batchSize)
        
        // Preload this batch
        batch.forEach(url => {
          const img = new Image()
          img.src = url
          imageElements.push(img)
        })
        
        // Small delay between batches to avoid blocking
        if (i + batchSize < remainingUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
      
      console.log(`[Image Preloader] Preloaded ${imageUrls.length} images`)
    }

    // Start preloading immediately (no delay)
    preloadRemaining()

    // Cleanup function
    return () => {
      // Remove link elements from head
      linkElements.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
      
      // Clear image references
      imageElements.length = 0
    }
  }, [items])

  // This component doesn't render anything
  return null
}

