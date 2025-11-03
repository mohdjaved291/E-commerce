from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import UserProfile, Address

User = get_user_model()


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"
    fields = [
        "avatar",
        "bio",
        "location",
        "website",
        "email_notifications",
        "marketing_emails",
    ]


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    fields = [
        "address_type",
        "street_address",
        "city",
        "state",
        "postal_code",
        "is_default",
    ]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline, AddressInline]

    list_display = [
        "email",
        "username",
        "first_name",
        "last_name",
        "is_active",
        "is_staff",
        "date_joined",
    ]
    list_filter = ["is_active", "is_staff", "is_superuser", "date_joined"]
    search_fields = ["email", "username", "first_name", "last_name"]
    ordering = ["-date_joined"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Additional Info",
            {"fields": ("phone_number", "date_of_birth", "is_email_verified")},
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Additional Info",
            {"fields": ("email", "first_name", "last_name", "phone_number")},
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "location", "email_notifications", "created_at"]
    list_filter = ["email_notifications", "marketing_emails", "created_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "location"]
    raw_id_fields = ["user"]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["user", "address_type", "city", "state", "is_default", "created_at"]
    list_filter = ["address_type", "is_default", "country", "created_at"]
    search_fields = ["user__email", "street_address", "city", "state"]
    raw_id_fields = ["user"]
