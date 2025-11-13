"use client";

import { useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image: string;
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

  const handleDownload = () => {
    // Create a link element to trigger download
    const link = document.createElement('a');
    link.href = '/assets/menu.pdf';
    link.download = 'menu.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="h-screen flex items-center justify-center px-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 
            className="font-display text-4xl md:text-5xl mb-4 text-foreground"
            data-testid="text-printable-title"
          >
            {title}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">{subtitle}</p>
          <div className="flex justify-center">
            <div className="flex items-center backdrop-blur-md bg-black/10 border border-border rounded-full overflow-hidden">
              <button
                className="px-8 py-3 text-base tracking-widest uppercase text-foreground hover:bg-black/10 transition-all duration-200 cursor-pointer flex items-center gap-2"
                onClick={handleDownload}
            data-testid="button-print-menu"
                type="button"
          >
            <Download className="w-4 h-4" />
            Download Menu
              </button>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveTab(category.name)}
                  className={`px-6 py-2.5 text-sm md:text-base font-medium rounded-md transition-all duration-200 ${
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
              <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                <div className="flex gap-6 min-w-max">
                  {category.items.map((item, index) => (
            <div 
              key={index}
                      className="flex flex-col w-80 h-96 flex-shrink-0 gap-4 p-6 border border-border rounded-lg hover-elevate bg-card transition-all"
                      data-testid={`menu-item-${category.name}-${index}`}
            >
                      <div className="w-full h-48 flex-shrink-0 rounded-md overflow-hidden bg-muted relative">
                        <Image
                  src={item.image}
                  alt={item.name}
                          fill
                          className="object-cover"
                          sizes="320px"
                          loading="lazy"
                          unoptimized={item.image.startsWith('/')}
                />
              </div>
                      <div className="flex flex-col flex-1 min-h-0">
                <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-display text-xl text-foreground">{item.name}</h3>
                          <span className="font-serif text-foreground whitespace-nowrap text-lg">{item.price}</span>
                </div>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
