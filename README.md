# Jen's Pastry Shop

> **Pastry Shop Management System**  
> A mobile-first management application built with **React JS**, **Vite**, and **JavaScript**, demonstrating Gang of Four (GoF) software design patterns for a college JavaScript / Object-Oriented Programming / Design Patterns course.

---

## 🥐 Project Description

**Jen's Pastry Shop Management System** is a mobile-first Point of Sale (POS) and inventory management web application. Specially crafted for pastry shops and bakeries, it provides bakery owners and staff with a touch-friendly interface to manage daily operations on smartphones or tablets:

- **Dashboard:** Real-time visibility into key performance metrics (Total Products, Total Stock Units, Today's Sales in ₱, and Low Stock Alerts) alongside recent transactions.
- **Pastry Products Catalog:** Full CRUD (Create, Read, Update, Delete) product management with instant search, category filtering (Bread, Pastry, Cake, Dessert), and mobile cards.
- **Inventory Tracking:** Real-time visual stock indicators (`🟢 In Stock`, `🟠 Low Stock`, `🔴 Out of Stock`) and a quick restock feature for adding freshly baked batches.
- **Point of Sale (POS) & Checkout:** Touch-friendly cart with stock enforcement, line totals, real-time discount calculations, and printable thermal receipt generation.
- **Sales History:** Detailed past transaction records with itemized receipts and customer classification.

The application has been styled with a warm, pastry-inspired aesthetic (warm browns, creams, soft oranges, and light beige) and feels like a native iOS/Android application.

---

## ⚙️ Technologies

* **React JS (v19):** Functional components and React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
* **Vite (v8):** Ultra-fast frontend build tool and local development server.
* **JavaScript (ES6+):** Pure JavaScript with modern classes, private fields, and array methods (No TypeScript).
* **HTML5 & CSS3:** Mobile-first responsive layout, CSS custom properties (variables), safe-area insets, and flexbox/grid.
* **Browser LocalStorage:** Client-side persistent storage for products, inventory stock, and sales history.
* **Lucide React:** Clean, mobile-friendly icons.

---

## ✨ Features

1. **Mobile Dashboard:**
   - Summary cards displaying **Total Products**, **Inventory Items**, **Today's Sales (₱)**, and **Low Stock Warnings**.
   - Low-stock warning alert highlighting pastries with 10 or fewer items remaining.
   - Quick action shortcuts: *New Sale*, *Add Pastry*, *Check Stock*.
   - Recent Sales list showing transaction IDs, dates, and amounts.

2. **Products Management:**
   - Real-time search across pastry names and categories.
   - Horizontal category filter pills: `All`, `Bread`, `Pastry`, `Cake`, `Dessert`.
   - Add new pastry products with validation (Name, Category, Price, Stock).
   - Edit existing pastries.
   - Delete pastries with confirmation safeguard.

3. **Inventory Control:**
   - Automatic visual status badges:
     - `🟢 In Stock` (> 10 units)
     - `🟠 Low Stock` (1–10 units)
     - `🔴 Out of Stock` (0 units)
   - Status filters (`All`, `In Stock`, `Low Stock`, `Out of Stock`) and search.
   - Quick Restock modal to replenish baked batches (+5, +10, +20, or custom).

4. **Sales & Checkout (Point of Sale):**
   - Quick-tap product selector to add items to cart.
   - Cart quantity adjusters (`+` and `-`) with stock limits (cannot exceed available inventory).
   - Dynamic subtotal, discount, and final total calculations.
   - "Complete Sale" action that deducts inventory, records transaction, and displays a thermal-style printable receipt.

5. **Customer Discount System:**
   - Supports **Regular Customers** (0%), **Student Customers** (5%), and **Bulk Orders** (10%).

6. **Sales History:**
   - Mobile transaction cards showing Sale ID (e.g., `Sale #001`), timestamp, customer type, item breakdown, and financial totals.
   - Receipt viewer modal for each past transaction.

7. **Data Persistence (LocalStorage):**
   - Products and sales history survive page reloads and browser closures.
   - Automatic seeding of standard sample pastries on initial launch.
   - In-app "Reset Sample Data" button in the Info header menu for demoing and grading.

8. **Mobile Viewport Simulator:**
   - Realistic iPhone/Android frame with status bar for desktop demonstration.
   - Top toggle to switch between **Phone Frame** and **Full Width** responsive views.

---

## 💻 JavaScript Concepts Demonstrated

### 1. Variables
Used with modern ES6 block scoping:
* `const`: Used for immutable references such as discount rates, storage keys, DOM references, and category arrays.
* `let`: Used for mutable variables such as loop counters, running subtotals, and dynamically computed totals.

### 2. Objects
Used to model data structures and domain entities:
* **Product Objects:** `{ id: 1, name: "Pandesal", category: "Bread", price: 3, stock: 100 }`
* **Sale Objects:** `{ id: "SALE-001", date, customerType, items, subtotal, discount, total }`
* **Cart Items:** `{ product: {...}, quantity: 2 }`
* **Discount Strategies:** Strategy objects encapsulating discount algorithms.

### 3. Arrays
Used for collections and functional data transformations:
* `products`: Array of all active pastries.
* `sales`: Array of all completed transactions.
* `cart`: Array of items currently in the checkout cart.
* **Array Methods Used:** `.map()`, `.filter()`, `.reduce()`, `.find()`, `.findIndex()`, `.some()`.

### 4. Functions
Reusable, modular functions with single responsibility:
* `PastryProductFactory.createProduct()`
* `ShopManager.getInstance()`
* `formatCurrency()`, `formatSaleNumber()`, `formatDateTime()`
* `saveProducts()`, `loadProducts()`, `saveSales()`, `loadSales()`
* `completeSale()`, `updateStock()`, `deleteProduct()`

---

## 🏗️ Design Patterns

This project highlights three core Gang of Four (GoF) design patterns, which are actively wired into the application's runtime logic:

```
┌────────────────────────────────────────────────────────┐
│                   Jen's Pastry Shop                    │
└────────────────────────────────────────────────────────┘
          │                                     │
          ▼                                     ▼
 🏭 Factory Pattern                    👑 Singleton Pattern
 (PastryProductFactory)                   (ShopManager)
 • Instantiates Bread, Pastry,           • Single source of truth
   Cake, and Dessert objects             • Manages inventory,
 • Validates fields & defaults             catalog & transactions
                                                │
                                                ▼
                                       🎯 Strategy Pattern
                                      (Discount Strategies)
                                      • RegularCustomer (0%)
                                      • StudentCustomer (5%)
                                      • BulkOrder (10%)
```

### 1. Factory Pattern (`src/patterns/PastryProductFactory.js`)
* **Purpose:** Centralizes and standardizes the creation of pastry product objects in one location.
* **How It Works:** Rather than using object literals everywhere, client code calls `PastryProductFactory.createProduct(productData)`. The factory validates the input (valid name, positive price, non-negative stock) and instantiates the proper category class (`BreadProduct`, `PastryProductItem`, `CakeProduct`, `DessertProduct`) with default icons and shelf-life attributes.
* **Code Reference:**
  ```javascript
  // FACTORY PATTERN
  // Creates pastry product objects in one centralized place.
  export class PastryProductFactory {
    static createProduct(productData) {
      // validates inputs and creates appropriate product category object
      ...
    }
  }
  ```

### 2. Singleton Pattern (`src/patterns/ShopManager.js`)
* **Purpose:** Ensures that exactly one instance of the `ShopManager` exists throughout the entire application lifecycle.
* **How It Works:** Uses a static private instance `#instance` and a static getter `ShopManager.getInstance()`. The constructor prohibits multiple instantiations. `ShopManager` coordinates the products catalog, stock level updates, transactions, LocalStorage synchronization, and publishes state updates to React via the Observer/Subscriber mechanism.
* **Code Reference:**
  ```javascript
  // SINGLETON PATTERN
  // Ensures that only one Shop Manager instance exists.
  class ShopManager {
    static #instance = null;

    static getInstance() {
      if (!ShopManager.#instance) {
        ShopManager.#instance = new ShopManager();
      }
      return ShopManager.#instance;
    }
  }
  ```

### 3. Strategy Pattern (`src/patterns/DiscountStrategies.js`)
* **Purpose:** Encapsulates interchangeable discount algorithms into separate classes, eliminating sprawling `if/else` or `switch` blocks during checkout.
* **How It Works:** Defines three strategy classes implementing a common `calculateDiscount(subtotal)` interface:
  - `RegularDiscountStrategy` (0% off)
  - `StudentDiscountStrategy` (5% off)
  - `BulkOrderDiscountStrategy` (10% off)
  During checkout, the selected strategy is passed directly into the checkout pipeline to compute the discount dynamically.
* **Code Reference:**
  ```javascript
  // STRATEGY PATTERN
  // Allows different discount methods to be selected during checkout.
  export class RegularDiscountStrategy {
    calculateDiscount(subtotal) { return 0; }
  }
  export class StudentDiscountStrategy {
    calculateDiscount(subtotal) { return subtotal * 0.05; }
  }
  export class BulkOrderDiscountStrategy {
    calculateDiscount(subtotal) { return subtotal * 0.10; }
  }
  ```

---

## 📁 Project Structure

```text
jenspastry/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BottomNavigation.jsx     # Mobile fixed bottom nav bar
│   │   ├── CartItem.jsx             # Cart row item with qty controls
│   │   ├── DashboardCard.jsx        # Summary metric card
│   │   ├── Header.jsx               # Mobile header & pattern guide
│   │   ├── NotificationToast.jsx    # Animated feedback alerts
│   │   ├── ProductCard.jsx          # Mobile pastry card with actions
│   │   ├── ProductFormModal.jsx     # Add/Edit form with Factory Pattern
│   │   ├── QuickRestockModal.jsx    # Restock freshly baked batches
│   │   ├── ReceiptModal.jsx         # Printable thermal receipt
│   │   └── SaleCard.jsx             # Mobile sales history record card
│   │
│   ├── hooks/
│   │   └── useShop.js               # React hook connecting to Singleton
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx            # Performance overview & alerts
│   │   ├── Inventory.jsx            # Stock control & status badges
│   │   ├── Products.jsx             # Product catalog & CRUD
│   │   └── Sales.jsx                # Point of sale & sales history
│   │
│   ├── patterns/
│   │   ├── DiscountStrategies.js    # STRATEGY PATTERN implementation
│   │   ├── PastryProductFactory.js  # FACTORY PATTERN implementation
│   │   └── ShopManager.js           # SINGLETON PATTERN implementation
│   │
│   ├── utils/
│   │   ├── formatters.js            # Currency (₱), date & ID formatters
│   │   └── storage.js               # Browser LocalStorage integration
│   │
│   ├── App.css                      # Mobile application styling
│   ├── App.jsx                      # Root container & simulator controls
│   ├── index.css                    # Theme variables & base layout
│   └── main.jsx                     # Application entry point
│
├── test/
│   └── patterns_and_features.test.js # Automated unit & pattern test suite
├── index.html                       # HTML5 mobile viewport template
├── package.json
└── vite.config.js
```

---

## 🚀 How to Run

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18 or newer) installed.

