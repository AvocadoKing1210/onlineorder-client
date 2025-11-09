import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image: string;
}

interface PrintableMenuProps {
  title: string;
  subtitle: string;
  items: MenuItem[];
}

export default function PrintableMenu({ title, subtitle, items }: PrintableMenuProps) {
  const handlePrint = () => {
    console.log('Print menu clicked');
    window.print();
  };

  return (
    <section className="h-screen flex items-center justify-center px-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 
            className="font-display text-4xl md:text-5xl mb-4 text-foreground"
            data-testid="text-printable-title"
          >
            {title}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">{subtitle}</p>
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrint}
            data-testid="button-print-menu"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download Menu
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
          {items.map((item, index) => (
            <div 
              key={index}
              className="flex gap-4 p-4 border border-border rounded-md hover-elevate"
              data-testid={`menu-item-${index}`}
            >
              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                  <span className="font-serif text-foreground whitespace-nowrap">{item.price}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
