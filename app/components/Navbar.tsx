"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { config } from "@/lib/config";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Hide navbar when at the top (hero section), show when scrolled down
      setIsVisible(scrollY > 100);
      setScrolled(scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    // Check initial state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false); // Close mobile menu after clicking
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        !isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        scrolled ? 'backdrop-blur-xl bg-background/80 border-b border-border/50' : 'bg-transparent'
      }`}
      style={{ height: '80px' }}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div 
          className="font-display text-2xl cursor-pointer text-foreground"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsMobileMenuOpen(false);
          }}
          data-testid="navbar-logo"
        >
          {config.navigation.logo}
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-12">
          {config.navigation.menuItems.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => scrollToSection(item.sectionId)}
              className="text-sm tracking-widest uppercase text-foreground/80 hover:text-foreground transition-colors"
              data-testid={`nav-${item.sectionId}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 text-foreground/80 hover:text-foreground transition-colors relative"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="relative w-6 h-6">
            <Menu 
              className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X 
              className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-96 opacity-100 translate-y-0' 
            : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-4">
          {config.navigation.menuItems.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => scrollToSection(item.sectionId)}
              className="text-left text-sm tracking-widest uppercase text-foreground/80 hover:text-foreground transition-all duration-200 py-2 transform hover:translate-x-2"
              data-testid={`nav-${item.sectionId}-mobile`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
