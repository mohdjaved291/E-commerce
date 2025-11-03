// auth.js - Authentication System

class AuthenticationSystem {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:8000/api/auth';
        this.currentUser = null;
        this.authToken = null;
        this.init();
        this.getCsrfToken();
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.loadStoredAuth();
    }

    async getCsrfToken() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
                method: 'GET',
            });
            const csrfToken = response.headers.get('X-CSRFToken');
            this.csrfToken = csrfToken;
        } catch (error) {
            console.log('Could not get CSRF token:', error);
        }
    }

    // ===== EVENT BINDINGS =====
    bindEvents() {
        // Auth button events
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Modal close events
        document.getElementById('closeLogin').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('closeRegister').addEventListener('click', () => this.hideRegisterModal());
        document.getElementById('closeProfile').addEventListener('click', () => this.hideProfileModal());

        // Modal switch events
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideLoginModal();
            this.showRegisterModal();
        });
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideRegisterModal();
            this.showLoginModal();
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileUpdate(e));
        document.getElementById('securityForm').addEventListener('submit', (e) => this.handlePasswordChange(e));

        // Profile modal events
        document.getElementById('profileLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfileModal();
        });

        // Profile tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Real-time validation
        document.getElementById('registerEmail').addEventListener('blur', () => this.checkEmailAvailability());
        document.getElementById('registerUsername').addEventListener('blur', () => this.checkUsernameAvailability());

        // Password confirmation validation
        document.getElementById('registerPasswordConfirm').addEventListener('input', () => this.validatePasswordMatch());
        document.getElementById('confirmNewPassword').addEventListener('input', () => this.validateNewPasswordMatch());

        // Close modals on overlay click
        document.querySelectorAll('.auth-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideAllModals();
                }
            });
        });

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    // ===== AUTHENTICATION STATUS =====
    loadStoredAuth() {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('user_data');

        if (token && user) {
            this.authToken = token;
            this.currentUser = JSON.parse(user);
            this.updateAuthUI();
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const response = await fetch(`${this.apiUrl}/user-info/`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.authToken = token;
                this.updateAuthUI();
            } else {
                this.clearAuth();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.clearAuth();
        }
    }

    // ===== LOGIN FUNCTIONALITY =====
    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        this.setFormLoading('loginForm', true);
        this.clearFormErrors('loginForm');

        try {
            const response = await fetch(`${this.apiUrl}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password'),
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;

                // Store auth data
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));

                this.updateAuthUI();
                this.hideLoginModal();
                this.showToast('Login successful! Welcome back.');

                // Sync cart if needed
                this.syncCartOnLogin();

            } else {
                this.displayFormErrors('loginForm', data);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please check your connection and try again.', 'error');
        } finally {
            this.setFormLoading('loginForm', false);
        }
    }

    // ===== REGISTRATION FUNCTIONALITY =====
    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        this.setFormLoading('registerForm', true);
        this.clearFormErrors('registerForm');

        try {
            const response = await fetch(`${this.apiUrl}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    username: formData.get('username'),
                    first_name: formData.get('first_name'),
                    last_name: formData.get('last_name'),
                    phone_number: formData.get('phone_number'),
                    password: formData.get('password'),
                    password_confirm: formData.get('password_confirm'),
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;

                // Store auth data
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));

                this.updateAuthUI();
                this.hideRegisterModal();
                this.showToast('Account created successfully! Welcome to our store.');

                // Sync cart if needed
                this.syncCartOnLogin();

            } else {
                this.displayFormErrors('registerForm', data);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'error');
        } finally {
            this.setFormLoading('registerForm', false);
        }
    }

    // ===== LOGOUT FUNCTIONALITY =====
    async logout() {
        try {
            if (this.authToken) {
                await fetch(`${this.apiUrl}/logout/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${this.authToken}`,
                        'Content-Type': 'application/json',
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            this.showToast('You have been logged out successfully.');
        }
    }

    clearAuth() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.updateAuthUI();
    }

    // ===== PROFILE MANAGEMENT =====
    async loadUserProfile() {
        if (!this.authToken) return;

        try {
            const response = await fetch(`${this.apiUrl}/profile/`, {
                headers: {
                    'Authorization': `Token ${this.authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const profile = await response.json();
                this.populateProfileForm(profile);
            }
        } catch (error) {
            console.error('Profile load error:', error);
        }
    }

    populateProfileForm(profile) {
        const form = document.getElementById('profileForm');
        const elements = form.elements;

        elements.first_name.value = profile.first_name || '';
        elements.last_name.value = profile.last_name || '';
        elements.email.value = profile.email || '';
        elements.phone_number.value = profile.phone_number || '';
        elements.date_of_birth.value = profile.date_of_birth || '';
        elements.bio.value = profile.bio || '';
        elements.location.value = profile.location || '';
        elements.website.value = profile.website || '';
        elements.email_notifications.checked = profile.email_notifications || false;
        elements.marketing_emails.checked = profile.marketing_emails || false;
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        this.setFormLoading('profileForm', true);

        try {
            const response = await fetch(`${this.apiUrl}/profile/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: formData.get('first_name'),
                    last_name: formData.get('last_name'),
                    phone_number: formData.get('phone_number'),
                    date_of_birth: formData.get('date_of_birth'),
                    bio: formData.get('bio'),
                    location: formData.get('location'),
                    website: formData.get('website'),
                    email_notifications: formData.get('email_notifications') === 'on',
                    marketing_emails: formData.get('marketing_emails') === 'on',
                })
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                this.showToast('Profile updated successfully!');

                // Update stored user data
                this.currentUser.first_name = updatedProfile.first_name;
                this.currentUser.last_name = updatedProfile.last_name;
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                this.updateAuthUI();
            } else {
                const data = await response.json();
                this.showToast('Failed to update profile. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showToast('Failed to update profile. Please try again.', 'error');
        } finally {
            this.setFormLoading('profileForm', false);
        }
    }

    // ===== PASSWORD CHANGE =====
    async handlePasswordChange(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        this.setFormLoading('securityForm', true);
        this.clearFormErrors('securityForm');

        try {
            const response = await fetch(`${this.apiUrl}/change-password/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    old_password: formData.get('old_password'),
                    new_password: formData.get('new_password'),
                    new_password_confirm: formData.get('new_password_confirm'),
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Password changed successfully!');
                form.reset();
            } else {
                this.displayFormErrors('securityForm', data);
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showToast('Failed to change password. Please try again.', 'error');
        } finally {
            this.setFormLoading('securityForm', false);
        }
    }

    // ===== VALIDATION HELPERS =====
    async checkEmailAvailability() {
        const email = document.getElementById('registerEmail').value.trim();
        if (!email) return;

        try {
            const response = await fetch(`${this.apiUrl}/check-email/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            const errorElement = document.getElementById('registerEmailError');
            const successElement = document.getElementById('registerEmailSuccess');

            if (data.is_available) {
                errorElement.textContent = '';
                successElement.textContent = 'Email is available!';
            } else {
                successElement.textContent = '';
                errorElement.textContent = 'This email is already registered.';
            }
        } catch (error) {
            console.error('Email check error:', error);
        }
    }

    async checkUsernameAvailability() {
        const username = document.getElementById('registerUsername').value.trim();
        if (!username) return;

        try {
            const response = await fetch(`${this.apiUrl}/check-username/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();
            const errorElement = document.getElementById('registerUsernameError');
            const successElement = document.getElementById('registerUsernameSuccess');

            if (data.is_available) {
                errorElement.textContent = '';
                successElement.textContent = 'Username is available!';
            } else {
                successElement.textContent = '';
                errorElement.textContent = 'This username is already taken.';
            }
        } catch (error) {
            console.error('Username check error:', error);
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerPasswordConfirm').value;
        const errorElement = document.getElementById('registerPasswordConfirmError');

        if (confirm && password !== confirm) {
            errorElement.textContent = 'Passwords do not match.';
        } else {
            errorElement.textContent = '';
        }
    }

    validateNewPasswordMatch() {
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmNewPassword').value;
        const errorElement = document.querySelector('#confirmNewPassword + .error-message');

        if (confirm && password !== confirm) {
            if (errorElement) errorElement.textContent = 'Passwords do not match.';
        } else {
            if (errorElement) errorElement.textContent = '';
        }
    }

    // ===== UI MANAGEMENT =====
    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');

        if (this.currentUser) {
            // User is logged in
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';

            // Update user display
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const userInitials = document.getElementById('userInitials');

            const fullName = `${this.currentUser.first_name} ${this.currentUser.last_name}`.trim();
            userName.textContent = fullName || this.currentUser.username;
            userEmail.textContent = this.currentUser.email;

            // Generate initials
            const initials = this.generateInitials(fullName || this.currentUser.username);
            userInitials.textContent = initials;

        } else {
            // User is not logged in
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    }

    generateInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    // ===== MODAL MANAGEMENT =====
    showLoginModal() {
        document.getElementById('loginOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('loginEmail').focus(), 300);
    }

    hideLoginModal() {
        document.getElementById('loginOverlay').classList.remove('active');
        document.body.style.overflow = '';
        this.clearFormErrors('loginForm');
        document.getElementById('loginForm').reset();
    }

    showRegisterModal() {
        document.getElementById('registerOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('registerFirstName').focus(), 300);
    }

    hideRegisterModal() {
        document.getElementById('registerOverlay').classList.remove('active');
        document.body.style.overflow = '';
        this.clearFormErrors('registerForm');
        document.getElementById('registerForm').reset();
    }

    showProfileModal() {
        if (!this.currentUser) {
            this.showLoginModal();
            return;
        }

        document.getElementById('profileOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.loadUserProfile();
    }

    hideProfileModal() {
        document.getElementById('profileOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    hideAllModals() {
        this.hideLoginModal();
        this.hideRegisterModal();
        this.hideProfileModal();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    // ===== FORM HELPERS =====
    setFormLoading(formId, isLoading) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        form.querySelectorAll('.success-message').forEach(el => el.textContent = '');
    }

    displayFormErrors(formId, errors) {
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${formId.replace('Form', '')}${field.charAt(0).toUpperCase() + field.slice(1)}Error`);
            if (errorElement) {
                errorElement.textContent = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
            }
        });
    }

    // ===== CART INTEGRATION =====
    syncCartOnLogin() {
        // Future: Sync localStorage cart with backend user cart
        if (window.cart) {
            // This could sync the cart data to the backend
            console.log('User logged in - cart sync available for future implementation');
        }
    }

    // ===== UTILITY METHODS =====
    showToast(message, type = 'success') {
        if (window.cart && window.cart.showToast) {
            window.cart.showToast(message);
        } else {
            // Fallback toast
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    isAuthenticated() {
        return !!this.currentUser && !!this.authToken;
    }

    getAuthHeaders() {
        return this.authToken ? {
            'Authorization': `Token ${this.authToken}`,
            'Content-Type': 'application/json',
        } : {
            'Content-Type': 'application/json',
        };
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthenticationSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticationSystem;
}
