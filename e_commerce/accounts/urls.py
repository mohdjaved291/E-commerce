# accounts/urls.py

from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    # Authentication endpoints
    path("register/", views.UserRegistrationView.as_view(), name="register"),
    path("login/", views.UserLoginView.as_view(), name="login"),
    path("logout/", views.UserLogoutView.as_view(), name="logout"),
    # User management
    path("profile/", views.UserProfileView.as_view(), name="profile"),
    path("dashboard/", views.UserDashboardView.as_view(), name="dashboard"),
    path("user-info/", views.user_info, name="user_info"),
    # Password management
    path(
        "change-password/", views.PasswordChangeView.as_view(), name="change_password"
    ),
    # Address management
    path("addresses/", views.AddressListCreateView.as_view(), name="address_list"),
    path(
        "addresses/<int:pk>/", views.AddressDetailView.as_view(), name="address_detail"
    ),
    # Utility endpoints
    path("check-email/", views.check_email_availability, name="check_email"),
    path("check-username/", views.check_username_availability, name="check_username"),
    # Account management
    path("deactivate/", views.AccountDeactivateView.as_view(), name="deactivate"),
]
