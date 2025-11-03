class ShoppingCart {
    constructor() {
        this.cart = this.loadCart();
        this.init();
    }

    init() {
        // Don't render demo products - your script.js handles product loading
        this.bindEvents();
        this.updateCartUI();
    }

    // Load cart from localStorage
    loadCart() {
        const saved = localStorage.getItem('shopping-cart');
        return saved ? JSON.parse(saved) : [];
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('shopping-cart', JSON.stringify(this.cart));
    }

    // Demo products - replace with your API call
    getProducts() {
        return [
            { id: 1, name: 'Wireless Headphones', price: 99.99, image: '🎧' },
            { id: 2, name: 'Smart Watch', price: 299.99, image: '⌚' },
            { id: 3, name: 'Laptop Stand', price: 49.99, image: '💻' },
            { id: 4, name: 'Coffee Mug', price: 19.99, image: '☕' },
            { id: 5, name: 'Desk Lamp', price: 79.99, image: '💡' },
            { id: 6, name: 'Phone Case', price: 24.99, image: '📱' }
        ];
    }

    // Render products grid
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const products = this.getProducts();

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">${product.image}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <button class="add-to-cart-btn" onclick="cart.addToCart(${product.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Add item to cart
    addToCart(productId) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);

        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showToast(`${product.name} added to cart!`);
        this.animateAddButton(productId);
    }

    // Remove item from cart
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.renderCartItems();
    }

    // Update item quantity
    updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            this.saveCart();
            this.updateCartUI();
            this.renderCartItems();
        }
    }

    // Get cart total
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get cart item count
    getCartItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    // Update cart UI elements

    updateCartUI() {
        const badge = document.getElementById('cartBadge');
        const total = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        const itemCount = this.getCartItemCount();
        const cartTotal = this.getCartTotal();

        badge.textContent = itemCount;
        if (itemCount > 0) {
            badge.style.display = 'flex';
            badge.style.visibility = 'visible';
        } else {
            badge.style.display = 'none';
            badge.style.visibility = 'hidden';
        }

        total.textContent = `$${cartTotal.toFixed(2)}`;
        checkoutBtn.disabled = itemCount === 0;

        this.renderCartItems();
    }

    // Render cart items
    renderCartItems() {
        const container = document.getElementById('cartItems');

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.image && item.image !== '📦' && item.image.startsWith('http') ?
                `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">` :
                item.image || '📦'
            }
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toFixed(2)}</div>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="number" class="qty-input" value="${item.quantity}" 
                               onchange="cart.updateQuantity(${item.id}, parseInt(this.value))" min="1">
                        <button class="qty-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="cart.removeFromCart(${item.id})">Remove</button>
            </div>
        `).join('');
    }

    // Show cart sidebar
    showCart() {
        document.getElementById('cartSidebar').classList.add('open');
        document.getElementById('cartOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Hide cart sidebar
    hideCart() {
        document.getElementById('cartSidebar').classList.remove('open');
        document.getElementById('cartOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    // Show toast notification
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Animate add to cart button (updated for Django integration)
    animateAddButton(productId) {
        const buttons = document.querySelectorAll('.add-to-cart-btn');
        buttons.forEach(btn => {
            // Check if this button is for the product we just added
            const onclickStr = btn.getAttribute('onclick');
            if (onclickStr && onclickStr.includes(`addProductToCart(${productId},`)) {
                btn.classList.add('added');
                const originalText = btn.textContent;
                btn.textContent = 'Added!';
                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.textContent = originalText;
                }, 1000);
            }
        });
    }

    // Bind event listeners
    bindEvents() {
        document.getElementById('cartIcon').addEventListener('click', () => this.showCart());
        document.getElementById('closeCart').addEventListener('click', () => this.hideCart());
        document.getElementById('cartOverlay').addEventListener('click', () => this.hideCart());

        document.getElementById('checkoutBtn').addEventListener('click', () => {
            if (this.cart.length > 0) {
                alert('Proceeding to checkout...\n\nCart contents:\n' +
                    this.cart.map(item => `${item.name} x${item.quantity}`).join('\n'));
                // Here you would integrate with your checkout process
            }
        });

        // Close cart with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideCart();
            }
        });
    }

    // Clear entire cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.showToast('Cart cleared!');
    }

    // Get cart data for API integration
    getCartData() {
        return {
            items: this.cart,
            total: this.getCartTotal(),
            itemCount: this.getCartItemCount()
        };
    }

    // Load cart from API (for when you add user accounts)
    async loadCartFromAPI(userId) {
        try {
            const response = await fetch(`http://localhost:8000/api/cart/${userId}/`);
            if (response.ok) {
                const data = await response.json();
                this.cart = data.items || [];
                this.saveCart();
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Error loading cart from API:', error);
        }
    }

    // Sync cart to API (for when you add user accounts)
    async syncCartToAPI(userId) {
        try {
            await fetch(`http://localhost:8000/api/cart/${userId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.getCartData())
            });
        } catch (error) {
            console.error('Error syncing cart to API:', error);
        }
    }

    // Load products from API (replace demo products)
    async loadProductsFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/products/');
            if (response.ok) {
                const products = await response.json();
                this.renderProductsFromAPI(products);
            }
        } catch (error) {
            console.error('Error loading products from API:', error);
            // Fallback to demo products
            this.renderProducts();
        }
    }

    // Render products from API
    renderProductsFromAPI(products) {
        const grid = document.getElementById('productsGrid');

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    ${product.image_url ?
                `<img src="${product.image_url}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` :
                '📦'
            }
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <button class="add-to-cart-btn" onclick="cart.addToCartFromAPI(${product.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Add to cart from API product (for Django integration)
    addToCartFromAPI(product) {
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                // Handle both image and image_url properties
                image: product.image || product.image_url || '📦',
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showToast(`${product.name} added to cart!`);
        this.animateAddButton(product.id);
    }

    // Enhanced renderCartItems function with better image handling
    renderCartItems() {
        const container = document.getElementById('cartItems');

        if (this.cart.length === 0) {
            container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started!</p>
            </div>
        `;
            return;
        }

        container.innerHTML = this.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                ${this.renderCartItemImage(item)}
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price.toFixed(2)}</div>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" class="qty-input" value="${item.quantity}" 
                           onchange="cart.updateQuantity(${item.id}, parseInt(this.value))" min="1">
                    <button class="qty-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="cart.removeFromCart(${item.id})">Remove</button>
        </div>
    `).join('');
    }

    // New helper function to render cart item images properly
    renderCartItemImage(item) {
        // Check if item has a valid image URL
        if (item.image &&
            item.image !== '📦' &&
            (item.image.startsWith('http') || item.image.startsWith('/'))) {
            return `<img src="${item.image}" alt="${item.name}" 
                     style="width:100%;height:100%;object-fit:cover;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:1.5rem;">📦</div>`;
        } else {
            // Show placeholder if no valid image
            return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📦</div>`;
        }
    }
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}