### 1. Installation
Open your terminal in the project directory and install the dependencies:
```bash
npm install
```

### 2. Start the Development Server
Run the Vite development server with network access enabled:
```bash
npm run dev
```

### 3. Open on Your Computer
In your browser, navigate to:
```
http://localhost:5173/
```
The application will render inside a simulated mobile phone frame on desktop screens. You can use the top toggle to switch between **Phone Frame** and **Full Width**.

### 4. How to Download & Install to Your Mobile Device (PWA)

You can download and install Jen's Pastry Shop directly to your phone as a standalone mobile app with its own home screen icon and offline support:

#### On Android Phones (Google Chrome):
1. Connect your phone to the same Wi-Fi network as your computer.
2. In Google Chrome on your phone, open the **Network URL** shown in your terminal (e.g., `http://192.168.1.8:5173/`).
3. Tap the **"📲 Install"** button in the header or the **"Download to Device"** banner on the dashboard.
4. Alternatively, tap Chrome's three dots menu (`⋮`) and select **"Install app"** or **"Add to Home screen"**.
5. Tap **Install**. The **Jen's Pastry Shop** icon will be added to your home screen and app drawer!

#### On iPhones / iPads (Apple Safari):
1. Connect your iPhone to the same Wi-Fi network as your computer.
2. Open **Safari** and enter the **Network URL** (e.g., `http://192.168.1.8:5173/`).
3. Tap the **Share** button (📤 icon at the bottom of the screen).
4. Scroll down and tap **"Add to Home Screen"** (➕).
5. Tap **"Add"** in the top-right corner.
6. The app icon will appear on your iPhone screen and launches full-screen without Safari toolbars!

