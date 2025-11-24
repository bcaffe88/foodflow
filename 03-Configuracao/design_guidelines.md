# Design Guidelines: Food Delivery Menu System

## Design Approach: Reference-Based (iFood/Uber Eats)

This is a **utility-focused e-commerce application** inspired by industry leaders iFood and Uber Eats. The design prioritizes efficient browsing, quick decision-making, and seamless checkout flow typical of food delivery platforms.

**Key Design Principles:**
- Mobile-first responsive design (most food orders happen on mobile)
- Visual hierarchy that guides users from browsing → customization → checkout
- Appetite appeal through prominent product imagery
- Friction-free ordering experience with minimal steps

---

## Typography

**Font Stack:** Inter (primary) with Roboto fallback
```
Headings (H1): font-bold text-3xl md:text-4xl (category headers, page titles)
Headings (H2): font-semibold text-2xl md:text-3xl (section titles)
Headings (H3): font-semibold text-xl (product names, cart headers)
Body Large: font-medium text-base (product descriptions, important info)
Body Regular: font-normal text-sm (metadata, secondary info)
Price Text: font-bold text-lg md:text-xl (always prominent)
Button Text: font-semibold text-base
Caption: font-normal text-xs (delivery times, disclaimers)
```

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: py-8 md:py-12
- Card gaps: gap-4 or gap-6
- Element margins: mb-4, mt-6, etc.

**Container Strategy:**
- Max width: max-w-7xl mx-auto px-4
- Product grid: 2 columns mobile, 3-4 columns desktop
- Sticky cart sidebar on desktop (right side), bottom sheet on mobile

---

## Color Palette (User-Specified)

- **Primary Red:** #EA1D2C (CTAs, active states, brand elements)
- **Secondary Green:** #00AA4B (success states, confirmation, delivery info)
- **Background:** #F8F8F8 (page background)
- **Text:** #333333 (primary text)
- **Accent Orange:** #FF6B35 (highlights, badges, promotions)
- **Card White:** #FFFFFF (product cards, cart, modals)

---

## Component Library

### Navigation Header
- Sticky top navigation with white background, shadow on scroll
- Logo left, category quick-links center, cart icon with badge right
- Search bar prominent beneath logo (full-width on mobile)

### Category Navigation
- Horizontal scrollable pill buttons below header
- Active category highlighted with primary red background
- Smooth scroll to category sections on click

### Product Cards
- White cards with subtle shadow, rounded corners (rounded-lg)
- Product image aspect ratio 4:3, fills card width
- Product name, description (2-line truncate), price clearly stacked
- "Add to Cart" button in primary red, full-width at card bottom
- Hover state: subtle lift effect (shadow-lg)

### Cart Summary (Sticky Sidebar Desktop / Bottom Sheet Mobile)
- White background with shadow
- Line items with quantity controls (+/- buttons), remove option
- Subtotal, delivery fee, total calculations clearly separated
- Primary CTA: "Proceed to Checkout" button (large, red, prominent)
- Empty cart state with icon and encouraging message

### Customization Modal
- Appears when adding customizable items
- Product image at top, customization options (checkboxes/radio) below
- Quantity selector prominent
- "Add to Cart" CTA at bottom (sticky)

### Checkout Flow
- Multi-step but visually appears as single page on desktop
- Step 1: Customer details (name, phone) - validated inputs
- Step 2: Delivery address (text area with clear placeholder)
- Step 3: Order notes (optional text area)
- Step 4: Order review with edit options
- Submit button: "Send Order via WhatsApp" (green secondary color)

### Footer
- Simple single-row layout
- Left: "For automated service, contact Bruno Caffé"
- Right: WhatsApp icon + phone number (87999480699) as clickable link
- Background: #333333, text white

---

## Images

**Product Images:**
- Each product card displays high-quality food photography
- Images should be appetizing, well-lit, consistent style
- Aspect ratio: 4:3 (landscape) for uniformity
- Use placeholder service initially: `https://source.unsplash.com/800x600/?food,{productname}`

**Empty States:**
- Empty cart: Simple icon (shopping cart), no background image needed
- No search results: Friendly illustration or icon

**Hero Section: NOT REQUIRED**
This is a utility-focused catalog app - users come to browse products immediately, not view marketing content. Product grid starts immediately below navigation.

---

## Interaction Patterns

**Add to Cart Animation:**
- Brief scale animation on cart icon when item added
- Cart badge count updates with gentle bounce

**Quantity Controls:**
- Large touch-friendly +/- buttons (min 44x44px touch target)
- Disabled state when reaching min (1) or max quantities

**Category Filtering:**
- Smooth scroll to selected category section
- Highlight active category in navigation

**Checkout Validation:**
- Inline validation with clear error messages in accent orange
- Disabled submit button until all required fields valid

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column product grid
- Cart as bottom sheet (slides up on tap)
- Stacked checkout form fields
- Horizontal scrolling category pills

**Tablet (768px - 1024px):**
- 2-3 column product grid
- Cart sidebar appears on right (30% width)

**Desktop (> 1024px):**
- 3-4 column product grid
- Fixed cart sidebar right (320px width)
- Checkout form in two columns where appropriate

---

**Critical Success Factors:**
1. Product images must be large and appetizing
2. Pricing always prominent and clear
3. Cart always accessible (sticky/fixed)
4. Minimal friction from browsing to WhatsApp submission
5. Mobile experience is primary - optimize touch targets and scrolling