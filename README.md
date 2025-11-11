# Restaurant Website Template

A configurable Next.js template for restaurant websites. Easily customize for different restaurants through a single configuration file.

## Features

- 🎨 **Fully Configurable** - All restaurant-specific content managed through `app/config.json`
- 📱 **Responsive Design** - Mobile-first design with smooth scroll navigation
- 🔍 **SEO Optimized** - Built-in SEO metadata and structured data
- 🎯 **Type Safe** - Full TypeScript support with config type definitions
- 🖼️ **Image Management** - Easy image path resolution system
- 🚀 **Ready for Integration** - Prepared for online ordering system integration

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file in the root directory with:
   ```bash
   # Cloudflare Workers URLs
   NEXT_PUBLIC_CLOUDFLARE_ORDER_URL=https://your-orders-worker.workers.dev
   NEXT_PUBLIC_CLOUDFLARE_PROFILE_URL=https://your-profile-worker.workers.dev
   NEXT_PUBLIC_CLOUDFLARE_REVIEW_URL=https://your-reviews-worker.workers.dev
   
   # Supabase (if using direct Supabase client)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Configure your restaurant**:
   - Edit `app/config.json` with your restaurant's information
   - See `TEMPLATE_SETUP.md` for detailed configuration guide
   - Use `config.example.json` as a reference

4. **Add your images**:
   - Place images in `public/assets/stock_images/`
   - Reference them in config using `@assets/stock_images/` prefix

5. **Run development server**:
   ```bash
   npm run dev
   ```

6. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Configuration

All restaurant-specific content is configured in `app/config.json`. Key sections:

- **Restaurant Info**: Name, contact, social links
- **SEO**: Metadata, Open Graph, Twitter cards
- **Navigation**: Menu items and logo
- **Hero Section**: Title, tagline, background image
- **Menu**: Dishes with descriptions, prices, images
- **Location**: Address, hours, Google Maps integration
- **Footer**: Engagement dates, copyright

See `TEMPLATE_SETUP.md` for complete configuration guide.

## Project Structure

```
onlineorder-client/
├── app/
│   ├── components/          # React components
│   ├── config.json          # Restaurant configuration
│   ├── lib/
│   │   └── config.ts        # Config types and utilities
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main page
├── public/
│   └── assets/
│       └── stock_images/    # Restaurant images
├── config.example.json      # Example configuration
└── TEMPLATE_SETUP.md        # Setup guide
```

## Customization

### Adding New Sections

1. Create component in `app/components/`
2. Add section to `app/page.tsx`
3. Add config entry if needed
4. Update navigation if accessible via menu

### Styling

- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.js`
- Component-level: Tailwind classes

### Images

Images are resolved automatically from config paths:
- Config format: `@assets/stock_images/image.jpg`
- Resolved to: `/assets/stock_images/image.jpg`

Update `imageMap` in `app/lib/config.ts` to add new image mappings.

## Future: Online Ordering Integration

This template is designed to integrate with an online ordering system:

- Order section (`id="order"`) is already set up
- Ready for API integration
- Reservation CTA can be converted to ordering flow

## Documentation

- **Setup Guide**: `TEMPLATE_SETUP.md` - Complete configuration instructions
- **Example Config**: `config.example.json` - Reference configuration
- **Type Definitions**: `app/lib/config.ts` - TypeScript types

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Icons**: Lucide React

## License

MIT

