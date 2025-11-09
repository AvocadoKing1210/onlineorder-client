import { useEffect, useState } from "react";

interface ScrollIndicatorProps {
  sections: string[];
}

export default function ScrollIndicator({ sections }: ScrollIndicatorProps) {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      sections.forEach((sectionId, index) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (index: number) => {
    const element = document.getElementById(sections[index]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4"
      data-testid="scroll-indicator"
    >
      {sections.map((_, index) => (
        <button
          key={index}
          onClick={() => scrollToSection(index)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            activeSection === index 
              ? 'bg-foreground scale-150' 
              : 'bg-foreground/30 hover:bg-foreground/50'
          }`}
          data-testid={`scroll-dot-${index}`}
          aria-label={`Scroll to section ${index + 1}`}
        />
      ))}
    </div>
  );
}
