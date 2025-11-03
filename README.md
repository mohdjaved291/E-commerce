🛒 E-Commerce Platform
A full-stack e-commerce web application built with Django REST Framework and vanilla JavaScript. This project features a complete product catalog system, user authentication, shopping cart functionality, and a responsive modern UI.
📋 Table of Contents

Features
Technologies Used
Project Structure
Installation
Configuration
API Endpoints
Usage
Screenshots
Future Enhancements
Contributing
License

✨ Features
User Management

✅ User registration with email verification
✅ Secure login/logout with token-based authentication
✅ User profile management with avatar support
✅ Password change functionality
✅ Multiple address management (shipping/billing)
✅ Account deactivation option
✅ Real-time email and username availability checking

Product Catalog

📦 Dynamic product listing with pagination
🔍 Real-time search functionality
🏷️ Category-based filtering
📊 Multiple sorting options (price, name, date)
🖼️ Product detail modal with image display
🔗 Related products suggestions
📱 Responsive product cards

Shopping Cart

🛒 Persistent cart using localStorage
➕ Add/remove products with quantity control
💰 Real-time cart total calculation
🎨 Animated cart sidebar
🔔 Toast notifications for user actions
🔄 Cart badge with item count

UI/UX

🎯 Modern, clean interface
📱 Fully responsive design (mobile, tablet, desktop)
⚡ Fast and smooth animations
♿ ARIA labels for accessibility
🎨 Consistent design system with CSS variables
🌐 Modal-based navigation

🛠️ Technologies Used
Backend

Django 5.2.5 - Python web framework
Django REST Framework - RESTful API toolkit
SQLite - Database (development)
Token Authentication - Secure API authentication

Frontend

HTML5 - Semantic markup
CSS3 - Modern styling with CSS Grid and Flexbox
Vanilla JavaScript (ES6+) - No framework dependencies
Fetch API - Asynchronous HTTP requests

Additional Tools

django-cors-headers - CORS support
django-filters - Advanced filtering
Git - Version control

📁 Project Structure
e-commerce/
│
├── e_commerce/                 # Django project settings
│   ├── settings.py            # Project configuration
│   ├── urls.py                # Root URL configuration
│   ├── wsgi.py                # WSGI application
│   └── asgi.py                # ASGI application
│
├── accounts/                   # User management app
│   ├── models.py              # User, UserProfile, Address models
│   ├── serializers.py         # DRF serializers for authentication
│   ├── views.py               # Authentication views
│   ├── urls.py                # Account-related endpoints
│   └── admin.py               # Admin configuration
│
├── products/                   # Product catalog app
│   ├── models.py              # Product and Category models
│   ├── serializers.py         # Product serializers
│   ├── views.py               # Product viewsets
│   ├── urls.py                # Product endpoints
│   └── admin.py               # Admin configuration
│
├── static/                     # Frontend assets
│   ├── css/
│   │   ├── style.css          # Main styles
│   │   ├── auth-styles.css    # Authentication UI styles
│   │   ├── cart-styles.css    # Shopping cart styles
│   │   └── product-detail-styles.css
│   └── js/
│       ├── script.js          # Main application logic
│       ├── auth.js            # Authentication handling
│       ├── cart.js            # Shopping cart functionality
│       └── product-detail.js  # Product detail modal
│
├── index.html                  # Main HTML template
├── requirements.txt            # Python dependencies
├── manage.py                   # Django management script
└── README.md                   # Project documentation
🚀 Installation
Prerequisites

Python 3.8 or higher
pip (Python package manager)
Git

