import { Card } from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";

interface Dish {
  name: string;
  description: string;
  price: string;
  image: string | { src: string };
}

interface MenuHighlightsProps {
  title: string;
  dishes: Dish[];
}

export default function MenuHighlights({ title, dishes }: MenuHighlightsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSectionVisible, setIsSectionVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef(false);
  const activeIndexRef = useRef(0);

  // Calculate which item is currently visible
  const updateActiveIndex = useCallback(() => {
      const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    dishes.forEach((_, index) => {
      const item = container.querySelector(`[data-dish-index="${index}"]`) as HTMLElement;
      if (item) {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(containerCenter - itemCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });

    setActiveIndex(closestIndex);
    activeIndexRef.current = closestIndex;
  }, [dishes]);

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const item = container.querySelector(`[data-dish-index="${index}"]`) as HTMLElement;
    if (item) {
      isUserScrollingRef.current = true;
      setActiveIndex(index);
      activeIndexRef.current = index;
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    }
  };

  // Check if section is visible in viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSectionVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.5, // Section is considered visible when at least 50% is in view
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto-scroll to next item every 10 seconds (only when section is visible)
  useEffect(() => {
    if (!isSectionVisible) {
      // Clear timeout if section is not visible
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
      return;
    }

    const startAutoScroll = () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }

      autoScrollTimeoutRef.current = setTimeout(() => {
        // Double check section is still visible before scrolling
        if (isSectionVisible && !isUserScrollingRef.current) {
          const nextIndex = (activeIndexRef.current + 1) % dishes.length;
          scrollToIndex(nextIndex);
        }
        // Only continue if section is still visible
        if (isSectionVisible) {
          startAutoScroll();
        }
      }, 10000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, [dishes.length, isSectionVisible]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      updateActiveIndex();
      isUserScrollingRef.current = true;
      
      // Reset user scrolling flag after scroll ends
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1500);
    };

    container.addEventListener('scroll', handleScroll);
    updateActiveIndex(); // Initial calculation

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [dishes, updateActiveIndex]);

  return (
    <section ref={sectionRef} className="relative h-screen flex items-center justify-center bg-card z-10" style={{ paddingTop: '80px' }}>
      <div className="w-full h-full py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <h2 
            className="font-display text-4xl md:text-5xl text-center mb-12 text-card-foreground flex-shrink-0"
            data-testid="text-menu-title"
          >
            {title}
          </h2>
          
          <div className="relative flex-1 overflow-hidden flex flex-col">
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
            >
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex gap-8 pb-4 hide-scrollbar h-full items-center" style={{ width: 'max-content' }}>
                {dishes.map((dish, index) => (
                  <div
                    key={index}
                    data-dish-index={index}
                    className="flex-shrink-0 w-[90vw] md:w-[800px] h-full flex items-center md:items-center"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <Card className="overflow-hidden hover-elevate transition-transform duration-300 w-full h-auto md:h-[70vh] flex flex-col md:flex-row">
                      {/* Image - full width on mobile, half on desktop */}
                      <div className="w-full md:w-1/2 h-64 md:h-full overflow-hidden relative">
                      <Image
                        src={typeof dish.image === 'string' ? dish.image : dish.image.src}
                        alt={dish.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={85}
                        priority={true}
                        data-testid={`img-dish-${index}`}
                      />
                    </div>
                    
                      {/* Text description - full width on mobile, half on desktop */}
                      <div className="w-full md:w-1/2 h-full flex flex-col justify-center p-6 md:p-8 lg:p-12">
                      <h3 
                          className="font-display text-2xl md:text-3xl lg:text-4xl mb-3 md:mb-4 text-card-foreground"
                        data-testid={`text-dish-name-${index}`}
                      >
                        {dish.name}
                      </h3>
                      <p 
                          className="text-muted-foreground leading-relaxed mb-4 md:mb-6 text-base md:text-lg"
                        data-testid={`text-dish-description-${index}`}
                      >
                        {dish.description}
                      </p>
                      <p 
                          className="text-xl md:text-2xl lg:text-3xl font-serif text-card-foreground"
                        data-testid={`text-dish-price-${index}`}
                      >
                        {dish.price}
                      </p>
                    </div>
                  </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator dots below the scrollable area */}
            <div className="flex justify-center items-center py-4 mt-2">
              <div className="bg-foreground/10 dark:bg-foreground/20 rounded-full px-4 py-2 flex items-center gap-2">
                {dishes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`transition-all duration-300 rounded-full ${
                      activeIndex === index
                        ? 'w-8 h-2 bg-black'
                        : 'w-2 h-2 bg-foreground/30 hover:bg-foreground/40'
                    }`}
                    aria-label={`Go to dish ${index + 1}`}
                    data-testid={`scroll-indicator-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
