'use client'

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
  if (items.length === 0) {
    return null
  }

  return (
    <section className="mb-12 sm:mb-16">
      <div className="mb-6 sm:mb-8">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground mb-2">
          {category.name}
        </h2>
        <Separator />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onSelect={onItemSelect}
          />
        ))}
      </div>
    </section>
  )
}

