import ReservationCTA from '../ReservationCTA';
import ctaImage from '@assets/stock_images/restaurant_ambiance__973c1831.jpg';

export default function ReservationCTAExample() {
  return (
    <ReservationCTA
      title="Reserve Your Experience"
      description="Seating is extremely limited for this exclusive engagement. Secure your table today and join us for an unforgettable evening."
      backgroundImage={ctaImage}
      ctaText="Reserve Now"
      contactEmail="reservations@ephemere.com"
    />
  );
}
