import configData from '@/config.json';

// Type definitions for the config schema
export interface RestaurantConfig {
  restaurant: {
    name: string;
    tagline: string;
    email: string;
    reservationEmail: string;
    phone?: string;
    socialLinks: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
    };
  };
  site: {
    url: string;
    canonical: string;
    language: string;
    locale: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    author: string;
    geo: {
      region: string;
      placename: string;
      latitude: string;
      longitude: string;
    };
    openGraph: {
      title: string;
      description: string;
      type: string;
      siteName: string;
    };
    twitter: {
      card: string;
      title: string;
      description: string;
    };
    structuredData: {
      cuisine: string;
      priceRange: string;
    };
  };
  navigation: {
    logo: string;
    menuItems: Array<{
      label: string;
      sectionId: string;
    }>;
  };
  hero: {
    title: string;
    tagline: string;
    dates: string;
    location: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    ctaText: string;
  };
  concept: {
    statement: string;
  };
  menu: {
    title: string;
    dishes: Array<{
      name: string;
      description: string;
      price: string;
      image: string;
    }>;
  };
  printableMenu: {
    title: string;
    subtitle: string;
    categories: Array<{
      name: string;
    items: Array<{
      name: string;
      description: string;
      price: string;
      image: string;
      }>;
    }>;
  };
  details: {
    title: string;
    schedule: {
      days: Array<{
        day: string;
        hours: string;
      }>;
    };
    location: {
      address: string;
      city: string;
      state?: string;
      country: string;
      googleMapsLink: string;
      googleMapsEmbed: string;
    };
  };
  reservation: {
    title: string;
    description: string;
    ctaText: string;
    backgroundImage: string;
  };
  footer: {
    engagementDates: string;
    copyrightYear: string;
  };
}

// Type-safe config access
export const config: RestaurantConfig = configData as RestaurantConfig;

// Helper function to resolve image paths
// Maps config image paths (using @assets prefix) to public asset paths
// To add new images: add entries to this map when you add new images to public/assets/stock_images/
const imageMap: Record<string, string> = {
  '@assets/stock_images/elegant_restaurant_i_85ea31a6.jpg': '/assets/stock_images/elegant_restaurant_i_85ea31a6.jpg',
  '@assets/stock_images/fine_dining_plating__d1e489c1.jpg': '/assets/stock_images/fine_dining_plating__d1e489c1.jpg',
  '@assets/stock_images/fine_dining_plating__bbc0a5dc.jpg': '/assets/stock_images/fine_dining_plating__bbc0a5dc.jpg',
  '@assets/stock_images/fine_dining_plating__21ea3959.jpg': '/assets/stock_images/fine_dining_plating__21ea3959.jpg',
  '@assets/stock_images/fine_dining_plating__48222664.jpg': '/assets/stock_images/fine_dining_plating__48222664.jpg',
  '@assets/stock_images/fine_dining_plating__7d06f067.jpg': '/assets/stock_images/fine_dining_plating__7d06f067.jpg',
  '@assets/stock_images/fine_dining_plating__a76cbce9.jpg': '/assets/stock_images/fine_dining_plating__a76cbce9.jpg',
  '@assets/stock_images/restaurant_ambiance__973c1831.jpg': '/assets/stock_images/restaurant_ambiance__973c1831.jpg',
};

// Helper function to resolve video paths
// Maps config video paths (using @assets prefix) to public asset paths
const videoMap: Record<string, string> = {
  '@assets/video/3768941-hd_1920_1080_25fps.mp4': '/assets/video/3768941-hd_1920_1080_25fps.mp4',
};

/**
 * Resolves image paths from config format to public asset paths
 * 
 * If the image path starts with "@assets/", it looks up the mapped path.
 * Otherwise, returns the path as-is (useful for external URLs or direct paths).
 * 
 * @param imagePath - Image path from config (e.g., "@assets/stock_images/image.jpg")
 * @returns Resolved public path (e.g., "/assets/stock_images/image.jpg")
 * 
 * @example
 * resolveImagePath("@assets/stock_images/hero.jpg") // "/assets/stock_images/hero.jpg"
 * resolveImagePath("https://example.com/image.jpg") // "https://example.com/image.jpg"
 */
export function resolveImagePath(imagePath: string): string {
  // If path is in the map, use the mapped value
  if (imageMap[imagePath]) {
    return imageMap[imagePath];
  }
  
  // If path starts with @assets but not in map, auto-resolve it
  if (imagePath.startsWith('@assets/')) {
    return imagePath.replace('@assets/', '/');
  }
  
  // Otherwise return as-is (for external URLs or direct paths)
  return imagePath;
}

/**
 * Resolves video paths from config format to public asset paths
 * 
 * If the video path starts with "@assets/", it looks up the mapped path.
 * Otherwise, returns the path as-is (useful for external URLs or direct paths).
 * 
 * @param videoPath - Video path from config (e.g., "@assets/video/video.mp4")
 * @returns Resolved public path (e.g., "/assets/video/video.mp4")
 * 
 * @example
 * resolveVideoPath("@assets/video/hero.mp4") // "/assets/video/hero.mp4"
 * resolveVideoPath("https://example.com/video.mp4") // "https://example.com/video.mp4"
 */
export function resolveVideoPath(videoPath: string): string {
  // If path is in the map, use the mapped value
  if (videoMap[videoPath]) {
    return videoMap[videoPath];
  }
  
  // If path starts with @assets but not in map, auto-resolve it
  if (videoPath.startsWith('@assets/')) {
    return videoPath.replace('@assets/', '/');
  }
  
  // Otherwise return as-is (for external URLs or direct paths)
  return videoPath;
}

/**
 * Gets the full address string
 */
export function getFullAddress(): string {
  const { address, city, state, country } = config.details.location;
  const parts = [address, city, state, country].filter(Boolean);
  return parts.join(', ');
}

