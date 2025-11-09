import Footer from '../Footer';

export default function FooterExample() {
  return (
    <Footer
      restaurantName="Éphémère"
      tagline="A limited culinary experience"
      email="hello@ephemere.com"
      socialLinks={{
        instagram: "https://instagram.com/ephemere",
        facebook: "https://facebook.com/ephemere"
      }}
    />
  );
}
