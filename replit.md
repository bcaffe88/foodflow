# Wilson Pizzaria - Food Delivery Platform

### Overview
The Wilson Pizzaria project is a multi-tenant food delivery platform providing a comprehensive solution for restaurants to manage online orders, deliveries, and customer interactions. It supports multiple user roles (customer, driver, restaurant owner, admin), offers robust integration capabilities with major food delivery services, and features real-time order tracking. The platform is designed for immediate deployment, aiming to optimize food delivery operations and customer satisfaction.

### User Preferences
- Linguagem: Portuguese BR
- Tone: Casual
- Cost preference: Zero external
- Response style: Concise

### Agent Communication Preferences (BMad Orchestrator)
- **Role**: Master Orchestrator and BMad Scholar
- **Communication Style**: Knowledgeable, guiding, approachable, very explanatory
- **Core Principle**: Transform into agents as needed, providing guidance and suggestions on workflows based on user needs
- **Expertise**: Deep knowledge across all agents and workflows, balanced technical brilliance with approachable communication

### System Architecture

#### UI/UX Decisions
The platform features dedicated applications for customers, restaurant owners, drivers, and kitchen staff, complemented by a comprehensive admin panel. An integration management dashboard is available within the restaurant owner application.

#### Technical Implementations
- **Core Platform**: Multi-tenant architecture, JWT authentication, PostgreSQL database with migrations, and real-time WebSocket updates.
- **Applications**:
    - **Customer App**: Restaurant browsing, menu, shopping cart, Stripe checkout, real-time order tracking, ratings & reviews.
    - **Restaurant Owner App**: Dashboard analytics, product management, order queue with status updates, driver tracking, settings, and integration management.
    - **Driver App**: Real-time order acceptance, GPS tracking, navigation, delivery tracking, earnings dashboard.
    - **Kitchen App**: Order queue, ESC-POS printer integration, order status management.
    - **Admin Panel**: Restaurant management, payment monitoring, system analytics, webhook configuration, robust error handling.
- **Notifications**: WhatsApp integration via `wa.me` (free), real-time WebSocket for order updates and driver assignments. SendGrid for email notifications (order confirmations, delivery complete).
- **Features**: GPS real-time tracking, order auto-assignment, promotional coupons, Stripe multi-tenant payments, Leaflet maps (OpenStreetMap), OSRM routing, comprehensive error handling and logging, analytics dashboard for restaurant owners, and customer rating and review system.

#### Feature Specifications
- **Multi-tenancy**: Supports multiple independent restaurants.
- **User Roles**: Customer, Driver, Restaurant Owner, Admin.
- **Authentication**: JWT-based.
- **Real-time Updates**: Powered by WebSockets.
- **Payment Processing**: Stripe for multi-tenant payments.
- **Mapping & Routing**: Leaflet (OpenStreetMap) for maps, OSRM for routing.
- **Printer Integration**: ESC-POS for kitchen orders.
- **Error Handling**: Standardized error responses, custom errors, auto error logging, and an admin error dashboard with tracking and statistics.
- **Analytics**: Frontend dashboard with KPIs, charts (revenue, orders, status, platform breakdown), and top items list.
- **Coupons**: Unlimited coupon creation with percentage/fixed amounts, usage limits, and expiry tracking.
- **Ratings**: 5-star interactive rating UI with comments and average rating calculation.

#### System Design Choices
Designed for high availability and scalability, with Railway deployment configurations for automatic scaling. Emphasizes robust error handling and comprehensive documentation.

### External Dependencies
- **Database**: PostgreSQL
- **Payment Gateway**: Stripe
- **Mapping**: Leaflet (OpenStreetMap)
- **Routing**: OSRM
- **Messaging**: Twilio (for WhatsApp integration), SendGrid (for email notifications)
- **Food Delivery Integrations**: iFood, UberEats, Quero Delivery, Pede Aí (framework)
- **Deployment Platform**: Railway.app