#### On PC / Mac (Chrome / Edge / Windows / macOS):
1. In Chrome or Edge, click the **Install** button 📥 in the browser address bar, or tap the **"Install"** button in the app header.
2. Click **Install**. The app will run in its own standalone desktop window.

---

### 5. Native Mobile Packaging with Capacitor (Android APK)

The project includes pre-configured **Capacitor** integration (`capacitor.config.json` with App ID `com.jenspastry.app`).

To generate an Android Studio project or APK:
```bash
# 1. Build the production web assets
npm run build

# 2. Add Android platform
npx cap add android

# 3. Copy web assets into the native Android shell
npx cap sync

# 4. Open in Android Studio to build APK or run on an emulator
npx cap open android
```

---

### 6. Run Automated Tests
To run the automated test suite verifying all three design patterns and CRUD operations:
```bash
npm test
```

### 7. Build for Production
To build the minified production assets:
```bash
npm run build
```

---

## 👨‍🏫 Instructor Evaluation Guide

| Feature / Pattern | Location in Code | How to Verify in the App |
| :--- | :--- | :--- |
| **Factory Pattern** | `src/patterns/PastryProductFactory.js` | Go to **Products** → Tap **+ Add Product** → Fill in details → Submit. The object is created via `PastryProductFactory.createProduct()`. |
| **Singleton Pattern** | `src/patterns/ShopManager.js` | The single instance coordinates products, inventory, and sales. Completing a sale in **Sales** updates the **Dashboard** and **Inventory** instantly. |
| **Strategy Pattern** | `src/patterns/DiscountStrategies.js` | In **Sales**, add pastries to cart and switch between *Regular (0%)*, *Student (5%)*, and *Bulk (10%)*. The discount updates dynamically. |
| **LocalStorage** | `src/utils/storage.js` | Add a product or complete a sale, then refresh the browser. All changes persist. |
| **Stock Limit** | `src/components/CartItem.jsx` | In **Sales**, attempt to increase quantity past available stock. The button disables and warns you. |
