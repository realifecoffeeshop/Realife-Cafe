
import { Drink, ModifierGroup, ModifierOption, Discount, Category, KnowledgeArticle, TutorialStep } from './types';

export const INITIAL_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Hot Drinks' },
    { id: 'cat-2', name: 'Iced Drinks' },
    { id: 'cat-3', name: 'Teas' },
    { id: 'cat-4', name: 'Other' },
    { id: 'cat-5', name: 'Uncategorised' }, // Fallback category
];

export const INITIAL_MODIFIERS: ModifierGroup[] = [
  {
    id: 'mod-group-1',
    name: 'Milk Type',
    options: [
      { id: 'mod-1-1', name: 'Full Cream', price: 0.0, cost: 0.1 },
      { id: 'mod-1-2', name: 'Light', price: 0.0, cost: 0.1 },
      { id: 'mod-1-3', name: 'Almond', price: 0.75, cost: 0.25 },
      { id: 'mod-1-4', name: 'Soy', price: 0.5, cost: 0.2 },
      { id: 'mod-1-5', name: 'Oat', price: 0.75, cost: 0.25 },
      { id: 'mod-1-6', name: 'Lactose Free', price: 0.75, cost: 0.25 },
    ],
  },
  {
    id: 'mod-group-2',
    name: 'Sweetness',
    options: [
      { id: 'mod-2-1', name: '1 Sugar', price: 0.0, cost: 0.05 },
      { id: 'mod-2-2', name: '2 Sugars', price: 0.0, cost: 0.1 },
      { id: 'mod-2-3', name: 'Vanilla Syrup', price: 0.5, cost: 0.15 },
    ],
  },
  {
    id: 'mod-group-3',
    name: 'Espresso',
    options: [
      { id: 'mod-3-1', name: 'Double Shot', price: 0.5, cost: 0.4 },
      { id: 'mod-3-2', name: 'Triple Shot', price: 1.0, cost: 0.8 },
    ],
  },
  {
    id: 'mod-group-4',
    name: 'Chocolate',
    options: [
      { id: 'mod-4-1', name: 'Extra Milk Chocolate', price: 0.5, cost: 0.2 },
      { id: 'mod-4-2', name: 'Extra White Chocolate', price: 0.5, cost: 0.2 },
    ],
  },
  {
    id: 'mod-group-5',
    name: 'Marshmallow',
    options: [
      { id: 'mod-5-1', name: 'In', price: 0.0, cost: 0.1 },
      { id: 'mod-5-2', name: 'Out', price: 0.0, cost: 0.0 },
    ],
  },
];

const IMG_PARAMS = '?auto=format&fit=crop&w=500&q=60';

