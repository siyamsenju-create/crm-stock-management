<img width="1470" height="956" alt="deshboard" src="https://github.com/user-attachments/assets/1f9a8b2f-f802-4f17-a2c9-63e54fefa447" />
<img width="1470" height="956" alt="setteings" src="https://github.com/user-attachments/assets/136461bb-1d9a-44f3-b0c0-1d2af7f0c167" />
<img width="1470" height="956" alt="analistcs" src="https://github.com/user-attachments/assets/5b03428b-3f86-40ad-b499-a77525d990bc" />
<img width="1470" height="956" alt="orders" src="https://github.com/user-attachments/assets/be098596-47ce-4437-a993-9ef34be3dcde" />
<img width="1470" height="956" alt="product" src="https://github.com/user-attachments/assets/4dd32bb1-af57-47dc-b299-23f2ee970aef" />
<img width="1470" height="956" alt="customer" src="https://github.com/user-attachments/assets/4ff5ebf7-3abf-445d-9c43-3640278cc814" />

# 🎨 JJ Painting & Hardwares — Enterprise CRM

A comprehensive, high-performance stock management and CRM solution designed specifically for hardware and painting enterprises. This application provides a seamless experience across **Web, Android, and iOS** using a single codebase.

## 🚀 Key Features

*   **Smart Dashboard**: Real-time KPI tracking for revenue, active customers, and stock levels.
*   **Advanced Product Catalog**: Interactive catalog featuring a slide-in detail drawer, live search, and category filtering.
*   **Inventory Control**: Precise stock tracking with "Quick Restock" functionality and low-stock automated alerts.
*   **Orders & Billing**: Full transactional history with status-based filtering (All, Pending, Completed).
*   **Multi-Period Analytics**: Deep-dive reports with Weekly, Monthly, and Yearly sales visualizations.
*   **Mobile Ready**: Fully synchronized with Capacitor for native Android and iOS deployment.
*   **Modern UI/UX**: Built with a premium, responsive design system using Tailwind CSS.

## 🛠️ Tech Stack

*   **Frontend**: React 19 + Vite
*   **State Management**: Zustand (with Persistence)
*   **Styling**: Tailwind CSS
*   **Mobile**: Capacitor (Native Android & iOS Bridge)
*   **Icons**: Google Material Symbols

## 📦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/siyamsenju-create/crm-stock-management.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Mobile Application (React Native + Expo)
The project includes a standalone React Native mobile application located in `backend/mobile-app`.

To run the mobile app:
1. Make sure your backend server is running first:
   ```bash
   cd backend
   npm run dev
   ```
2. Open a new terminal and navigate to the mobile app directory:
   ```bash
   cd backend/mobile-app
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the Expo development server:
   ```bash
   npm start
   ```
   *Note: Make sure to update the `EXPO_PUBLIC_API_URL` inside `backend/mobile-app/.env` if your local IP address changes.*
# 🏗️ System Architecture

This project follows a scalable, secure, cloud-native microservices architecture designed for web and mobile applications.

## Architecture Diagram

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/08c1b31f-1334-4206-b7d0-ea1ed2b7057d" />

---

## Architecture Highlights

### Client Layer
- Web Application
- Mobile Application (iOS / Android)
- Third-Party Integrations

### Edge & Security Layer
- CDN
- WAF Protection
- Load Balancer

### API Gateway
- Authentication & Authorization
- Rate Limiting
- Request Validation
- API Routing

### Microservices Layer
- User Service
- Tenant Service
- Subscription Service
- Billing Service
- Notification Service
- Project Service

### Data Layer
- PostgreSQL
- Redis Cache
- Object Storage
- Search Engine
- Analytics Warehouse

### Infrastructure
- Docker
- Kubernetes
- CI/CD Pipeline
- Auto Scaling
- Multi-Region Deployment

### Monitoring & Security
- Prometheus
- Grafana
- OpenTelemetry
- ELK Stack
- Sentry

---

## Deployment Flow

```text
Client Apps
   ↓
CDN / Load Balancer
   ↓
API Gateway
   ↓
Microservices
   ↓
Database / Cache / Storage
## 📄 License
Custom Enterprise License for JJ Painting & Hardwares.
