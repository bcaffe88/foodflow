# FoodFlow Pizza Delivery Platform - Design Guidelines

## Design Approach
**Reference-Based**: Drawing from iFood and Uber Eats delivery app patterns - optimized for seamless food ordering with visual emphasis on products and frictionless checkout flow.

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, modern readability
- **Hierarchy**:
  - Brand/Logo: Bold, 24px
  - Product Names: Semibold, 18px
  - Prices: Bold, 20px
  - Descriptions: Regular, 14px
  - Category Tabs: Medium, 16px
  - Buttons: Semibold, 15px

## Layout & Spacing System
**Tailwind Units**: Consistent use of 2, 4, 6, 8, 12, 16 spacing units
- Container: max-w-7xl with px-4 mobile, px-6 desktop
- Section padding: py-8 mobile, py-12 desktop
- Card padding: p-6
- Grid gaps: gap-6 mobile, gap-8 desktop

## Component Library

### Navbar (Sticky Top)
- Fixed position, backdrop blur, subtle shadow
- Layout: Flex justify-between, h-16
- Left: FoodFlow logo (text + pizza icon from Heroicons)
- Right: Cart icon with badge counter (items count), subtle animation on add
- Mobile: Collapsed, hamburger unnecessary (minimal navigation)

### Hero Section
- Height: 60vh, background gradient overlay
- **Hero Image**: Large, appetizing pizza image (melting cheese, fresh ingredients, professional food photography)
- Content overlay (bottom-left positioning):
  - H1: "Pizzas Artesanais Direto do Forno"
  - Subtitle: "Entrega rápida em 30-40 minutos"
  - Delivery fee badge + minimum order info
- No CTA button (direct scroll to menu)

### Category Tabs
- Full-width container with centered tab group
- Tabs: "Salgadas" | "Doces" 
- Active state: bottom border (4px), bold text
- Inactive: Regular weight, semi-transparent
- Spacing: px-8 py-4 per tab
- Smooth transition on switch (200ms)

### Product Grid
- Responsive: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card Structure:
  - Image container: aspect-square, rounded-2xl, overflow-hidden
  - Image: Object-cover, slight scale on hover (1.05)
  - Content padding: p-6
  - Product name: mb-2
  - Description: 2-line clamp, mb-4
  - Bottom section (flex justify-between items-center):
    - Price: Large, bold
    - Add button: Icon + text, rounded-full, px-6 py-3
- Card elevation: Subtle shadow, enhanced on hover

### Product Cards (12 items minimum)
**Salgadas Category:**
- Margherita, Pepperoni, Quatro Queijos, Portuguesa, Frango c/ Catupiry, Calabresa, Vegetariana, Bacon, Napolitana

**Doces Category:**
- Chocolate, Romeu e Julieta, Banana Nevada

**Image Descriptions**: High-quality, top-down food photography with vibrant colors, visible fresh ingredients, melted cheese detail, professional lighting, white/neutral backgrounds

### Cart Button Specification
- Blurred background (backdrop-blur-md) with semi-transparent fill
- Rounded-full design
- Icon (Heroicons shopping-cart) + "Adicionar" text
- Inherits default button hover/active states

### Footer
- Compact, py-12
- Three columns desktop, stacked mobile:
  - Column 1: Logo + tagline
  - Column 2: Links (Sobre, Cardápio, Contato)
  - Column 3: Social icons (Instagram, Facebook, WhatsApp)
- Bottom: Copyright + payment methods icons

## Layout Principles
- **Visual Hierarchy**: Food images are heroes - large, prominent, high-quality
- **White Space**: Generous padding between cards (gap-8), clean breathing room
- **Frictionless Flow**: Navbar → Hero scroll → Immediate menu access → Clear CTAs
- **Grid Consistency**: Maintain alignment, even spacing throughout
- **Mobile-First**: Touch-friendly targets (min 44px), simplified single-column on mobile

## Image Requirements
- **Hero**: 1920x1080px landscape, appetizing pizza close-up with steam/freshness
- **Product Cards**: 800x800px square, consistent styling across all items
- **Total Images**: 1 hero + 12 product images minimum

## Interaction Patterns
- Sticky navigation with cart always accessible
- Tab switching updates entire grid with subtle fade transition
- Card hover: Slight lift (translateY -2px) + shadow enhancement
- Cart badge pulse animation on item add
- Smooth scrolling between sections

**No animations beyond: card hover lift, tab transitions, cart badge pulse**