export const INITIAL_DRINKS: Drink[] = [
  // Hot Drinks
  {
    id: 'drink-1',
    name: 'Latte',
    category: 'cat-1',
    basePrice: 4.0,
    baseCost: 1.2,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2', 'mod-group-3'],
    description: 'A smooth, creamy coffee made with a shot of espresso and steamed milk.',
  },
  {
    id: 'drink-2',
    name: 'Cappuccino',
    category: 'cat-1',
    basePrice: 4.0,
    baseCost: 1.1,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a65342d' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2', 'mod-group-3'],
    description: 'The perfect balance of espresso, steamed milk, and a thick layer of foam.',
  },
  {
    id: 'drink-3',
    name: 'Flat White',
    category: 'cat-1',
    basePrice: 4.0,
    baseCost: 1.3,
    imageUrl: 'https://images.unsplash.com/photo-1596707442116-232537a7442a' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2', 'mod-group-3'],
    description: 'A rich espresso shot topped with velvety steamed milk for a smooth finish.',
  },
  {
    id: 'drink-4',
    name: 'Short Black',
    category: 'cat-1',
    basePrice: 3.0,
    baseCost: 0.8,
    imageUrl: 'https://images.unsplash.com/photo-1621267860477-1632432a8314' + IMG_PARAMS,
    modifierGroups: ['mod-group-3'],
    description: 'A pure, intense shot of espresso, also known as an espresso.',
  },
  {
    id: 'drink-5',
    name: 'Long Black',
    category: 'cat-1',
    basePrice: 3.5,
    baseCost: 0.9,
    imageUrl: 'https://images.unsplash.com/photo-1518004856236-717c5dbb03f1' + IMG_PARAMS,
    modifierGroups: ['mod-group-3'],
    description: 'A double-shot of espresso pulled over hot water to retain its crema.',
  },
  {
    id: 'drink-6',
    name: 'Macchiato',
    category: 'cat-1',
    basePrice: 3.25,
    baseCost: 0.9,
    imageUrl: 'https://images.unsplash.com/photo-1561737710-60a5b6fcf01b' + IMG_PARAMS,
    modifierGroups: ['mod-group-3'],
    description: "A bold shot of espresso 'stained' with a small dollop of steamed milk froth.",
  },
  {
    id: 'drink-7',
    name: 'Hot Chocolate',
    category: 'cat-1',
    basePrice: 4.5,
    baseCost: 1.3,
    imageUrl: 'https://images.unsplash.com/photo-1605333240291-05a8d9a43fe4' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-4', 'mod-group-5'],
    description: 'Rich, decadent chocolate melted into creamy steamed milk.',
  },
  {
    id: 'drink-8',
    name: 'Mocha',
    category: 'cat-1',
    basePrice: 4.75,
    baseCost: 1.4,
    imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36def' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2', 'mod-group-3', 'mod-group-4'],
    description: 'A delicious blend of rich chocolate, espresso, and steamed milk.',
  },
  {
    id: 'drink-9',
    name: 'White Hot Chocolate',
    category: 'cat-1',
    basePrice: 4.5,
    baseCost: 1.5,
    imageUrl: 'https://images.unsplash.com/photo-1572498284483-7923a105d3b3' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-4', 'mod-group-5'],
    description: 'A creamy and sweet alternative made from rich white chocolate and steamed milk.',
  },
  {
    id: 'drink-10',
    name: 'Piccolo',
    category: 'cat-1',
    basePrice: 3.5,
    baseCost: 1.0,
    imageUrl: 'https://images.unsplash.com/photo-1616870830113-a41ac2a2f814' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-3'],
    description: 'A mini latte with a restricted ristretto shot for a strong, balanced flavour.',
  },
  {
    id: 'drink-22',
    name: 'Americano',
    category: 'cat-1',
    basePrice: 3.50,
    baseCost: 0.8,
    imageUrl: 'https://images.unsplash.com/photo-1593443320739-7356223b3a43' + IMG_PARAMS,
    modifierGroups: ['mod-group-3'],
    description: 'A shot of espresso diluted with hot water, giving it a similar strength to, but different flavor from, traditionally brewed coffee.',
  },
  // Teas
  {
    id: 'drink-11',
    name: 'Chai Latte',
    category: 'cat-3',
    basePrice: 4.5,
    baseCost: 1.4,
    imageUrl: 'https://images.unsplash.com/photo-1573326140384-031e6ab9b48f' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2'],
    description: 'A sweet and spicy blend of black tea, aromatic spices, and steamed milk.',
  },
  {
    id: 'drink-12',
    name: 'Dirty Chai',
    category: 'cat-3',
    basePrice: 5.00,
    baseCost: 1.8,
    imageUrl: 'https://images.unsplash.com/photo-1594744453366-e84084724810' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2', 'mod-group-3'],
    description: 'A classic chai latte with an added shot of espresso for an extra kick.',
  },
  {
    id: 'drink-13',
    name: 'Sticky Chai',
    category: 'cat-3',
    basePrice: 5.0,
    baseCost: 1.8,
    imageUrl: 'https://images.unsplash.com/photo-1601923161314-54c7a6591741' + IMG_PARAMS,
    modifierGroups: ['mod-group-1'],
    description: 'Aromatic chai spices and black tea candied in honey, brewed to perfection.',
  },
  {
    id: 'drink-14',
    name: 'Matcha Latte',
    category: 'cat-3',
    basePrice: 4.75,
    baseCost: 1.5,
    imageUrl: 'https://images.unsplash.com/photo-1563514212933-2023a100db27' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2'],
    description: 'Vibrant Japanese green tea powder whisked with steamed milk.',
  },
  {
    id: 'drink-24',
    name: 'English Breakfast Tea',
    category: 'cat-3',
    basePrice: 3.50,
    baseCost: 0.5,
    imageUrl: 'https://images.unsplash.com/photo-1589136113881-857b32f91a66' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2'],
    description: 'A traditional blend of black teas originating from Assam, Ceylon and Kenya. A robust, full-bodied tea.',
  },
  // Iced Drinks
  {
    id: 'drink-15',
    name: 'Iced Coffee',
    category: 'cat-2',
    basePrice: 4.25,
    baseCost: 1.0,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2', 'mod-group-3'],
    description: 'Chilled coffee served over ice, perfect for a warm day.',
  },
  {
    id: 'drink-19',
    name: 'Iced Latte',
    category: 'cat-2',
    basePrice: 4.25,
    baseCost: 1.2,
    imageUrl: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2', 'mod-group-3'],
    description: 'A shot of espresso poured over milk and ice for a refreshing coffee hit.',
  },
  {
    id: 'drink-20',
    name: 'Iced Chocolate',
    category: 'cat-2',
    basePrice: 4.75,
    baseCost: 1.5,
    imageUrl: 'https://images.unsplash.com/photo-1587882390399-190644f0525d' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-4'],
    description: 'Rich chocolate syrup mixed with cold milk, served over ice.',
  },
  {
    id: 'drink-21',
    name: 'Iced Matcha Latte',
    category: 'cat-2',
    basePrice: 5.00,
    baseCost: 1.6,
    imageUrl: 'https://images.unsplash.com/photo-1509082025158-6c827339734e' + IMG_PARAMS,
    modifierGroups: ['mod-group-1', 'mod-group-2'],
    description: 'Vibrant Japanese green tea powder whisked with cold milk and served over ice.',
  },
  // Other
  {
    id: 'drink-16',
    name: 'Babyccino',
    category: 'cat-4',
    basePrice: 1.5,
    baseCost: 0.5,
    imageUrl: 'https://images.unsplash.com/photo-1610892013197-01e409395f17' + IMG_PARAMS,
    modifierGroups: [],
    description: 'Steamed, frothy milk in a tiny cup, perfect for the little ones.',
  },
  {
    id: 'drink-17',
    name: 'Cookie',
    category: 'cat-4',
    basePrice: 3.0,
    baseCost: 1.0,
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35' + IMG_PARAMS,
    modifierGroups: [],
    description: 'A freshly baked, deliciously chewy cookie, the perfect partner for any drink.',
  },
  {
    id: 'drink-18',
    name: 'Coffee Beans',
    category: 'cat-4',
    basePrice: 18.0,
    baseCost: 9.0,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93' + IMG_PARAMS,
    modifierGroups: [],
    description: 'Take our signature house blend home with you; whole beans for ultimate freshness.',
  },
  {
    id: 'drink-23',
    name: 'Affogato',
    category: 'cat-4',
    basePrice: 5.50,
    baseCost: 2.0,
    imageUrl: 'https://images.unsplash.com/photo-1627762226499-2245d44a29a1' + IMG_PARAMS,
    modifierGroups: [],
    description: 'A scoop of vanilla ice cream drowned with a shot of hot espresso. A perfect dessert.',
  },
];

