'use client'

import { useEffect, useRef, useState } from 'react'
import { type MenuItemWithCategory, type MenuCategory } from '@/lib/api/menu'
import { MenuItemCard } from './MenuItemCard'
import { Separator } from '@/components/ui/separator'

interface MenuCategorySectionProps {
  category: MenuCategory
  items: MenuItemWithCategory[]
  onItemSelect: (item: MenuItemWithCategory) => void
}

export function MenuCategorySection({
  category,
  items,
  onItemSelect,
}: MenuCategorySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            // Once visible, stop observing
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '200px', // Start loading 200px before section comes into view
        threshold: 0.01,
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  if (items.length === 0) {
    return null
  }

  return (
    <section ref={sectionRef} className="mb-12 sm:mb-16">
      <div className="mb-6 sm:mb-8">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground mb-2">
          {category.name}
        </h2>
        <Separator />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isVisible ? (
          items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onSelect={onItemSelect}
            />
          ))
        ) : (
          // Render placeholder skeletons for unloaded items
          items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="h-28 sm:h-36 bg-muted animate-pulse rounded-lg"
            />
          ))
        )}
      </div>
    </section>
  )
}

