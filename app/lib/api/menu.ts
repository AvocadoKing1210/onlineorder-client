import { getSupabaseClientForAPI } from './client'

// Types
export interface MenuCategory {
  id: string
  name: string
  position: number
  visible: boolean
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: string // NUMERIC(12, 2) as string
  image_url: string | null
  video_ref: string | null
  position: number
  visible: boolean
  dietary_tags: string[] | null
  availability_notes: string | null
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
  }
}

export interface ModifierGroup {
  id: string
  name: string
  min_select: number
  max_select: number
  required: boolean
  position: number
  visible: boolean
}

export interface ModifierOption {
  id: string
  modifier_group_id: string
  name: string
  price_delta: string // NUMERIC(12, 2) as string
  position: number
  visible: boolean
  available: boolean
}

export interface ModifierGroupWithOptions extends ModifierGroup {
  options: ModifierOption[]
  // Item-specific overrides
  min_select_override?: number | null
  max_select_override?: number | null
  required_override?: boolean | null
}

export interface MenuItemWithModifiers extends MenuItem {
  modifier_groups: ModifierGroupWithOptions[]
}

export interface MenuItemWithCategory extends MenuItem {
  category: {
    id: string
    name: string
  }
}

export interface MenuItemFilters {
  category_id?: string
  search?: string
  dietary_tags?: string[]
}

// API Functions

/**
 * Fetch visible menu categories ordered by position
 */
export async function getMenuCategories(): Promise<MenuCategory[]> {
  const supabase = await getSupabaseClientForAPI()
  
  const { data, error } = await supabase
    .from('menu_category')
    .select('*')
    .eq('visible', true)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching menu categories:', error)
    throw new Error(`Failed to fetch menu categories: ${error.message}`)
  }

  return data || []
}

/**
 * Fetch visible menu items with their categories
 * Automatically excludes soft-deleted items (deleted_at IS NULL)
 */
export async function getMenuItems(filters?: MenuItemFilters): Promise<MenuItemWithCategory[]> {
  const supabase = await getSupabaseClientForAPI()
  
  let query = supabase
    .from('menu_item')
    .select(`
      *,
      category:menu_category (
        id,
        name
      )
    `)
    .eq('visible', true)
    .is('deleted_at', null) // Exclude soft-deleted items

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters?.dietary_tags && filters.dietary_tags.length > 0) {
    query = query.contains('dietary_tags', filters.dietary_tags)
  }

  query = query.order('position', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching menu items:', error)
    throw new Error(`Failed to fetch menu items: ${error.message}`)
  }

  // Transform the data to match our type
  return (data || []).map((item: any) => ({
    ...item,
    category: Array.isArray(item.category) ? item.category[0] : item.category,
  }))
}

/**
 * Fetch menu item with full details including modifier groups
 * Automatically excludes soft-deleted items (deleted_at IS NULL)
 */
export async function getMenuItemWithModifiers(id: string): Promise<MenuItemWithModifiers | null> {
  const supabase = await getSupabaseClientForAPI()
  
  // First, get the menu item
  const { data: item, error: itemError } = await supabase
    .from('menu_item')
    .select('*')
    .eq('id', id)
    .eq('visible', true)
    .is('deleted_at', null) // Exclude soft-deleted items
    .single()

  if (itemError || !item) {
    console.error('Error fetching menu item:', itemError)
    return null
  }

  // Get modifier groups for this item
  const modifierGroups = await getMenuItemModifierGroups(id)

  return {
    ...(item as MenuItem),
    modifier_groups: modifierGroups,
  }
}

/**
 * Fetch modifier groups for a menu item with their options
 */
export async function getMenuItemModifierGroups(menuItemId: string): Promise<ModifierGroupWithOptions[]> {
  const supabase = await getSupabaseClientForAPI()
  
  // Get the junction table entries with overrides
  const { data: itemModifierGroups, error: junctionError } = await supabase
    .from('menu_item_modifier_group')
    .select(`
      min_select_override,
      max_select_override,
      required_override,
      modifier_group:menu_modifier_group (
        id,
        name,
        min_select,
        max_select,
        required,
        position,
        visible
      )
    `)
    .eq('menu_item_id', menuItemId)
    .order('position', { ascending: true })

  if (junctionError) {
    console.error('Error fetching item modifier groups:', junctionError)
    throw new Error(`Failed to fetch modifier groups: ${junctionError.message}`)
  }

  if (!itemModifierGroups || itemModifierGroups.length === 0) {
    return []
  }

  // Filter out groups that are not visible
  const visibleGroups = itemModifierGroups.filter(
    (img: any) => img.modifier_group && img.modifier_group.visible
  )

  // For each group, fetch its options
  const groupsWithOptions = await Promise.all(
    visibleGroups.map(async (img: any) => {
      const group = img.modifier_group
      
      // Get options for this modifier group
      const { data: options, error: optionsError } = await supabase
        .from('menu_modifier_option')
        .select('*')
        .eq('modifier_group_id', group.id)
        .eq('visible', true)
        .eq('available', true)
        .order('position', { ascending: true })

      if (optionsError) {
        console.error('Error fetching modifier options:', optionsError)
        return null
      }

      return {
        ...group,
        options: options || [],
        min_select_override: img.min_select_override,
        max_select_override: img.max_select_override,
        required_override: img.required_override,
      } as ModifierGroupWithOptions
    })
  )

  // Filter out null results and return
  return groupsWithOptions.filter((g): g is ModifierGroupWithOptions => g !== null)
}

