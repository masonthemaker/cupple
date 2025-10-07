# 📄 `test‑autodoc.ts` – Documentation Overview  

A **self‑contained demo** of a tiny e‑commerce domain model written in TypeScript.  
It defines the core data contracts (`Product`, `Order`, `OrderItem`) and two service‑style classes:

| Class | Responsibility |
|------|-----------------|
| **`ProductCatalog`** | In‑memory CRUD + query operations for `Product` objects. |
| **`OrderManager`**   | Validation, creation and status management of `Order` objects, using a `ProductCatalog` instance. |

The file is primarily used by the **autodoc test suite** to verify that generated documentation correctly reflects interfaces, methods, and type relationships.

---

## 🎯 Purpose  

- **Showcase** how to model simple domain entities with TypeScript interfaces.  
- **Demonstrate** typical repository‑style logic (add / get / update / delete) without external persistence.  
- **Provide** a clean, importable API (`ProductCatalog`, `OrderManager`, plus the exported types) that can be consumed by other modules or unit‑tests.

---

## 🏗️ Key Structure & Components  

### 1. Interfaces (Data Contracts)

| Interface | Fields | Description |
|-----------|--------|-------------|
| **`Product`** | `id`, `name`, `description`, `price`, `category`, `stock`, `sku`, `isActive` | Represents a sellable item. |
| **`OrderItem`** | `productId`, `quantity`, `price`, `total` | A line‑item inside an `Order`. |
| **`Order`** | `id`, `customerId`, `products`, `total`, `status`, `orderDate`, `shippedDate?`, `deliveredDate?` | A purchase request. `status` is a union of specific strings. |

> **Note:** `Order['status']` is re‑used in `OrderManager.updateOrderStatus` to keep the status type in sync with the interface.

### 2. `ProductCatalog` – In‑Memory Product Repository  

| Method | Signature | What it does |
|--------|-----------|--------------|
| `addProduct(product: Product): void` | Adds a new product; throws if the `id` already exists. |
| `getProduct(id: string): Product \| undefined` | Retrieves a product by its `id`. |
| `updateProduct(id: string, updates: Partial<Product>): Product` | Merges `updates` into the existing product; throws if not found. |
| `deleteProduct(id: string): boolean` | Removes a product; returns `true` if it existed. |
| `listProducts(): Product[]` | Returns **all** products as an array. |
| `getActiveProducts(): Product[]` | Filters `listProducts()` for `isActive && stock > 0`. |
| `searchByCategory(category: string): Product[]` | Returns products whose `category` matches exactly. |

All data is stored in a private `Map<string, Product>` keyed by `product.id`.

### 3. `OrderManager` – Order Lifecycle Service  

| Method | Signature | What it does |
|--------|-----------|--------------|
| `createOrder(order: Order): Order` | Validates product existence & stock, computes `total`, sets `orderDate`, stores the order. |
| `getOrder(id: string): Order \| undefined` | Retrieves an order by its `id`. |
| `updateOrderStatus(id: string, status: Order['status']): Order` | Updates `status`; automatically stamps `shippedDate` or `deliveredDate` when appropriate. |
| `getCustomerOrders(customerId: string): Order[]` | Returns all orders belonging to a specific customer. |
| `getPendingOrders(): Order[]` | Returns orders whose status is `pending` or `processing`. |

The manager holds a private `Map<string, Order>` and a reference to a `ProductCatalog` instance for validation.

---

## 📚 Exported API  

```ts
export { ProductCatalog, OrderManager };
export type { Product, Order, OrderItem };
```

- **Classes**: `ProductCatalog`, `OrderManager` – ready for `new`‑instantiation.  
- **Types**: `Product`, `Order`, `OrderItem` – can be imported for type‑only usage (e.g., in tests or UI layers).

---

## 🚀 Practical Usage Examples  

### 1️⃣ Basic Setup  

```ts
import { ProductCatalog, OrderManager } from './test-autodoc';
import type { Product, Order, OrderItem } from './test-autodoc';

// Create a catalog and seed a product
const catalog = new ProductCatalog();

const sampleProduct: Product = {
  id: 'p-001',
  name: 'Wireless Mouse',
  description: 'Ergonomic USB‑C mouse',
  price: 29.99,
  category: 'electronics',
  stock: 100,
  sku: 'WM-001',
  isActive: true,
};

catalog.addProduct(sampleProduct);
```

