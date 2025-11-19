import { getMenuCategories, getMenuItems } from '@/lib/api/menu'
import OrderPageClient from './OrderPageClient'

// Revalidate every minute to keep menu fresh but performant
export const revalidate = 60

export default async function OrderPage() {
  // Fetch data on the server in parallel
  const [categories, menuItems] = await Promise.all([
    getMenuCategories(),
    getMenuItems()
  ])

  return (
    <OrderPageClient
      initialCategories={categories}
      initialMenuItems={menuItems}
    />
  )
}