Step 1: Clone the Repository
bashgit clone https://github.com/yourusername/ecommerce-platform.git
cd ecommerce-platform
Step 2: Create Virtual Environment
bash# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
Step 3: Install Dependencies
bashpip install -r requirements.txt
Step 4: Database Setup
bashpython manage.py makemigrations
python manage.py migrate
Step 5: Create Superuser
bashpython manage.py createsuperuser
Step 6: Run Development Server
bashpython manage.py runserver
The application will be available at http://127.0.0.1:8000/
Step 7: Access Admin Panel
Navigate to http://127.0.0.1:8000/admin/ and login with your superuser credentials to manage products and categories.
⚙️ Configuration
Environment Variables
Create a .env file in the project root:
envSECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (for production)
DATABASE_URL=your-database-url

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
CORS Settings
Update CORS_ALLOWED_ORIGINS in settings.py for your frontend domain:
pythonCORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    # Add your production domain
]
📡 API Endpoints
Authentication Endpoints
POST   /api/auth/register/           - User registration
POST   /api/auth/login/              - User login
POST   /api/auth/logout/             - User logout
GET    /api/auth/profile/            - Get user profile
PATCH  /api/auth/profile/            - Update user profile
POST   /api/auth/change-password/    - Change password
POST   /api/auth/check-email/        - Check email availability
POST   /api/auth/check-username/     - Check username availability
GET    /api/auth/user-info/          - Get current user info
POST   /api/auth/deactivate/         - Deactivate account
Address Endpoints
GET    /api/auth/addresses/          - List user addresses
POST   /api/auth/addresses/          - Create new address
GET    /api/auth/addresses/{id}/     - Get address details
PUT    /api/auth/addresses/{id}/     - Update address
DELETE /api/auth/addresses/{id}/     - Delete address
Product Endpoints
GET    /api/products/                - List all products
GET    /api/products/{id}/           - Get product details
GET    /api/products/featured/       - Get featured products
GET    /api/products/by_category/    - Filter by category
GET    /api/products/{id}/similar/   - Get similar products
GET    /api/products/search_suggestions/ - Search autocomplete
Category Endpoints
GET    /api/categories/              - List all categories
GET    /api/categories/{id}/         - Get category details
Query Parameters
Products List:

?search=keyword - Search products
?category=id - Filter by category
?ordering=field - Sort results (price, -price, name, -created_at)
?page=number - Pagination

Example:
GET /api/products/?search=laptop&category=1&ordering=-price
💻 Usage
1. Adding Products (Admin)

Access admin panel at /admin/
Navigate to Products → Add Product
Fill in product details (name, price, category, image URL, stock)
Save the product

2. User Registration

Click "Register" button in header
Fill in registration form
System validates email/username availability in real-time
Upon successful registration, user is automatically logged in

3. Shopping Workflow

Browse products on the homepage
Use search and filters to find desired products
Click "View Details" to see full product information
Click "Add to Cart" or "Quick Add" to add products
View cart by clicking cart icon in header
Adjust quantities or remove items as needed
Click "Proceed to Checkout" (to be implemented)

4. Profile Management

Click user avatar in header
Select "Profile" from dropdown
Update personal information, addresses, or password
Changes are saved immediately

📸 Screenshots
Homepage - Product Catalog
[ Product Grid with Search, Filter, and Sort Options ]
Product Detail Modal
[ Detailed Product View with Related Products ]
Shopping Cart
[ Sidebar Cart with Items and Checkout Button ]
User Profile
[ Tabbed Interface: Profile, Addresses, Security ]
Authentication Modals
[ Login and Registration Forms ]
🔮 Future Enhancements
Phase 1 - Core Features

 Order management system
 Payment gateway integration (Stripe/PayPal)
 Email notifications
 Order tracking
 Invoice generation

Phase 2 - Enhanced Features

 Product reviews and ratings
 Wishlist functionality
 Product recommendations (AI-based)
 Advanced search with filters
 Inventory management

Phase 3 - Advanced Features

 Multi-vendor support
 Coupon/discount system
 Analytics dashboard
 Export orders to CSV/PDF
 Live chat support
 Mobile app (React Native)

Phase 4 - Optimization

 Redis caching
 PostgreSQL migration
 Image optimization and CDN
 Progressive Web App (PWA)
 Performance monitoring
 Automated testing suite

🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

Coding Standards

Follow PEP 8 for Python code
Use ESLint configuration for JavaScript
Write descriptive commit messages
Add comments for complex logic
Update documentation as needed

📊 Project Status
Current Version: 1.0.0
Status: Active Development
Last Updated: November 2025
Version History

v1.0.0 (Nov 2025) - Initial release with core features

User authentication and profile management
Product catalog with search and filters
Shopping cart functionality
Responsive UI design