### 2️⃣ Creating an Order  

```ts
const orderManager = new OrderManager(catalog);

const items: OrderItem[] = [
  {
    productId: 'p-001',
    quantity: 2,
    price: sampleProduct.price,
    total: sampleProduct.price * 2,
  },
];

const newOrder: Order = {
  id: 'o-123',
  customerId: 'c-456',
  products: items,
  total: 0,               // will be recalculated by createOrder
  status: 'pending',
  orderDate: new Date(), // placeholder – overwritten inside createOrder
};

const savedOrder = orderManager.createOrder(newOrder);
console.log('Order created:', savedOrder);
```

### 3️⃣ Updating Order Status  

```ts
orderManager.updateOrderStatus(savedOrder.id, 'shipped');
orderManager.updateOrderStatus(savedOrder.id, 'delivered');

const completed = orderManager.getOrder(savedOrder.id);
console.log('Delivered order:', completed);
```

### 4️⃣ Querying the Catalog  

```ts
const active = catalog.getActiveProducts();
console.log('Active products:', active);

const electronics = catalog.searchByCategory('electronics');
console.log('Electronics category:', electronics);
```

---

## ⚠️ Notable Gotchas & Edge Cases  

| Situation | Why it matters | Mitigation |
|-----------|----------------|------------|
| **Duplicate product IDs** | `addProduct` throws `Error('Product already exists')`. | Ensure IDs are globally unique (e.g., UUID). |
| **Partial updates** | `updateProduct` merges shallowly; nested objects (if ever added) won’t be deep‑merged. | Use a dedicated deep‑merge utility if needed. |
| **Stock validation** | `createOrder` checks `product.stock < item.quantity` **before** reducing stock. Stock is **not** automatically decremented after order creation. | Manually decrement `product.stock` after a successful order, or extend `OrderManager` to handle it. |
| **Status timestamps** | `shippedDate` and `deliveredDate` are only set when transitioning *to* those statuses, and only if they were previously undefined. Re‑setting the same status later will **not** update the timestamp. | Accept this as “first‑time” timestamp semantics, or modify the method to force refresh. |
| **Optional dates in `Order`** | `shippedDate` and `deliveredDate` are optional, but `Order` objects returned from `createOrder` will **not** contain them until the status changes. | Consumers should guard against `undefined` when reading these fields. |
| **Category search is case‑sensitive** | `searchByCategory('Electronics')` will not match `category: 'electronics'`. | Normalise strings (e.g., `.toLowerCase()`) before searching if you need case‑insensitivity. |
| **Map iteration order** | `listProducts`, `getCustomerOrders`, etc., rely on `Map` iteration order, which is insertion order. Removing and re‑adding items changes order. | Do not depend on ordering unless you explicitly sort the resulting arrays. |

---

## 📦 Quick Reference Cheat Sheet  

```ts
// Catalog
new ProductCatalog()
  .addProduct(product)
  .getProduct(id)
  .updateProduct(id, partial)
  .deleteProduct(id)
  .listProducts()
  .getActiveProducts()
  .searchByCategory(cat);

// Order manager
new OrderManager(catalog)
  .createOrder(order)               // validates & computes total
  .getOrder(id)
  .updateOrderStatus(id, 'shipped') // auto‑sets dates
  .getCustomerOrders(customerId)
  .getPendingOrders();
```

---

### 📚 Where to Go Next  

- **Persist data** – replace the internal `Map`s with a database layer (e.g., Prisma, TypeORM).  
- **Add stock decrement** – integrate stock updates inside `OrderManager.createOrder`.  
- **Extend status flow** – include cancellation, returns, or refunds.  
- **Introduce events** – emit domain events (`orderCreated`, `stockLow`) for decoupled side‑effects.

---  

*Generated on 2025‑10‑05 – ready for inclusion in your autodoc test suite or as a starter reference for simple e‑commerce back‑ends.*