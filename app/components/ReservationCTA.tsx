import { Button } from "@/components/ui/button";

interface ReservationCTAProps {
  title: string;
  description: string;
  backgroundImage: string;
  ctaText: string;
  contactEmail: string;
}

export default function ReservationCTA({ 
  title, 
  description, 
  backgroundImage, 
  ctaText,
  contactEmail 
}: ReservationCTAProps) {
  return (
    <section className="relative h-screen flex items-center justify-center" style={{ paddingTop: '80px' }}>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
      </div>
      
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h2 
          className="font-display text-4xl md:text-6xl text-white mb-6"
          data-testid="text-cta-title"
        >
          {title}
        </h2>
        
        <p 
          className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed"
          data-testid="text-cta-description"
        >
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            className="px-8 py-6 text-base tracking-widest uppercase backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/30 text-white"
            data-testid="button-reserve-now"
            onClick={() => console.log('Reserve now clicked')}
          >
            {ctaText}
          </Button>
          
          <a
            href={`mailto:${contactEmail}`}
            className="text-white/80 hover:text-white text-sm tracking-wider transition-colors"
            data-testid="link-email-contact"
          >
            or email {contactEmail}
          </a>
        </div>
      </div>
    </section>
  );
}
