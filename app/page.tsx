"use client";

import { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import ScrollIndicator from "@/components/ScrollIndicator";
import HeroSection from "@/components/HeroSection";
import ConceptStatement from "@/components/ConceptStatement";
import MenuHighlights from "@/components/MenuHighlights";
import DetailsSection from "@/components/DetailsSection";
import PrintableMenu from "@/components/PrintableMenu";
import ReservationCTA from "@/components/ReservationCTA";
import Footer from "@/components/Footer";
import { config, resolveImagePath, resolveVideoPath, getFullAddress } from "@/lib/config";

export default function Home() {
  // Map dishes with images
  const dishes = config.menu.dishes.map(dish => ({
    ...dish,
    image: resolveImagePath(dish.image)
  }));

  // Map printable menu items with images
  const printableMenuItems = config.printableMenu.items.map(item => ({
    ...item,
    image: resolveImagePath(item.image)
  }));

  // Location details (empty array since we only show address and map)
  const locationDetails: Array<{ icon: React.ReactNode; label: string; value: string }> = [];

  const sections = ['hero', 'concept', 'menu', 'details', 'print-menu', 'order'];
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply scroll snap styles to html element
    document.documentElement.style.scrollSnapType = 'y mandatory';
    document.documentElement.style.scrollBehavior = 'smooth';
    document.documentElement.style.overflowY = 'scroll';
    document.documentElement.style.height = '100%';

    // Handle wheel events for smoother snapping
    let wheelTimeout: NodeJS.Timeout;
    const handleWheel = (e: WheelEvent) => {
      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }

      // Check if we're in the menu section and scrolling horizontally
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        const menuRect = menuSection.getBoundingClientRect();
        const isInMenuSection = menuRect.top <= window.innerHeight / 2 && menuRect.bottom >= window.innerHeight / 2;
        
        // If scrolling horizontally in menu section, allow it
        if (isInMenuSection && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          return; // Don't prevent default, allow horizontal scroll
        }
      }

      const delta = e.deltaY;
      let currentSection = sections.findIndex((id) => {
        const element = document.getElementById(id);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight / 2;
      });

      // If no section found, default to first section
      if (currentSection === -1) {
        currentSection = 0;
      }

      if (Math.abs(delta) > 50) {
        isScrollingRef.current = true;
        e.preventDefault();

        let nextIndex = currentSection;
        if (delta > 0 && currentSection < sections.length - 1) {
          nextIndex = currentSection + 1;
        } else if (delta < 0 && currentSection > 0) {
          nextIndex = currentSection - 1;
        }

        const nextSection = document.getElementById(sections[nextIndex]);
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          isScrollingRef.current = false;
        }, 1000);
      }
    };

    // Handle touch events for mobile swipe
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;

      if (Math.abs(diff) > 50 && !isScrollingRef.current) {
        isScrollingRef.current = true;
        let currentSection = sections.findIndex((id) => {
          const element = document.getElementById(id);
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.top < window.innerHeight / 2;
        });

        // If no section found, default to first section
        if (currentSection === -1) {
          currentSection = 0;
        }

        let nextIndex = currentSection;
        if (diff > 0 && currentSection < sections.length - 1) {
          nextIndex = currentSection + 1;
        } else if (diff < 0 && currentSection > 0) {
          nextIndex = currentSection - 1;
        }

        const nextSection = document.getElementById(sections[nextIndex]);
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(wheelTimeout);
      document.documentElement.style.scrollSnapType = '';
      document.documentElement.style.scrollBehavior = '';
      document.documentElement.style.overflowY = '';
      document.documentElement.style.height = '';
    };
  }, [sections]);

  // Add structured data for SEO/GEO
  useEffect(() => {
    const heroImagePath = resolveImagePath(config.hero.backgroundImage);
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": config.restaurant.name,
      "description": config.concept.statement,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": config.details.location.address,
        "addressLocality": config.details.location.city,
        "addressRegion": config.details.location.state || "",
        "addressCountry": config.details.location.country
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": config.seo.geo.latitude,
        "longitude": config.seo.geo.longitude
      },
      "openingHoursSpecification": config.details.schedule.days.map(day => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": `https://schema.org/${day.day}`,
        "opens": day.hours.split(" – ")[0],
        "closes": day.hours.split(" – ")[1]
      })),
      "servesCuisine": config.seo.structuredData.cuisine,
      "priceRange": config.seo.structuredData.priceRange,
      "email": config.restaurant.email,
      "telephone": config.restaurant.phone || config.restaurant.reservationEmail,
      "image": typeof window !== 'undefined' ? `${window.location.origin}${heroImagePath}` : heroImagePath,
      "menu": config.menu.dishes.map(dish => ({
        "@type": "MenuItem",
        "name": dish.name,
        "description": dish.description,
        "offers": {
          "@type": "Offer",
          "price": dish.price
        }
      })),
      "url": typeof window !== 'undefined' ? window.location.origin : config.site.url
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen">
      <Navbar />
      <ScrollIndicator sections={sections} />
      
      <div id="hero" className="relative overflow-hidden snap-start" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <HeroSection
          title={config.hero.title}
          tagline={config.hero.tagline}
          dates={config.hero.dates}
          location={config.hero.location}
          backgroundImage={config.hero.backgroundImage ? resolveImagePath(config.hero.backgroundImage) : undefined}
          backgroundVideo={config.hero.backgroundVideo ? resolveVideoPath(config.hero.backgroundVideo) : undefined}
          ctaText={config.hero.ctaText}
        />
      </div>
      
      <div id="concept" className="relative overflow-hidden snap-start" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <ConceptStatement
          statement={config.concept.statement}
        />
      </div>
      
      <div id="menu" className="relative overflow-hidden z-10 snap-start" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <MenuHighlights title={config.menu.title} dishes={dishes} />
      </div>
      
      <div id="details" className="relative overflow-hidden z-10 snap-start" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <DetailsSection 
          title={config.details.title}
          scheduleDays={config.details.schedule.days}
          location={locationDetails}
          address={config.details.location.address}
          googleMapsLink={config.details.location.googleMapsLink}
          googleMapsEmbed={config.details.location.googleMapsEmbed}
        />
      </div>
      
      <div id="print-menu" className="relative overflow-hidden snap-start" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <PrintableMenu
          title={config.printableMenu.title}
          subtitle={config.printableMenu.subtitle}
          items={printableMenuItems}
        />
      </div>
      
      <div id="order" className="relative overflow-hidden snap-start" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <ReservationCTA
          title={config.reservation.title}
          description={config.reservation.description}
          backgroundImage={resolveImagePath(config.reservation.backgroundImage)}
          ctaText={config.reservation.ctaText}
          contactEmail={config.restaurant.reservationEmail}
        />
      </div>
      
      <Footer
        restaurantName={config.restaurant.name}
        tagline={config.restaurant.tagline}
        email={config.restaurant.email}
        socialLinks={config.restaurant.socialLinks}
      />
    </div>
  );
}

