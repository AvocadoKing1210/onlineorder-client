import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  title: string;
  tagline: string;
  dates: string;
  location: string;
  backgroundImage: string;
  ctaText?: string;
}

export default function HeroSection({ title, tagline, dates, location, backgroundImage, ctaText = "Explore" }: HeroSectionProps) {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>
      
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" style={{ paddingTop: '80px' }}>
        <h1 
          className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 tracking-wide"
          data-testid="text-hero-title"
        >
          {title}
        </h1>
        
        <p 
          className="font-serif text-xl md:text-2xl text-white/90 mb-8 leading-relaxed italic"
          data-testid="text-hero-tagline"
        >
          {tagline}
        </p>
        
        <div className="space-y-3 mb-10">
          <p 
            className="text-sm md:text-base text-white/80 tracking-widest uppercase font-sans"
            data-testid="text-hero-dates"
          >
            {dates}
          </p>
          <p 
            className="text-sm md:text-base text-white/80 tracking-wider font-sans"
            data-testid="text-hero-location"
          >
            {location}
          </p>
        </div>
        
        <Button 
          size="lg"
          className="px-8 py-6 text-base tracking-widest uppercase backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/30 text-white"
          data-testid="button-hero-cta"
          onClick={() => {
            const element = document.getElementById('concept');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {ctaText}
        </Button>
      </div>
    </section>
  );
}
