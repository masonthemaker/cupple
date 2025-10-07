## test‑automode‑upload.ts – Overview  
Utility library for a simple e‑commerce shopping‑cart system.  
All helpers are **pure** (they never mutate their arguments) and return a brand‑new `ShoppingCart` or related value.  
Timestamps are generated with `new Date()` at the moment a function is called.

---  

## Core Types & Interfaces  

### `ProductCategory`
```ts
export type ProductCategory =
  | 'electronics'
  | 'clothing'
  | 'food'
  | 'books'
  | 'toys';
```

### `CartItemStatus`
```ts
export type CartItemStatus = 'active' | 'saved_for_later' | 'removed';
```

### `Product`
```ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;          // in cents
  category: ProductCategory;
  stock: number;
  imageUrl?: string;
  sku: string;
}
```

### `CartItem`
```ts
export interface CartItem {
  productId: string;
  quantity: number;
  status: CartItemStatus;
  addedAt: Date;
  updatedAt: Date;
}
```

### `ShoppingCart`
```ts
export interface ShoppingCart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
  couponCode?: string;
  discountAmount?: number;   // in cents
}
```

### `OrderSummary`
```ts
export interface OrderSummary {
  subtotal: number;   // cents
  tax: number;        // cents
  shipping: number;   // cents
  discount: number;   // cents
  total: number;      // cents (never negative)
}
```

---  

## Primary Functions  

### `createCart`
```ts
export const createCart = (userId: string): ShoppingCart;
```
*Creates a brand‑new empty cart* for the given `userId`.

- Generates a unique `id` via `generateCartId`.  
- Sets `createdAt` and `updatedAt` to the current time (`new Date()`).  
- Starts with an empty `items` array and **no** coupon data.

---

### `generateCartId`
```ts
export const generateCartId = (): string;
```
Returns a unique identifier of the form  

```
cart_<timestamp>_<randomString>
```  

where `<timestamp>` is `Date.now()` and `<randomString>` is a **7‑character** base‑36 substring (`Math.random().toString(36).substring(2, 9)`).

---

### `addToCart`
```ts
export const addToCart = (
  cart: ShoppingCart,
  productId: string,
  quantity: number,
): ShoppingCart;
```
Adds `quantity` of `productId` to `cart`.

- If an **active** item for the same product already exists, its `quantity` is **increased** by the supplied amount and its `updatedAt` refreshed.  
- Otherwise a new `CartItem` with status `'active'` is appended (with fresh `addedAt`/`updatedAt`).  
- Returns a **new** `ShoppingCart` with an updated `updatedAt`.

---

### `removeFromCart`
```ts
export const removeFromCart = (
  cart: ShoppingCart,
  productId: string,
): ShoppingCart;
```
Marks **every** matching item’s `status` as `'removed'` and updates each item’s `updatedAt`.  
The cart’s own `updatedAt` is also refreshed.

---

### `updateQuantity`
```ts
export const updateQuantity = (
  cart: ShoppingCart,
  productId: string,
  quantity: number,
): ShoppingCart;
```
Sets a new `quantity` for the specified product.

- If `quantity <= 0`, the call is delegated to `removeFromCart`.  
- Otherwise the matching item (regardless of its current `status`) receives the new `quantity` and a refreshed `updatedAt`.  
- The cart’s `updatedAt` is refreshed as well.

---

### `saveForLater`
```ts
export const saveForLater = (
  cart: ShoppingCart,
  productId: string,
): ShoppingCart;
```
Changes the `status` of **all** matching items to `'saved_for_later'` and refreshes their `updatedAt`.  
Cart `updatedAt` is also refreshed.

---

### `moveToCart`
```ts
export const moveToCart = (
  cart: ShoppingCart,
  productId: string,
): ShoppingCart;
```
Moves **all** matching items from `'saved_for_later'` back to `'active'`, updating timestamps on each item and on the cart.

---

### `getActiveItems`
```ts
export const getActiveItems = (cart: ShoppingCart): CartItem[];
```
Returns an array of items whose `status === 'active'`.

---

