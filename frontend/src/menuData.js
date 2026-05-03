export const restaurants = [
  {
    id: 'grand-bistro',
    name: 'The Grand Bistro',
    tagline: 'Fine Casual Dining',
    menu: [
      {
        category: 'Starters',
        items: [
          { name: 'Soup of the Day',    description: "Chef's daily selection, freshly prepared with seasonal ingredients",        price: '8.00'  },
          { name: 'Garden Salad',       description: 'Mixed greens, cherry tomatoes, cucumber, house vinaigrette',                price: '10.00' },
          { name: 'Garlic Bruschetta', description: 'Toasted sourdough, fresh tomatoes, basil, extra virgin olive oil',           price: '9.00'  },
          { name: 'Crispy Calamari',   description: 'Lightly battered squid rings, served with marinara and aioli',              price: '13.00' },
        ],
      },
      {
        category: 'Mains',
        items: [
          { name: 'Grilled Salmon',    description: 'Atlantic salmon fillet, lemon butter sauce, seasonal vegetables',            price: '28.00' },
          { name: 'Beef Tenderloin',   description: '8oz prime tenderloin, red wine reduction, truffle mashed potato',            price: '36.00' },
          { name: 'Chicken Marsala',   description: 'Pan-seared chicken breast, Marsala wine sauce, wild mushrooms',              price: '24.00' },
          { name: 'Mushroom Risotto',  description: 'Arborio rice, wild mushrooms, Parmigiano Reggiano, truffle oil',             price: '22.00' },
        ],
      },
      {
        category: 'Burgers',
        items: [
          { name: 'Classic Smash',     description: 'Double smash patty, American cheese, pickles, house sauce',                  price: '16.00' },
          { name: 'BBQ Bacon',         description: 'Beef patty, crispy bacon, BBQ sauce, cheddar, caramelized onion',           price: '18.00' },
          { name: 'Mushroom Swiss',    description: 'Beef patty, sautéed mushrooms, Swiss cheese, garlic aioli',                 price: '17.00' },
          { name: 'Veggie Burger',     description: 'House-made plant patty, avocado, lettuce, tomato, chipotle mayo',           price: '15.00' },
        ],
      },
      {
        category: 'Pizza',
        items: [
          { name: 'Margherita',        description: 'San Marzano tomato, fresh mozzarella, basil, extra virgin olive oil',        price: '14.00' },
          { name: 'Pepperoni',         description: 'Tomato sauce, mozzarella, classic pepperoni',                               price: '16.00' },
          { name: 'BBQ Chicken',       description: 'BBQ base, grilled chicken, red onion, mozzarella, fresh cilantro',          price: '17.00' },
          { name: 'Truffle Mushroom',  description: 'Cream base, wild mushrooms, truffle oil, mozzarella, fresh thyme',          price: '19.00' },
        ],
      },
      {
        category: 'Desserts',
        items: [
          { name: 'Tiramisu',          description: 'Espresso-soaked ladyfingers, mascarpone cream, dusted with cocoa',           price: '9.00'  },
          { name: 'Lava Cake',         description: 'Warm dark chocolate cake, molten center, vanilla ice cream',                price: '10.00' },
          { name: 'Cheesecake',        description: 'New York style, graham cracker crust, seasonal berry compote',              price: '9.00'  },
          { name: 'Crème Brûlée',     description: 'Classic vanilla custard, caramelized sugar crust',                          price: '10.00' },
        ],
      },
      {
        category: 'Drinks',
        items: [
          { name: 'Fresh Lemonade',    description: 'Hand-squeezed lemonade, fresh mint, hint of ginger',                        price: '6.00'  },
          { name: 'Iced Tea',          description: 'Freshly brewed black or green tea, served over ice',                        price: '5.00'  },
          { name: 'Sparkling Water',   description: 'San Pellegrino 500ml',                                                      price: '4.00'  },
          { name: 'Mocktail of the Day', description: "Chef's seasonal non-alcoholic creation",                                  price: '8.00'  },
          { name: 'Orange Juice',      description: 'Freshly squeezed Valencia oranges',                                         price: '7.00'  },
        ],
      },
    ],
  },
];
