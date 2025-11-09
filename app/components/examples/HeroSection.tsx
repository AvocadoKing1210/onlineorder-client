import HeroSection from '../HeroSection';
import heroImage from '@assets/stock_images/elegant_restaurant_i_85ea31a6.jpg';

export default function HeroSectionExample() {
  return (
    <HeroSection
      title="Éphémère"
      tagline="An intimate culinary journey through seasonal flavors"
      dates="December 15–31, 2025"
      location="The Historic Warehouse District"
      backgroundImage={heroImage}
    />
  );
}
