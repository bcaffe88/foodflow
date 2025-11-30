# Wilson Pizzaria - Food Delivery Platform

### Overview
The Wilson Pizzaria project is a multi-tenant food delivery platform providing a comprehensive solution for restaurants to manage online orders, deliveries, and customer interactions. It supports multiple user roles (customer, driver, restaurant owner, admin), offers robust integration capabilities with major food delivery services, and features real-time order tracking. The platform is designed for immediate deployment, aiming to optimize food delivery operations and customer satisfaction, with a business vision to streamline food delivery operations and enhance customer satisfaction across multiple restaurants. The platform is currently production-ready.

### User Preferences
- Linguagem: Portuguese BR
- Tone: Casual
- Cost preference: Zero external
- Response style: Concise

### System Architecture

#### UI/UX Decisions
The platform features dedicated applications for customers, restaurant owners, drivers, and kitchen staff, complemented by a comprehensive admin panel. An integration management dashboard is available within the restaurant owner application. The admin panel includes dashboards, restaurant management (CRUD), webhook configuration, and platform-wide settings.

#### Technical Implementations
- **Core Platform**: Multi-tenant architecture, JWT authentication, PostgreSQL database with migrations, and real-time WebSocket updates.
- **Applications**: Customer App, Restaurant Owner App, Driver App, Kitchen App, and Admin Panel.
- **Notifications**: WhatsApp integration via `wa.me`, real-time WebSocket for order updates and driver assignments, and SendGrid for email notifications.
- **Features**: GPS real-time tracking, order auto-assignment, promotional coupons, Stripe multi-tenant payments, Leaflet maps (OpenStreetMap), OSRM routing, comprehensive error handling and logging, analytics dashboard for restaurant owners, and customer rating and review system.
- **Data Integrity**: Application-layer validation prevents FK constraint violations on orders and products, and protects products from deletion if they are part of existing orders.
- **Authentication**: JWT-based with refresh tokens, with `queryClient` configured to send Authorization Bearer tokens in headers for all authenticated requests. Isolated authentication system for kitchen staff.
- **Printer Integration**: Supports ESC-POS for kitchen orders (USB, TCP/IP, Bluetooth) and a new **WEBHOOK mode for online printing** with configurable URL, secret, and enablement.

#### Feature Specifications
- **Multi-tenancy**: Supports multiple independent restaurants.
- **User Roles**: Customer, Driver, Restaurant Owner, Kitchen Staff, Platform Admin.
- **Real-time Updates**: Powered by WebSockets (driver assignments, order status).
- **Payment Processing**: Stripe for multi-tenant payments.
- **Mapping & Routing**: Leaflet (OpenStreetMap) for maps, OSRM for routing.
- **Error Handling**: Standardized error responses, custom errors, auto error logging, data integrity validation.
- **Analytics**: Frontend dashboard with KPIs, charts (revenue, orders, status).
- **Coupons**: Unlimited coupon creation with percentage/fixed amounts.
- **Ratings**: 5-star interactive rating UI with comments.
- **Admin Panel**: Full CRUD for restaurants, status management, commission control.
- **Data Integrity**: FK constraint prevention, product deletion protection, order validation.
- **Kitchen Staff Management**: Isolated login for kitchen staff, with UI for restaurant owners to create, list, and delete staff members, ensuring secure and isolated access.

#### System Design Choices
Designed for high availability and scalability, with Railway deployment configurations for automatic scaling. Emphasizes robust error handling, multi-tenant isolation, comprehensive documentation, and application-layer data integrity. Production-ready with all critical features implemented and tested.

### External Dependencies
- **Database**: PostgreSQL
- **Payment Gateway**: Stripe
- **Mapping**: Leaflet (OpenStreetMap)
- **Routing**: OSRM
- **Messaging**: Twilio (for WhatsApp integration), SendGrid (for email notifications)
- **Food Delivery Integrations**: iFood, UberEats, Quero Delivery, Pede Aí
- **Deployment Platform**: Railway.app