"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  title: string;
  tagline: string;
  dates: string;
  location: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  ctaText?: string;
}

export default function HeroSection({ 
  title, 
  tagline, 
  dates, 
  location, 
  backgroundImage, 
  backgroundVideo,
  ctaText = "Explore" 
}: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Ensure video plays and loops
    if (videoRef.current && backgroundVideo) {
      videoRef.current.play().catch((error) => {
        console.log('Video autoplay prevented:', error);
      });
    }
  }, [backgroundVideo]);

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Video or Image */}
      {backgroundVideo ? (
        <div className="absolute inset-0 w-full h-full">
          {/* Fallback image behind video */}
          {backgroundImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover z-10"
            autoPlay
            loop
            muted
            playsInline
            data-testid="hero-background-video"
            onError={(e) => {
              // Hide video if it fails to load, show image fallback
              if (e.currentTarget) {
                e.currentTarget.style.display = 'none';
              }
            }}
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-20" />
        </div>
      ) : backgroundImage ? (
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-20" />
      </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-20" />
      )}
      
      <div className="relative z-30 text-center px-6 max-w-4xl mx-auto" style={{ paddingTop: '80px' }}>
        <h1 
          className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 tracking-wide drop-shadow-lg"
          data-testid="text-hero-title"
        >
          {title}
        </h1>
        
        <p 
          className="font-serif text-xl md:text-2xl text-white mb-8 leading-relaxed italic drop-shadow-md"
          data-testid="text-hero-tagline"
        >
          {tagline}
        </p>
        
        <div className="space-y-3 mb-10">
          <p 
            className="text-sm md:text-base text-white tracking-widest uppercase font-sans drop-shadow-md"
            data-testid="text-hero-dates"
          >
            {dates}
          </p>
          <p 
            className="text-sm md:text-base text-white tracking-wider font-sans drop-shadow-md"
            data-testid="text-hero-location"
          >
            {location}
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="flex items-center backdrop-blur-md bg-white/10 border border-white/30 rounded-full overflow-hidden">
            <button
              className="px-8 py-3 text-base tracking-widest uppercase text-white hover:bg-white/20 transition-all duration-200 cursor-pointer flex-1 text-center min-w-[120px]"
              data-testid="button-hero-cta"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const element = document.getElementById('concept');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              type="button"
            >
              {ctaText}
            </button>
            <div className="w-px h-6 bg-white/30 flex-shrink-0" />
            <button
              className="px-8 py-3 text-base tracking-widest uppercase text-white hover:bg-white/20 transition-all duration-200 cursor-pointer flex-1 text-center min-w-[120px]"
              data-testid="button-hero-order"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push('/order');
              }}
              type="button"
            >
              Order
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
