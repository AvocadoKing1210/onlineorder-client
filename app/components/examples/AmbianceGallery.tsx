import AmbianceGallery from '../AmbianceGallery';
import ambiance1 from '@assets/stock_images/restaurant_ambiance__973c1831.jpg';
import ambiance2 from '@assets/stock_images/restaurant_ambiance__8d0b6782.jpg';
import ambiance3 from '@assets/stock_images/restaurant_ambiance__c13acf73.jpg';
import plating1 from '@assets/stock_images/plating_details_macr_d29fb5af.jpg';
import plating2 from '@assets/stock_images/plating_details_macr_f9e9474d.jpg';
import plating3 from '@assets/stock_images/plating_details_macr_dd0c0b35.jpg';

export default function AmbianceGalleryExample() {
  const images = [
    { src: ambiance1, alt: "Sunlit dining room", large: true },
    { src: plating1, alt: "Plating detail close-up" },
    { src: plating2, alt: "Garnish and texture" },
    { src: ambiance2, alt: "Intimate table setting" },
    { src: ambiance3, alt: "Evening ambiance" },
    { src: plating3, alt: "Artisanal presentation" }
  ];

  return <AmbianceGallery title="The Experience" images={images} />;
}
