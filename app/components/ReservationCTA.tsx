'use client'

import { useState } from 'react'
import { ReservationDialog } from './reservations/ReservationDialog'

interface ReservationCTAProps {
  title: string;
  description: string;
  backgroundImage: string | { src: string };
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <section className="relative h-screen flex items-center justify-center" style={{ paddingTop: '80px' }}>
        {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${typeof backgroundImage === 'string' ? backgroundImage : backgroundImage.src})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        </div>
        )}
        {!backgroundImage && (
          <div className="absolute inset-0 bg-white" />
        )}
        
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <h2 
            className={`font-display text-4xl md:text-6xl mb-6 ${backgroundImage ? 'text-white' : 'text-black'}`}
            data-testid="text-cta-title"
          >
            {title}
          </h2>
          
          <p 
            className={`text-lg md:text-xl mb-10 leading-relaxed ${backgroundImage ? 'text-white/90' : 'text-gray-700'}`}
            data-testid="text-cta-description"
          >
            {description}
          </p>
          
          <div className="flex flex-col gap-4 justify-center items-center">
            <div className={`flex items-center rounded-full overflow-hidden ${backgroundImage ? 'backdrop-blur-md bg-white/10 border border-white/30' : 'bg-black border border-black'}`}>
              <button
                className={`px-8 py-3 text-base tracking-widest uppercase transition-all duration-200 cursor-pointer flex-1 text-center min-w-[120px] ${backgroundImage ? 'text-white hover:bg-white/20' : 'text-white hover:bg-gray-800'}`}
                data-testid="button-reserve-now"
                onClick={() => setIsDialogOpen(true)}
                type="button"
              >
                {ctaText}
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <ReservationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
