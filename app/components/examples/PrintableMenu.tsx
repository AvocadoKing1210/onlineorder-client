import PrintableMenu from '../PrintableMenu';
import dish1 from '@assets/stock_images/fine_dining_plating__d1e489c1.jpg';
import dish2 from '@assets/stock_images/fine_dining_plating__bbc0a5dc.jpg';
import dish3 from '@assets/stock_images/fine_dining_plating__21ea3959.jpg';
import dish4 from '@assets/stock_images/fine_dining_plating__48222664.jpg';

export default function PrintableMenuExample() {
  const items = [
    {
      name: "Roasted Monkfish",
      description: "Pan-seared with saffron beurre blanc, heirloom tomatoes",
      price: "$42",
      image: dish1
    },
    {
      name: "Heritage Pork Tenderloin",
      description: "Sous-vide pork with apple mostarda, wild mushroom",
      price: "$38",
      image: dish2
    },
    {
      name: "Seasonal Tasting",
      description: "Chef's selection of three seasonal preparations",
      price: "$58",
      image: dish3
    },
    {
      name: "Duck Confit",
      description: "Slow-cooked with cherry gastrique, roasted vegetables",
      price: "$45",
      image: dish4
    }
  ];

  return (
    <PrintableMenu
      title="Take-Home Menu"
      subtitle="Save or print our curated selection for your records"
      categories={[{ name: "Featured", items }]}
    />
  );
}
