# Design Guidelines: Pop-Up Restaurant One-Pager

## Design Approach
**Reference-Based**: Drawing from high-end hospitality brands like Noma, Eleven Madison Park, and boutique dining experiences. Focus on visual storytelling through photography, restrained elegance, and generous whitespace that lets food photography breathe.

## Typography System
- **Primary Font**: Playfair Display (serif) for headlines and feature text - conveys elegance and sophistication
- **Secondary Font**: Inter or Work Sans (sans-serif) for body text, details, menu items
- **Hierarchy**: 
  - Hero title: 4xl-6xl, serif, refined letter-spacing
  - Section headers: 2xl-3xl, serif
  - Menu items: xl, serif for dish names, base for descriptions
  - Body text: base-lg, sans-serif
  - Details/metadata: sm, uppercase tracking, sans-serif

## Layout System
**Spacing Units**: Tailwind 6, 12, 16, 24, 32 for consistent vertical rhythm
- Hero section: Full viewport with overlay text
- Content sections: py-24 on desktop, py-16 on mobile
- Inner containers: max-w-6xl for full sections, max-w-4xl for text-focused content

## Page Structure

### 1. Hero Section (Full Viewport)
- Large hero image from Unsplash: "moody bistro interior, candlelight, elegant dining"
- Centered overlay content with blurred background button
- Pop-up name (large serif headline)
- Tagline/concept description
- Dates and location (subtle, elegant typography)
- Primary CTA button with backdrop blur

### 2. Concept Statement
- Single column, centered, max-w-3xl
- Large leading text describing the pop-up's unique story
- Minimal design, all about the copy

### 3. Menu Highlights (Signature Dishes)
- 3-column grid on desktop (grid-cols-1 md:grid-cols-3)
- Each dish card includes:
  - Square/portrait Unsplash image: "fine dining plating, signature dish, artistic presentation"
  - Dish name (serif, elegant)
  - Brief description (2-3 lines)
  - Price
- Cards with subtle hover elevation

### 4. Ambiance Gallery
- 2-column asymmetric layout or masonry grid
- Mix of images: "restaurant ambiance sunlit natural", "moody bistro lighting", "plating details close-up"
- Large impactful images with minimal text overlay
- Shows the experience, not just the food

### 5. Details Section
- Clean 2-column layout (md:grid-cols-2)
- Left: Dates, hours, capacity info
- Right: Location with embedded map placeholder, address, directions link
- Elegant information hierarchy with icons

### 6. Printable Mini-Menu Feature
- Dedicated section with print-optimized preview
- Clean table layout with dish photos (thumbnail size)
- Download/Print button prominent
- Grid of 4-6 signature dishes with small Unsplash images, names, descriptions

### 7. Reservation CTA
- Full-width section with background image ("elegant restaurant interior")
- Centered CTA with backdrop blur
- Large headline: "Reserve Your Experience"
- Primary action button + contact alternatives

### 8. Footer
- Minimal, elegant
- Social links, contact email, copyright
- "Limited engagement" reminder

## Component Specifications

### Cards (Menu Items)
- White/light background with subtle shadow
- Image fills top portion (aspect-ratio-square or 3/4)
- Content padding: p-6
- Hover: slight scale and shadow increase

### Buttons
- Primary: Sophisticated dark with elegant hover state
- On image overlays: Backdrop blur (backdrop-blur-md), semi-transparent background
- Generous padding: px-8 py-4
- Uppercase tracking for CTA text

### Image Treatment
- High-quality, moody photography
- Consistent filters/tones across all images
- Overlays on hero/CTA sections: dark gradient from top or subtle vignette

## Images Section
**Hero Image**: Full-width, moody bistro interior with candlelight, sophisticated ambiance (Unsplash: "elegant restaurant interior moody lighting")

**Menu Dish Images** (6-8 needed): Fine dining plating, artistic food presentation, close-up details (Unsplash: "fine dining plating", "gourmet dish presentation", "chef signature dish")

**Ambiance Gallery** (4-6 images): Mix of "sunlit restaurant natural light", "moody bistro candles", "plating details macro", "wine glasses table setting"

**CTA Background**: Elegant dining room or chef at work (Unsplash: "upscale restaurant interior" or "chef cooking fine dining")

## Print Stylesheet
- Mini-menu: Clean table, simplified layout, black text on white
- Remove navigation, CTAs, decorative elements
- Optimize dish photos for print (smaller, grid layout)
- Include pop-up name, dates, location header

## Responsive Behavior
- Hero: Full viewport on all sizes, adjust text scaling
- Menu grid: 3 cols → 2 cols (tablet) → 1 col (mobile)
- Ambiance gallery: 2 cols → 1 col on mobile
- Details section: 2 cols → stacked on mobile
- Maintain generous spacing on mobile (reduce by ~30%)