import Image from 'next/image'

interface GalleryImage {
  src: string | { src: string };
  alt: string;
  large?: boolean;
}

interface AmbianceGalleryProps {
  title: string;
  images: GalleryImage[];
}

export default function AmbianceGallery({ title, images }: AmbianceGalleryProps) {
  return (
    <section className="h-screen flex items-center justify-center px-6 bg-card" style={{ paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto w-full">
        <h2 
          className="font-display text-4xl md:text-5xl text-center mb-16 text-foreground"
          data-testid="text-gallery-title"
        >
          {title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-md group cursor-pointer ${
                image.large ? 'md:col-span-2 aspect-[21/9]' : 'aspect-[4/3]'
              }`}
              data-testid={`gallery-image-${index}`}
              onClick={() => console.log(`Gallery image clicked: ${image.alt}`)}
            >
              <Image
                src={typeof image.src === 'string' ? image.src : image.src.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes={image.large ? "(max-width: 768px) 100vw, 100vw" : "(max-width: 768px) 100vw, 50vw"}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
