import MenuHighlights from '../MenuHighlights';
import dish1 from '@assets/stock_images/fine_dining_plating__d1e489c1.jpg';
import dish2 from '@assets/stock_images/fine_dining_plating__bbc0a5dc.jpg';
import dish3 from '@assets/stock_images/fine_dining_plating__21ea3959.jpg';
import dish4 from '@assets/stock_images/fine_dining_plating__48222664.jpg';
import dish5 from '@assets/stock_images/fine_dining_plating__7d06f067.jpg';
import dish6 from '@assets/stock_images/fine_dining_plating__a76cbce9.jpg';

export default function MenuHighlightsExample() {
  const dishes = [
    {
      name: "Roasted Monkfish",
      description: "Pan-seared monkfish with saffron beurre blanc, heirloom tomatoes, and micro herbs",
      price: "$42",
      image: dish1
    },
    {
      name: "Heritage Pork Tenderloin",
      description: "Sous-vide pork with apple mostarda, crispy pancetta, and wild mushroom reduction",
      price: "$38",
      image: dish2
    },
    {
      name: "Seasonal Tasting",
      description: "Chef's selection of three seasonal preparations highlighting local ingredients",
      price: "$58",
      image: dish3
    },
    {
      name: "Duck Confit",
      description: "Slow-cooked duck leg with cherry gastrique, roasted root vegetables, and thyme",
      price: "$45",
      image: dish4
    },
    {
      name: "Lobster Risotto",
      description: "Creamy arborio rice with butter-poached lobster, pea tendrils, and lemon zest",
      price: "$52",
      image: dish5
    },
    {
      name: "Wagyu Beef",
      description: "Grilled A5 wagyu with truffle pommes purée, asparagus, and red wine jus",
      price: "$68",
      image: dish6
    }
  ];

  return <MenuHighlights title="Signature Dishes" dishes={dishes} />;
}
