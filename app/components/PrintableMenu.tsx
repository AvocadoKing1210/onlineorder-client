"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image: string | { src: string };
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

interface PrintableMenuProps {
  title: string;
  subtitle: string;
  categories: MenuCategory[];
}

export default function PrintableMenu({ title, subtitle, categories }: PrintableMenuProps) {
  const [activeTab, setActiveTab] = useState(categories[0]?.name || "");
  const [showNavigation, setShowNavigation] = useState<Record<string, boolean>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDownload = () => {
    // Create a link element to trigger download
    const link = document.createElement('a');
    link.href = '/assets/menu.pdf';
    link.download = 'menu.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if content overflows for each category
  useEffect(() => {
    const checkOverflow = () => {
      const newShowNavigation: Record<string, boolean> = {};
      categories.forEach((category) => {
        const container = scrollRefs.current[category.name];
        if (container) {
          const hasOverflow = container.scrollWidth > container.clientWidth;
          newShowNavigation[category.name] = hasOverflow;
        }
      });
      setShowNavigation(newShowNavigation);
    };

    // Check immediately
    checkOverflow();
    
    // Check after a short delay to account for content loading
    const timeoutId = setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timeoutId);
    };
  }, [categories, activeTab]);

  const scrollTo = (categoryName: string, direction: 'prev' | 'next') => {
    const container = scrollRefs.current[categoryName];
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const scrollPosition = direction === 'next' 
      ? container.scrollLeft + scrollAmount
      : container.scrollLeft - scrollAmount;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-3 sm:px-4 md:px-6 py-4 sm:py-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 
            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 md:mb-4 text-foreground"
            data-testid="text-printable-title"
          >
            {title}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 px-2">{subtitle}</p>
          <div className="flex justify-center">
            <div className="flex items-center backdrop-blur-md bg-black/10 border border-border rounded-full overflow-hidden">
              <button
                className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base tracking-widest uppercase text-foreground hover:bg-black/10 transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2"
                onClick={handleDownload}
            data-testid="button-print-menu"
                type="button"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Download Menu</span>
            <span className="xs:hidden">Download</span>
              </button>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 overflow-x-auto pb-2 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 scrollbar-hide">
            <div className="inline-flex items-center gap-0.5 sm:gap-1 bg-muted/30 p-0.5 sm:p-1 rounded-lg border border-border/50">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveTab(category.name)}
                  className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    activeTab === category.name
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {categories.map((category) => (
            <TabsContent key={category.name} value={category.name} className="mt-0">
              <div className="flex items-center gap-2 md:gap-4">
                {/* Previous button */}
                {showNavigation[category.name] && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scrollTo(category.name, 'prev')}
                    className="flex-shrink-0 rounded-full h-10 w-10 md:h-12 md:w-12 bg-background/80 hover:bg-background/90 shadow-lg border border-border"
                    aria-label="Previous items"
                  >
                    <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                )}

                {/* Scrollable container */}
                <div 
                  ref={(el) => { scrollRefs.current[category.name] = el; }}
                  className="flex-1 overflow-x-auto pb-4 -mx-2 sm:-mx-3 md:-mx-2 px-2 sm:px-3 md:px-2 scrollbar-hide scroll-smooth"
                >
                  <div className="flex gap-3 sm:gap-4 md:gap-6 min-w-max">
                    {category.items.map((item, index) => (
              <div 
                key={index}
                        className="flex flex-col w-64 sm:w-72 md:w-80 h-[320px] sm:h-[360px] md:h-96 flex-shrink-0 gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-6 border border-border rounded-lg hover-elevate bg-card transition-all"
                        data-testid={`menu-item-${category.name}-${index}`}
              >
                        <div className="w-full h-28 sm:h-36 md:h-48 flex-shrink-0 rounded-md overflow-hidden bg-muted relative">
                          <Image
                    src={typeof item.image === 'string' ? item.image : item.image.src}
                    alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 256px, (max-width: 768px) 288px, 320px"
                            quality={85}
                            priority={index < 4}
                  />
                </div>
                        <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex justify-between items-start mb-1 sm:mb-2 gap-1 sm:gap-2">
                            <h3 className="font-display text-base sm:text-lg md:text-xl text-foreground line-clamp-2">{item.name}</h3>
                            <span className="font-serif text-foreground whitespace-nowrap text-sm sm:text-base md:text-lg flex-shrink-0">{item.price}</span>
                  </div>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
                </div>

                {/* Next button */}
                {showNavigation[category.name] && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scrollTo(category.name, 'next')}
                    className="flex-shrink-0 rounded-full h-10 w-10 md:h-12 md:w-12 bg-background/80 hover:bg-background/90 shadow-lg border border-border"
                    aria-label="Next items"
                  >
                    <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
