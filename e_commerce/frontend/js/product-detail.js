// product-detail.js - Product Detail Page Functionality

class ProductDetail {
    constructor() {
        this.currentProduct = null;
        this.currentQuantity = 1;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Close product detail modal
        document.getElementById('closeProductDetail').addEventListener('click', () => {
            this.closeProductDetail();
        });

        // Close on overlay click
        document.getElementById('productDetailOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('productDetailOverlay')) {
                this.closeProductDetail();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductDetail();
            }
        });

        // Quantity controls
        document.getElementById('decreaseQty').addEventListener('click', () => {
            this.updateQuantity(-1);
        });

        document.getElementById('increaseQty').addEventListener('click', () => {
            this.updateQuantity(1);
        });

        document.getElementById('productQuantity').addEventListener('input', (e) => {
            const qty = parseInt(e.target.value) || 1;
            this.setQuantity(qty);
        });

        // Add to cart from detail page
        document.getElementById('addToCartDetailBtn').addEventListener('click', () => {
            this.addToCartFromDetail();
        });
    }

    // Load and display product details
    async loadProductDetail(productId) {
        try {
            this.showDetailLoading();

            const response = await fetch(`${API_URL}/products/${productId}/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentProduct = data.product;

            this.displayProductDetail(data.product);
            this.displayRelatedProducts(data.related_products);
            this.updateBreadcrumb(data.breadcrumb);
            this.openProductDetail();

        } catch (error) {
            console.error('Error loading product detail:', error);
            this.showDetailError('Failed to load product details. Please try again.');
        }
    }

    // Display product details in modal
    displayProductDetail(product) {
        // Update product image
        const image = document.getElementById('productDetailImage');
        const placeholder = document.getElementById('productDetailImagePlaceholder');

        if (product.image_url) {
            image.src = product.image_url;
            image.alt = product.name;
            image.style.display = 'block';
            placeholder.style.display = 'none';

            // Handle image load error
            image.onerror = () => {
                image.style.display = 'none';
                placeholder.style.display = 'flex';
            };
        } else {
            image.style.display = 'none';
            placeholder.style.display = 'flex';
        }

        // Update product information
        document.getElementById('productDetailCategory').textContent = product.category_name;
        document.getElementById('productDetailName').textContent = product.name;
        document.getElementById('productDetailPrice').textContent = `$${parseFloat(product.price).toFixed(2)}`;
        document.getElementById('productDetailDescription').textContent = product.description;

        // Update stock status
        const stockElement = document.getElementById('productDetailStockStatus');
        stockElement.textContent = product.stock_status;
        stockElement.className = `stock-status ${product.is_in_stock ? 'in-stock' : 'out-of-stock'}`;

        // Update quantity controls and add to cart button
        const quantityInput = document.getElementById('productQuantity');
        const addToCartBtn = document.getElementById('addToCartDetailBtn');

        if (product.is_in_stock) {
            quantityInput.max = product.stock_quantity;
            quantityInput.disabled = false;
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = 'Add to Cart';

            // Reset quantity to 1
            this.setQuantity(1);
        } else {
            quantityInput.disabled = true;
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Out of Stock';
        }
    }

    // Display related products
    displayRelatedProducts(relatedProducts) {
        const relatedSection = document.getElementById('relatedProductsSection');
        const relatedGrid = document.getElementById('relatedProductsGrid');

        if (relatedProducts && relatedProducts.length > 0) {
            relatedSection.style.display = 'block';

            const relatedHTML = relatedProducts.map(product => `
                <div class="related-product-card" onclick="productDetail.loadProductDetail(${product.id})">
                    <div class="related-product-image">
                        ${product.image_url ?
                    `<img src="${product.image_url}" alt="${escapeHtml(product.name)}" onerror="this.style.display='none'">` :
                    '<div class="image-placeholder">📦</div>'
                }
                    </div>
                    <div class="related-product-info">
                        <h4>${escapeHtml(product.name)}</h4>
                        <div class="related-product-price">$${parseFloat(product.price).toFixed(2)}</div>
                        <div class="related-product-stock ${product.is_in_stock ? 'in-stock' : 'out-of-stock'}">
                            ${product.is_in_stock ? 'In Stock' : 'Out of Stock'}
                        </div>
                    </div>
                </div>
            `).join('');

            relatedGrid.innerHTML = relatedHTML;
        } else {
            relatedSection.style.display = 'none';
        }
    }

    // Update breadcrumb navigation
    updateBreadcrumb(breadcrumb) {
        const breadcrumbElement = document.getElementById('breadcrumb');
        const breadcrumbText = document.getElementById('breadcrumbText');

        if (breadcrumb) {
            breadcrumbText.innerHTML = `
                <a href="#" onclick="showCategoryProducts(${breadcrumb.category_id})" class="breadcrumb-link">
                    ${escapeHtml(breadcrumb.category)}
                </a>
                <span class="breadcrumb-separator">›</span>
                <span>${escapeHtml(breadcrumb.product)}</span>
            `;
            breadcrumbElement.style.display = 'block';
        }
    }

    // Quantity management
    updateQuantity(change) {
        const newQuantity = this.currentQuantity + change;
        this.setQuantity(newQuantity);
    }

    setQuantity(quantity) {
        const maxQty = this.currentProduct ? this.currentProduct.stock_quantity : 99;
        const minQty = 1;

        this.currentQuantity = Math.max(minQty, Math.min(quantity, maxQty));
        document.getElementById('productQuantity').value = this.currentQuantity;

        // Update button states
        document.getElementById('decreaseQty').disabled = this.currentQuantity <= minQty;
        document.getElementById('increaseQty').disabled = this.currentQuantity >= maxQty;
    }

    // Add to cart from detail page
    addToCartFromDetail() {
        if (!this.currentProduct || !this.currentProduct.is_in_stock) return;

        if (window.cart) {
            // Create properly formatted product object for cart
            const cartProduct = {
                id: this.currentProduct.id,
                name: this.currentProduct.name,
                price: parseFloat(this.currentProduct.price),
                image: this.currentProduct.image_url || '📦' // Fix: map image_url to image
            };

            // Add multiple quantities to cart
            for (let i = 0; i < this.currentQuantity; i++) {
                window.cart.addToCartFromAPI(cartProduct);
            }

            // Show success message and close modal after a delay
            window.cart.showToast(`${this.currentQuantity}x ${this.currentProduct.name} added to cart!`);

            // Optional: Close modal after adding to cart
            setTimeout(() => {
                this.closeProductDetail();
            }, 1500);
        }
    }

    // Modal management
    openProductDetail() {
        document.getElementById('productDetailOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeProductDetail() {
        document.getElementById('productDetailOverlay').classList.remove('active');
        document.body.style.overflow = '';
        this.currentProduct = null;
        this.hideBreadcrumb();
    }

    hideBreadcrumb() {
        document.getElementById('breadcrumb').style.display = 'none';
    }

    // Loading and error states
    showDetailLoading() {
        document.getElementById('productDetailName').textContent = 'Loading...';
        document.getElementById('productDetailDescription').textContent = 'Loading product details...';
    }

    showDetailError(message) {
        document.getElementById('productDetailName').textContent = 'Error';
        document.getElementById('productDetailDescription').textContent = message;
    }
}

// Navigation functions for integration with existing code
function showHomePage() {
    productDetail.closeProductDetail();
    document.getElementById('sectionTitle').textContent = 'Products';
    loadProducts(); // Reload all products
}

function showCategoryProducts(categoryId) {
    productDetail.closeProductDetail();

    // Find category name
    const categorySelect = document.getElementById('categoryFilter');
    const categoryOption = categorySelect.querySelector(`option[value="${categoryId}"]`);
    const categoryName = categoryOption ? categoryOption.textContent : 'Category';

    document.getElementById('sectionTitle').textContent = `${categoryName} Products`;

    // Load products by category
    loadProducts({ category: categoryId });
}

// Update the existing viewProduct function in script.js
function viewProduct(productId) {
    productDetail.loadProductDetail(productId);
}

// Initialize product detail functionality
document.addEventListener('DOMContentLoaded', () => {
    window.productDetail = new ProductDetail();
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductDetail;
}