export const INITIAL_DISCOUNTS: Discount[] = [
    { id: 'disc-1', code: 'STAFF10', type: 'percentage', value: 10 },
    { id: 'disc-2', code: '50OFF', type: 'percentage', value: 50 },
    { id: 'disc-3', code: '2DOLLARSOFF', type: 'fixed', value: 2 },
];

export const INITIAL_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'kb-0',
    title: 'The Full Order Lifecycle',
    category: 'Workflow',
    content: `1. A customer places an order via the Customer View.
2. For non-admin users, the order appears in the KDS **"Payment Required"** tab.
3. Staff at the counter collect payment and click **"Verify Payment & Send to Kitchen"**.
4. The order ticket moves to the **"Pending"** tab, and its timer starts.
5. Kitchen staff prepare the drinks, marking off items as they go.
6. Once all items are ready, they click **"Complete"** on the ticket header.
7. The order moves to the **"History"** tab, and the process is complete.`,
    imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1' + IMG_PARAMS,
  },
  {
    id: 'kb-1',
    title: 'Customer Ordering',
    category: 'Customer View',
    content: 'Customers browse the menu, which is organized by categories. They can click on any drink to open the customisation modal, where they can select modifiers like milk type, size, and syrups. The final price updates in real-time. Items can be added to the cart or saved as a favourite for later.',
    imageUrl: 'https://images.unsplash.com/photo-1551632436-cbf8dd354fa8' + IMG_PARAMS,
  },
  {
    id: 'kb-2',
    title: 'Shopping Cart & Checkout',
    category: 'Customer View',
    content: 'The cart flyout shows all items in the current order. Here, customers can provide their name, apply discount codes, and choose a pickup time (now or later). The system automatically applies loyalty rewards if available. The "Pay it Forward" feature lets them leave a nice message for the next customer.',
    imageUrl: 'https://images.unsplash.com/photo-1583394833446-ac868007a8a2' + IMG_PARAMS,
  },
  {
    id: 'kb-3',
    title: 'KDS: Payment Required',
    category: 'KDS',
    content: 'This is the first queue for orders placed by non-admin users. Tickets appear here highlighted in blue, showing the total amount to be collected. Staff must verify the payment and click "Send to Kitchen" to move the order to the pending queue for preparation.',
    imageUrl: 'https://images.unsplash.com/photo-1556740772-1a28a2a7f2d4' + IMG_PARAMS,
  },
  {
    id: 'kb-4',
    title: 'KDS: Pending Orders',
    category: 'KDS',
    content: 'This is the main preparation queue. Each ticket has a timer showing how long the order has been waiting. Timers change colour (green -> yellow -> orange -> red) as time increases. Staff can click individual items to strike them through as they are made, and click the header to complete the entire order.',
    imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece1466' + IMG_PARAMS,
  },
   {
    id: 'kb-5',
    title: 'KDS: Aggregated Views',
    category: 'KDS',
    content: 'The pending screen has three view modes: "By Order" (default tickets), "By Item" (groups all identical drinks with the same modifiers), and "By Type" (groups all drinks of the same type, listing variations). These views help staff prepare multiple drinks efficiently.',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4' + IMG_PARAMS,
  },
  {
    id: 'kb-6',
    title: 'KDS: Scheduled & History',
    category: 'KDS',
    content: 'The "Scheduled" tab shows orders for future pickup, which automatically move to Pending 15 minutes before their due time. The "History" tab shows all completed orders. From here, an admin can "Re-queue" an order if it was completed by mistake.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40' + IMG_PARAMS,
  },
  {
    id: 'kb-7',
    title: 'Admin: Dashboard',
    category: 'Admin Panel',
    content: 'The dashboard provides key business insights for a selected date range. It shows total revenue, profit, number of drinks processed, and average order completion time. A chart visualises revenue and profit over the selected period.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71' + IMG_PARAMS,
  },
  {
    id: 'kb-8',
    title: 'Admin: Menu Management',
    category: 'Admin Panel',
    content: 'This section allows full control over the menu. Admins can add, edit, and delete Categories, Drinks, and Modifier Groups. When creating or editing a drink, you can assign it to a category, set its price and cost, define an image, and link multiple modifier groups.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d713b22e85b' + IMG_PARAMS,
  },
  {
    id: 'kb-9',
    title: 'Admin: Permissions',
    category: 'Admin Panel',
    content: 'Admins can manage the roles of all registered users. The available roles are Customer, Kitchen Staff, and Administrator. For security, an administrator cannot change their own role to prevent being locked out of the admin panel.',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7' + IMG_PARAMS,
  },
  {
    id: 'kb-10',
    title: 'Accounts & Login',
    category: 'Customer View',
    content: `### Registered Users vs. Guests
**Registered Users** can save favourite drinks, track loyalty points, and have their name pre-filled for orders. All data is saved to their account.
**Guests** can place orders, but favourites and loyalty points are tied to the name they enter and are only saved on the current device.

### Logging In
Enter an existing registered name to log in and access your saved profile.

### Continuing as a Guest
Enter any name that is not already registered. A temporary guest profile will be created for your session.`,
    imageUrl: 'https://images.unsplash.com/photo-1529539795054-3c162aab037a' + IMG_PARAMS,
  },
  {
    id: 'kb-11',
    title: 'Providing Feedback',
    category: 'Workflow',
    content: `Your feedback is valuable to us! Use the feedback button (the speech bubble icon) to tell us about your experience.

1. Click the button to open the feedback form.
2. Select a star rating from 1 to 5.
3. Optionally, leave a detailed message in the text box.
4. Click "Submit Feedback".

All feedback is sent to our administrators for review. Thank you for helping us improve!`,
    imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d' + IMG_PARAMS,
  },
];

