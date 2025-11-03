// SCRIPT.JS - E-COMMERCE PRODUCT CATALOG CONTROLLER

/** 
 * CORE FUNCTIONALITIES:
 * • API Management - Centralized HTTP client with error handling
 * • Product Display - Load, search, filter, and sort product catalog
 * • Category Management - Dynamic category filtering and navigation
 * • Cart Integration - Quick add to cart with cart.js module
 * • Product Details - Integration with product-detail.js modal
 * • Search & Filters - Real-time search, category filter, sorting
 * • UI States - Loading, error handling, and user feedback
 * 
 * DEPENDENCIES: cart.js, product-detail.js, Backend API
 * EXPORTS: viewProduct, addProductToCart, loadProducts, clearFilters
 * ================================================================
 */

const API_URL = 'http://127.0.0.1:8000/api';

// Cache DOM elements at page load to avoid repeated querySelector calls
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortBy = document.getElementById('sortBy');
const searchBtn = document.getElementById('searchBtn');
const productsContainer = document.getElementById('productsContainer');

// ===== API CLIENT CLASS =====
// Centralizes all HTTP requests to avoid code duplication and provide consistent error handling
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    // Generic method to handle all API requests with consistent error handling
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options // Spread operator allows custom headers/methods to be passed in
            });

            // Check if response is successful (status 200-299)
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error; // Re-throw to let calling function handle it
        }
    }
}

// Create single instance of API client to be used throughout the application
const api = new ApiClient(API_URL);

// ===== UTILITY FUNCTIONS =====
// Builds URL query string from parameters object, filtering out empty values
function buildQueryString(params) {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.ordering) queryParams.append('ordering', params.ordering);
    return queryParams.toString() ? `?${queryParams}` : '';
}

// Prevents XSS attacks by escaping HTML characters in user input
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text; // Browser automatically escapes HTML
    return div.innerHTML;
}

// UI state management functions for loading and error states
function showLoading() {
    productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
}

function showError(message) {
    productsContainer.innerHTML = `<div class="error">${message}</div>`;
}

function showErrorWithRetry(message, retryFunction) {
    productsContainer.innerHTML = `
        <div class="error">
            <p>${message}</p>
            <button onclick="${retryFunction}" class="retry-btn">Retry</button>
        </div>
    `;
}

// ===== APPLICATION INITIALIZATION =====
// Wait for DOM to be fully loaded before initializing JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();  // Populate category dropdown
    loadProducts();    // Load initial product list
    setupEventListeners(); // Bind click/input events
});

// ===== EVENT HANDLING =====
// Bind user interaction events to their respective handler functions
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    // Allow Enter key in search input to trigger search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    categoryFilter.addEventListener('change', handleFilter);
    sortBy.addEventListener('change', handleSort);
}

