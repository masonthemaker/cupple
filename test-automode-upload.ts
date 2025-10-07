/**
 * E-commerce Shopping Cart System
 * Complete rewrite to test autodoc update + upload workflow
 */

export type ProductCategory = 'electronics' | 'clothing' | 'food' | 'books' | 'toys';

export type CartItemStatus = 'active' | 'saved_for_later' | 'removed';

export interface Product {
	id: string;
	name: string;
	description: string;
	price: number; // in cents
	category: ProductCategory;
	stock: number;
	imageUrl?: string;
	sku: string;
}

export interface CartItem {
	productId: string;
	quantity: number;
	status: CartItemStatus;
	addedAt: Date;
	updatedAt: Date;
}

export interface ShoppingCart {
	id: string;
	userId: string;
	items: CartItem[];
	createdAt: Date;
	updatedAt: Date;
	couponCode?: string;
	discountAmount?: number;
}

export interface OrderSummary {
	subtotal: number;
	tax: number;
	shipping: number;
	discount: number;
	total: number;
}

/**
 * Creates a new empty shopping cart
 * @param userId - User identifier
 * @returns New shopping cart object
 */
export const createCart = (userId: string): ShoppingCart => {
	return {
		id: generateCartId(),
		userId,
		items: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
};

/**
 * Generates a unique cart ID
 * @returns Cart ID string
 */
export const generateCartId = (): string => {
	return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Adds a product to the shopping cart
 * @param cart - Shopping cart
 * @param productId - Product to add
 * @param quantity - Quantity to add
 * @returns Updated cart
 */
export const addToCart = (
	cart: ShoppingCart,
	productId: string,
	quantity: number,
): ShoppingCart => {
	const existingItem = cart.items.find(item => 
		item.productId === productId && item.status === 'active'
	);

	if (existingItem) {
		// Update existing item quantity
		return {
			...cart,
			items: cart.items.map(item =>
				item.productId === productId && item.status === 'active'
					? { ...item, quantity: item.quantity + quantity, updatedAt: new Date() }
					: item
			),
			updatedAt: new Date(),
		};
	}

	// Add new item
	const newItem: CartItem = {
		productId,
		quantity,
		status: 'active',
		addedAt: new Date(),
		updatedAt: new Date(),
	};

	return {
		...cart,
		items: [...cart.items, newItem],
		updatedAt: new Date(),
	};
};

/**
 * Removes a product from the cart
 * @param cart - Shopping cart
 * @param productId - Product to remove
 * @returns Updated cart
 */
export const removeFromCart = (
	cart: ShoppingCart,
	productId: string,
): ShoppingCart => {
	return {
		...cart,
		items: cart.items.map(item =>
			item.productId === productId
				? { ...item, status: 'removed' as CartItemStatus, updatedAt: new Date() }
				: item
		),
		updatedAt: new Date(),
	};
};

/**
 * Updates the quantity of a cart item
 * @param cart - Shopping cart
 * @param productId - Product to update
 * @param quantity - New quantity
 * @returns Updated cart
 */
export const updateQuantity = (
	cart: ShoppingCart,
	productId: string,
	quantity: number,
): ShoppingCart => {
	if (quantity <= 0) {
		return removeFromCart(cart, productId);
	}

	return {
		...cart,
		items: cart.items.map(item =>
			item.productId === productId
				? { ...item, quantity, updatedAt: new Date() }
				: item
		),
		updatedAt: new Date(),
	};
};

/**
 * Moves an item to "saved for later"
 * @param cart - Shopping cart
 * @param productId - Product to save
 * @returns Updated cart
 */
export const saveForLater = (
	cart: ShoppingCart,
	productId: string,
): ShoppingCart => {
	return {
		...cart,
		items: cart.items.map(item =>
			item.productId === productId
				? { ...item, status: 'saved_for_later' as CartItemStatus, updatedAt: new Date() }
				: item
		),
		updatedAt: new Date(),
	};
};

/**
 * Moves an item from "saved for later" back to active cart
 * @param cart - Shopping cart
 * @param productId - Product to move back
 * @returns Updated cart
 */
export const moveToCart = (
	cart: ShoppingCart,
	productId: string,
): ShoppingCart => {
	return {
		...cart,
		items: cart.items.map(item =>
			item.productId === productId
				? { ...item, status: 'active' as CartItemStatus, updatedAt: new Date() }
				: item
		),
		updatedAt: new Date(),
	};
};

/**
 * Gets all active items in the cart
 * @param cart - Shopping cart
 * @returns Array of active cart items
 */
export const getActiveItems = (cart: ShoppingCart): CartItem[] => {
	return cart.items.filter(item => item.status === 'active');
};

/**
 * Gets all saved for later items
 * @param cart - Shopping cart
 * @returns Array of saved items
 */
export const getSavedItems = (cart: ShoppingCart): CartItem[] => {
	return cart.items.filter(item => item.status === 'saved_for_later');
};

/**
 * Calculates the subtotal for active items
 * @param cart - Shopping cart
 * @param products - Product catalog
 * @returns Subtotal in cents
 */
export const calculateSubtotal = (
	cart: ShoppingCart,
	products: Product[],
): number => {
	const activeItems = getActiveItems(cart);
	
	return activeItems.reduce((total, item) => {
		const product = products.find(p => p.id === item.productId);
		if (!product) return total;
		return total + (product.price * item.quantity);
	}, 0);
};

/**
 * Calculates tax amount (8.5% rate)
 * @param subtotal - Subtotal amount in cents
 * @returns Tax amount in cents
 */
export const calculateTax = (subtotal: number): number => {
	const taxRate = 0.085;
	return Math.round(subtotal * taxRate);
};

/**
 * Calculates shipping cost based on subtotal
 * @param subtotal - Subtotal amount in cents
 * @returns Shipping cost in cents
 */
export const calculateShipping = (subtotal: number): number => {
	if (subtotal >= 5000) return 0; // Free shipping over $50
	if (subtotal >= 2500) return 500; // $5 shipping for $25-$50
	return 1000; // $10 shipping under $25
};

/**
 * Applies a coupon code
 * @param cart - Shopping cart
 * @param couponCode - Coupon code to apply
 * @param discountAmount - Discount amount in cents
 * @returns Updated cart with coupon applied
 */
export const applyCoupon = (
	cart: ShoppingCart,
	couponCode: string,
	discountAmount: number,
): ShoppingCart => {
	return {
		...cart,
		couponCode,
		discountAmount,
		updatedAt: new Date(),
	};
};

/**
 * Calculates complete order summary
 * @param cart - Shopping cart
 * @param products - Product catalog
 * @returns Order summary with all costs
 */
export const calculateOrderSummary = (
	cart: ShoppingCart,
	products: Product[],
): OrderSummary => {
	const subtotal = calculateSubtotal(cart, products);
	const tax = calculateTax(subtotal);
	const shipping = calculateShipping(subtotal);
	const discount = cart.discountAmount || 0;
	
	const total = subtotal + tax + shipping - discount;
	
	return {
		subtotal,
		tax,
		shipping,
		discount,
		total: Math.max(0, total), // Never negative
	};
};

/**
 * Validates if products are in stock
 * @param cart - Shopping cart
 * @param products - Product catalog
 * @returns True if all items are in stock
 */
export const validateStock = (
	cart: ShoppingCart,
	products: Product[],
): boolean => {
	const activeItems = getActiveItems(cart);
	
	return activeItems.every(item => {
		const product = products.find(p => p.id === item.productId);
		if (!product) return false;
		return product.stock >= item.quantity;
	});
};

/**
 * Gets total item count in active cart
 * @param cart - Shopping cart
 * @returns Total number of items
 */
export const getTotalItemCount = (cart: ShoppingCart): number => {
	const activeItems = getActiveItems(cart);
	return activeItems.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Clears all items from the cart
 * @param cart - Shopping cart
 * @returns Empty cart
 */
export const clearCart = (cart: ShoppingCart): ShoppingCart => {
	return {
		...cart,
		items: cart.items.map(item => ({ 
			...item, 
			status: 'removed' as CartItemStatus,
			updatedAt: new Date(),
		})),
		couponCode: undefined,
		discountAmount: undefined,
		updatedAt: new Date(),
	};
};