export const COFFEE_JOKES = [
  "What do you call a sad cup of coffee? Depresso.",
  "How did the hipster burn his tongue? He drank his coffee before it was cool.",
  "What’s the best Beatles song? Latte Be!",
  "Why are programmers so bad at making coffee? They can't handle the exceptions.",
  "What's it called when you steal someone's coffee? Mugging!",
  "How does Moses make his coffee? Hebrews it.",
  "What's the opposite of coffee? Sneezy.",
];

export const INITIAL_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'tut-step-1',
        title: 'Step 1: Welcome!',
        content: "Let's walk through placing an order. You can exit this guide at any time by clicking the backdrop.",
        target: '#customer-view-heading',
        position: 'bottom',
        waitForAction: false,
    },
    {
        id: 'tut-step-2',
        title: 'Step 2: Find Your Drink',
        content: "We've organised our drinks into categories. Use these filters to find what you're looking for.",
        target: '#menu-categories',
        position: 'bottom',
        waitForAction: false,
    },
    {
        id: 'tut-step-3',
        title: 'Step 3: Select an Item',
        content: "See something you like? Let's start by selecting a Latte. Click on it to start customising it.",
        target: '.first-drink-card',
        position: 'bottom',
        waitForAction: true,
    },
    {
        id: 'tut-step-4',
        title: 'Step 4: Choose Your Options',
        content: "Select your preferred milk, sweetness, and other options. The price updates automatically as you make selections.",
        target: '#modifiers-section',
        position: 'bottom',
        waitForAction: false,
    },
    {
        id: 'tut-step-5',
        title: 'Step 5: Set Quantity & Name',
        content: "Adjust the quantity or give your drink a custom name, which is perfect for keeping track of large group orders!",
        target: '#quantity-and-name-section',
        position: 'right',
        waitForAction: false,
    },
    {
        id: 'tut-step-6',
        title: 'Step 6: Add to Order',
        content: "Once you're happy with your drink, click here to add it to your order. You can add more drinks, or open the cart to checkout.",
        target: '#add-to-order-button',
        position: 'top',
        waitForAction: true,
    },
    {
        id: 'tut-step-7',
        title: 'Step 7: View Your Cart',
        content: "Great! Your drink is in the cart. Click this button to review your order and checkout.",
        target: '#cart-button',
        position: 'left',
        waitForAction: true,
    },
    {
        id: 'tut-step-8',
        title: 'Step 8: Finalize Your Order',
        content: "Almost there! Enter a name for your order, apply any discounts, and choose your pickup time.",
        target: '.cart-flyout-footer',
        position: 'top',
        waitForAction: false,
    },
    {
        id: 'tut-step-9',
        title: 'Step 9: Place Your Order',
        content: "Everything look good? Click here to send your order to our kitchen. Enjoy!",
        target: '#place-order-button',
        position: 'top',
        waitForAction: false,
    },
];