// ===== PRODUCT DATA MANAGEMENT =====
// Main function to fetch and display products based on search/filter parameters
async function loadProducts(params = {}) {
    try {
        showLoading(); // Provide immediate visual feedback
        const queryString = buildQueryString(params);
        const url = `/products/${queryString}`;
        const products = await api.request(url);

        // Handle both paginated (results array) and non-paginated responses
        displayProducts(products.results || products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products. Please try again.');
    }
}

// ===== DOM RENDERING =====
// Converts product data array into HTML and injects into the DOM
function displayProducts(products) {
    if (products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">No products found matching your criteria.</div>';
        return;
    }

    // Use map() to transform each product object into HTML string, then join into single string
    const productsHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image-container" onclick="viewProduct(${product.id})">
                ${product.image_url ?
            `<img src="${product.image_url}" alt="${escapeHtml(product.name)}" class="product-image" onerror="this.style.display='none'">` :
            '<div class="product-image">No Image Available</div>'
        }
            </div>
            
            <div class="product-info">
                <h3 onclick="viewProduct(${product.id})">${escapeHtml(product.name)}</h3>
                <div class="price">$${parseFloat(product.price).toFixed(2)}</div>
                <div class="category">${escapeHtml(product.category_name || '')}</div>
                <div class="stock ${product.is_in_stock ? 'in-stock' : 'out-of-stock'}">
                    ${product.is_in_stock ? 'In Stock' : 'Out of Stock'}
                </div>
            </div>
            
            <div class="product-actions">
                ${product.is_in_stock ?
            // Event.stopPropagation() prevents card click when button is clicked
            `<button class="add-to-cart-btn" onclick="addProductToCart(${product.id}, '${escapeHtml(product.name)}', ${product.price}, '${product.image_url || ''}'); event.stopPropagation();">
                        Quick Add
                    </button>` :
            `<button class="add-to-cart-btn" disabled>
                        Out of Stock
                    </button>`
        }
                
                <button class="view-details-btn" onclick="viewProduct(${product.id}); event.stopPropagation();">
                    View Details
                </button>
            </div>
        </div>
    `).join('');

    // Replace entire container content with new HTML
    productsContainer.innerHTML = productsHTML;
}

// ===== CATEGORY MANAGEMENT =====
// Fetches categories from API and populates the filter dropdown
async function loadCategories() {
    try {
        const data = await api.request('/categories/');
        const categories = data.results || data;

        if (!Array.isArray(categories)) {
            console.error('Categories is not an array:', categories);
            return;
        }

        // Remove all options except the first one ("All Categories")
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }

        // Create and append new option elements
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ===== SEARCH AND FILTER HANDLERS =====
// Collects current filter values and triggers product reload
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    const category = categoryFilter.value;
    const ordering = sortBy.value;

    // Pass filters as object to loadProducts function
    loadProducts({
        search: searchTerm,
        category: category,
        ordering: ordering
    });

    updateSectionTitle(searchTerm, category);
}

// Filter and sort handlers reuse search logic since they need the same data
function handleFilter() {
    handleSearch();
}

function handleSort() {
    handleSearch();
}

// ===== UI FEEDBACK =====
// Updates page title based on current search/filter state
function updateSectionTitle(searchTerm, categoryId) {
    const sectionTitle = document.getElementById('sectionTitle');

    if (searchTerm) {
        sectionTitle.textContent = `Search Results for "${searchTerm}"`;
    } else if (categoryId) {
        // Find the selected option text instead of using the ID
        const categoryOption = categoryFilter.querySelector(`option[value="${categoryId}"]`);
        const categoryName = categoryOption ? categoryOption.textContent : 'Category';
        sectionTitle.textContent = `${categoryName} Products`;
    } else {
        sectionTitle.textContent = 'Products';
    }
}

// ===== INTEGRATION WITH OTHER MODULES =====
// Interfaces with product-detail.js to open product modal
function viewProduct(productId) {
    if (window.productDetail) {
        window.productDetail.loadProductDetail(productId);
    } else {
        // Graceful fallback if product detail module isn't loaded yet
        console.log(`Loading product detail for ID: ${productId}`);
        setTimeout(() => {
            if (window.productDetail) {
                window.productDetail.loadProductDetail(productId);
            }
        }, 100);
    }
}

// Interfaces with cart.js to add products to shopping cart
function addProductToCart(productId, productName, productPrice, productImage) {
    if (window.cart) {
        // Create product object in format expected by cart module
        const product = {
            id: productId,
            name: productName,
            price: parseFloat(productPrice), // Ensure numeric value
            image: productImage && productImage !== 'undefined' ? productImage : '📦'
        };
        window.cart.addToCartFromAPI(product);
    } else {
        console.error('Cart not initialized yet');
        // Retry pattern for race condition where cart module loads after this call
        setTimeout(() => {
            if (window.cart) {
                const product = {
                    id: productId,
                    name: productName,
                    price: parseFloat(productPrice),
                    image: productImage && productImage !== 'undefined' ? productImage : '📦'
                };
                window.cart.addToCartFromAPI(product);
            } else {
                alert('Cart is not ready yet. Please try again.');
            }
        }, 100);
    }
}

// ===== SPECIALIZED PRODUCT LOADING =====
// Loads and displays featured products (if endpoint exists)
async function loadFeaturedProducts() {
    try {
        const products = await api.request('/products/featured/');
        displayProducts(products);
        document.getElementById('sectionTitle').textContent = 'Featured Products';
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

// Loads products filtered by specific category ID
async function loadCategoryProducts(categoryId, categoryName) {
    try {
        showLoading();
        const data = await api.request(`/products/?category=${categoryId}`);
        const products = data.results || data;
        displayProducts(products);
        document.getElementById('sectionTitle').textContent = `${categoryName} Products`;
        // Sync dropdown with current filter
        categoryFilter.value = categoryId;
    } catch (error) {
        console.error('Error loading category products:', error);
        showError('Failed to load category products.');
    }
}

// ===== NAVIGATION HELPERS =====
// Resets all filters and returns to default product view
function clearFilters() {
    searchInput.value = '';
    categoryFilter.value = '';
    sortBy.value = '-created_at'; // Default to newest first
    loadProducts();
    document.getElementById('sectionTitle').textContent = 'Products';
}

// Returns to main product listing from detail view (for breadcrumb navigation)
function showHomePage() {
    // Close product detail modal if open
    if (window.productDetail && window.productDetail.closeProductDetail) {
        window.productDetail.closeProductDetail();
    }
    document.getElementById('sectionTitle').textContent = 'Products';
    loadProducts(); // Reload full product list
}

// ===== GLOBAL EXPORTS =====
// Make functions available to other scripts and HTML onclick handlers
window.viewProduct = viewProduct;
window.addProductToCart = addProductToCart;
window.loadProducts = loadProducts;
window.loadFeaturedProducts = loadFeaturedProducts;
window.loadCategoryProducts = loadCategoryProducts;
window.clearFilters = clearFilters;
window.showHomePage = showHomePage;