### `getSavedItems`
```ts
export const getSavedItems = (cart: ShoppingCart): CartItem[];
```
Returns an array of items whose `status === 'saved_for_later'`.

---

### `calculateSubtotal`
```ts
export const calculateSubtotal = (
  cart: ShoppingCart,
  products: Product[],
): number;
```
Computes the subtotal (in cents) of **active** items:

1. Looks up each active `productId` in the supplied `products` catalog.  
2. Multiplies the product’s `price` by the item’s `quantity`.  
3. Sums the results.  

If a product cannot be found, it contributes `0` to the total.

---

### `calculateTax`
```ts
export const calculateTax = (subtotal: number): number;
```
Applies a fixed **8.5 %** tax rate to `subtotal` and rounds to the nearest cent.

---

### `calculateShipping`
```ts
export const calculateShipping = (subtotal: number): number;
```
Shipping cost rules (all values in cents):

- `subtotal >= 5000` → **free** shipping (`0`).  
- `2500 <= subtotal < 5000` → `$5` (`500`).  
- `subtotal < 2500` → `$10` (`1000`).

---

### `applyCoupon`
```ts
export const applyCoupon = (
  cart: ShoppingCart,
  couponCode: string,
  discountAmount: number,
): ShoppingCart;
```
Attaches a coupon to the cart:

- Sets `couponCode` and `discountAmount` (both stored in cents).  
- Refreshes `updatedAt`.  

No validation of the coupon is performed; the caller supplies the discount amount.

---

### `calculateOrderSummary`
```ts
export const calculateOrderSummary = (
  cart: ShoppingCart,
  products: Product[],
): OrderSummary;
```
Produces a full cost breakdown:

1. `subtotal` – from `calculateSubtotal`.  
2. `tax` – from `calculateTax`.  
3. `shipping` – from `calculateShipping`.  
4. `discount` – `cart.discountAmount` or `0`.  
5. `total` – `subtotal + tax + shipping - discount`, never below `0`.  

All values are returned in **cents**.

---

### `validateStock`
```ts
export const validateStock = (
  cart: ShoppingCart,
  products: Product[],
): boolean;
```
Returns `true` only if **every active item** can be fulfilled:

- Finds the matching product in the catalog.  
- Checks `product.stock >= item.quantity`.  

If any product is missing or insufficient, the function returns `false`.

---

### `getTotalItemCount`
```ts
export const getTotalItemCount = (cart: ShoppingCart): number;
```
Counts the total quantity of **active** items (e.g., 3 × “Shirt” + 2 × “Book” → `5`).

---

### `clearCart`
```ts
export const clearCart = (cart: ShoppingCart): ShoppingCart;
```
Empties the cart by:

- Setting **every** item’s `status` to `'removed'` and refreshing each `updatedAt`.  
- Removing `couponCode` and `discountAmount`.  
- Updating the cart’s `updatedAt`.  

The returned cart still contains the original `items` array (now all removed) to preserve history.

---  

## Quick Usage Example
```ts
import {
  createCart,
  addToCart,
  applyCoupon,
  calculateOrderSummary,
  Product,
} from './test-automode-upload';

// Sample product catalog
const catalog: Product[] = [
  {
    id: 'p1',
    name: 'Headphones',
    description: '',
    price: 1999,
    category: 'electronics',
    stock: 12,
    sku: 'HD-001',
  },
  {
    id: 'p2',
    name: 'T‑Shirt',
    description: '',
    price: 1500,
    category: 'clothing',
    stock: 30,
    sku: 'TS-101',
  },
];

// 1️⃣ Create an empty cart for a user
let cart = createCart('user_123');

// 2️⃣ Add items
cart = addToCart(cart, 'p1', 2); // 2 × Headphones
cart = addToCart(cart, 'p2', 1); // 1 × T‑Shirt

// 3️⃣ Apply a $5 discount coupon
cart = applyCoupon(cart, 'SPRING5', 500);

// 4️⃣ Get the full order summary
const summary = calculateOrderSummary(cart, catalog);
console.log('Order total (cents):', summary.total);
```

All helpers (`removeFromCart`, `saveForLater`, `validateStock`, `clearCart`, etc.) follow the same pure‑function pattern shown above.