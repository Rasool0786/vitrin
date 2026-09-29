from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Address, CustomUser, Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name = _("Profile")
    verbose_name_plural = _("Profile")
    fk_name = "user"


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = ("is_staff", "is_superuser", "is_active", "date_joined")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-date_joined",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "full_name",
        "national_code",
        "birth_date",
        "datetime_created",
    )
    list_filter = ("datetime_created", "datetime_updated")
    search_fields = (
        "user__username",
        "user__email",
        "full_name",
        "national_code",
    )
    readonly_fields = ("datetime_created", "datetime_updated")
    autocomplete_fields = ("user",)
    ordering = ("-datetime_created",)


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "full_name",
        "phone",
        "province",
        "city",
        "is_default",
        "datetime_created",
    )
    list_filter = ("is_default", "province", "city", "datetime_created")
    search_fields = (
        "title",
        "user__username",
        "user__email",
        "full_name",
        "phone",
        "postal_code",
        "address",
    )
    readonly_fields = ("datetime_created", "datetime_updated")
    autocomplete_fields = ("user",)
    list_editable = ("is_default",)
    ordering = ("-is_default", "-datetime_created")