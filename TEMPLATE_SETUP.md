# Restaurant Website Template - Setup Guide

This is a configurable template for restaurant websites that can be easily customized for different restaurants. All restaurant-specific content is managed through a single configuration file.

## Quick Start

1. **Copy the template** to your project directory
2. **Edit `app/config.json`** with your restaurant's information
3. **Add your images** to `public/assets/stock_images/` (or update image paths in config)
4. **Run the development server**: `npm run dev`

## Configuration Guide

All restaurant-specific content is configured in `app/config.json`. Here's what you need to customize:

### 1. Restaurant Information (`restaurant`)

```json
{
  "restaurant": {
    "name": "Your Restaurant Name",
    "tagline": "Your tagline",
    "email": "contact@yourrestaurant.com",
    "reservationEmail": "reservations@yourrestaurant.com",
    "phone": "+1-555-123-4567",
    "socialLinks": {
      "instagram": "https://instagram.com/yourrestaurant",
      "facebook": "https://facebook.com/yourrestaurant",
      "twitter": "",
      "tiktok": "",
      "youtube": ""
    }
  }
}
```

### 2. Site & SEO (`site`, `seo`)

Configure your site URL, language, and SEO metadata:

```json
{
  "site": {
    "url": "https://yourrestaurant.com",
    "canonical": "https://yourrestaurant.com",
    "language": "en",
    "locale": "en_US"
  },
  "seo": {
    "title": "Your Restaurant - Title",
    "description": "Your SEO description",
    "keywords": ["restaurant", "dining", "your city"],
    "author": "Your Restaurant Name",
    "geo": {
      "region": "US",
      "placename": "Your City",
      "latitude": "40.7589",
      "longitude": "-73.9851"
    },
    "openGraph": { ... },
    "twitter": { ... },
    "structuredData": {
      "cuisine": "Fine Dining",
      "priceRange": "$$$"
    }
  }
}
```

### 3. Navigation (`navigation`)

Customize the navigation menu:

```json
{
  "navigation": {
    "logo": "Your Restaurant",
    "menuItems": [
      { "label": "Menu", "sectionId": "menu" },
      { "label": "About", "sectionId": "about" },
      { "label": "Order", "sectionId": "order" }
    ]
  }
}
```

**Note**: The `sectionId` must match an `id` attribute on a section in `app/page.tsx`.

### 4. Hero Section (`hero`)

```json
{
  "hero": {
    "title": "Your Restaurant Name",
    "tagline": "Your compelling tagline",
    "dates": "Open Daily",
    "location": "Your Location",
    "backgroundImage": "@assets/stock_images/your-hero-image.jpg",
    "ctaText": "Explore"
  }
}
```

### 5. Menu (`menu`, `printableMenu`)

Add your menu items:

```json
{
  "menu": {
    "title": "Signature Dishes",
    "dishes": [
      {
        "name": "Dish Name",
        "description": "Dish description",
        "price": "$25",
        "image": "@assets/stock_images/dish-image.jpg"
      }
    ]
  }
}
```

### 6. Location & Hours (`details`)

```json
{
  "details": {
    "title": "Visit Details",
    "schedule": {
      "days": [
        { "day": "Monday", "hours": "11:00 a.m. – 9:00 p.m." },
        { "day": "Tuesday", "hours": "11:00 a.m. – 9:00 p.m." }
      ]
    },
    "location": {
      "address": "123 Main Street",
      "city": "Your City",
      "state": "ST",
      "country": "US",
      "googleMapsLink": "https://maps.google.com/...",
      "googleMapsEmbed": "https://www.google.com/maps/embed?..."
    }
  }
}
```

### 7. Footer (`footer`)

```json
{
  "footer": {
    "engagementDates": "Open Year Round",
    "copyrightYear": "2025"
  }
}
```

## Image Management

### Adding Images

1. Place your images in `public/assets/stock_images/`
2. Reference them in config using the `@assets/stock_images/` prefix:
   ```json
   "image": "@assets/stock_images/your-image.jpg"
   ```
3. The template automatically resolves these paths to `/assets/stock_images/your-image.jpg`

### Image Path Resolution

The `resolveImagePath()` function in `app/lib/config.ts` handles image path resolution. To add new image mappings, update the `imageMap` object in that file.

## Type Safety

The configuration is fully typed. Import the config and types:

```typescript
import { config, RestaurantConfig } from '@/lib/config';
```

## Customization Points

### Adding New Sections

1. Add a new section component in `app/components/`
2. Add the section to `app/page.tsx`
3. Add a corresponding entry in `config.json` if needed
4. Update navigation menu items if the section should be accessible via nav

### Styling

- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.js`
- Component styles: Inline Tailwind classes in components

### Fonts

Fonts are configured in `app/layout.tsx`. To change fonts:

1. Import a new font from `next/font/google`
2. Add it to the `className` of the `<html>` element
3. Update CSS variables if needed

## Environment Variables (Optional)

For sensitive data or environment-specific configs, you can use environment variables:

1. Create `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=https://yourrestaurant.com
   ```

2. Access in code:
   ```typescript
   const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
   ```

## Deployment

1. **Build**: `npm run build`
2. **Start**: `npm start`

For production:
- Update `config.json` with production URLs
- Ensure all images are in `public/` directory
- Set environment variables if needed

## Future Integration: Online Ordering

This template is designed to integrate with an online ordering system. When ready:

1. The order section (`id="order"`) is already set up
2. You can add order-related components
3. Connect to your ordering API/backend
4. Update the reservation CTA to link to ordering functionality

## Support

For questions or issues:
- Check `app/lib/config.ts` for type definitions
- Review component props in `app/components/`
- Ensure all required config fields are filled

## Checklist for New Restaurant

- [ ] Update restaurant name, tagline, contact info
- [ ] Add social media links
- [ ] Configure SEO metadata (title, description, keywords)
- [ ] Set site URL and canonical URL
- [ ] Update geo coordinates (latitude/longitude)
- [ ] Customize navigation menu items
- [ ] Add hero section content and image
- [ ] Write concept statement
- [ ] Add menu items with images
- [ ] Configure operating hours
- [ ] Add location details and Google Maps links
- [ ] Update footer dates and copyright year
- [ ] Add all images to `public/assets/stock_images/`
- [ ] Test all links and navigation
- [ ] Verify SEO metadata
- [ ] Test responsive design on mobile/tablet

