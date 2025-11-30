# Wilson Pizzaria - Food Delivery Platform

### Overview
The Wilson Pizzaria project is a multi-tenant food delivery platform designed to be 100% functional and ready for immediate deployment. It supports multiple user roles (customer, driver, restaurant owner, admin), includes robust integration capabilities with major food delivery services (iFood, UberEats, Quero Delivery, Pede Aí framework), and features real-time order tracking via WebSockets. The platform aims to provide a comprehensive solution for restaurants to manage online orders, deliveries, and customer interactions efficiently.

### User Preferences
- Linguagem: Portuguese BR
- Tone: Casual
- Cost preference: Zero external
- Response style: Concise

### System Architecture

#### UI/UX Decisions
- The platform includes dedicated applications for customers, restaurant owners, drivers, and a kitchen app, alongside a comprehensive admin panel.
- Integration management features are provided through a dashboard within the restaurant owner app.

#### Technical Implementations
- **Core Platform**: Multi-tenant architecture, JWT authentication, PostgreSQL database with migrations, real-time WebSocket updates.
- **Customer App**: Restaurant browsing, menu viewing, shopping cart, Stripe checkout, real-time order tracking, ratings & reviews.
- **Restaurant Owner App**: Dashboard analytics, product management, order queue with status updates, driver tracking, settings, and integration management.
- **Driver App**: Real-time order acceptance, GPS tracking, navigation, delivery tracking, earnings dashboard.
- **Kitchen App**: Order queue, ESC-POS printer integration, order status management.
- **Admin Panel**: Restaurant management, payment monitoring, system analytics, webhook configuration, robust error handling.
- **Notifications**: WhatsApp integration via wa.me (free), real-time WebSocket for order updates and driver assignments.
- **Features**: GPS real-time tracking, order auto-assignment, promotional coupons, Stripe multi-tenant payments, Leaflet maps (OpenStreetMap), OSRM routing.
- **Twilio WhatsApp Integration**: Implemented for various notifications (order confirmation, status updates, kitchen alerts) with full API support and a fallback mode for development/testing.

#### Feature Specifications
- **Multi-tenancy**: Supports multiple independent restaurants.
- **User Roles**: Customer, Driver, Restaurant Owner, Admin.
- **Authentication**: JWT-based.
- **Real-time Updates**: Powered by WebSockets.
- **Payment Processing**: Stripe for multi-tenant payments.
- **Mapping & Routing**: Leaflet (OpenStreetMap) for maps, OSRM for routing.
- **Printer Integration**: ESC-POS for kitchen orders.

#### System Design Choices
- The system is designed for high availability and scalability, with Railway deployment configurations ready for automatic scaling.
- Emphasis on robust error handling, especially within the admin panel and API calls.
- Comprehensive documentation provided for architecture, features, deployment, and troubleshooting.

### External Dependencies
- **Database**: PostgreSQL
- **Payment Gateway**: Stripe
- **Mapping**: Leaflet (OpenStreetMap)
- **Routing**: OSRM
- **WhatsApp Integration**: Twilio (with wa.me fallback)
- **Food Delivery Integrations**: iFood, UberEats, Quero Delivery, Pede Aí (framework)
- **Deployment Platform**: Railway.app