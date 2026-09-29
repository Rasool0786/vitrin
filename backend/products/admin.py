from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    Category,
    Color,
    Size,
    Product,
    ProductImage,
    Comment,
    ProductVariant,
    Wishlist,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    autocomplete_fields = ["color", "size"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "product_code",
        "category",
        "price",
        "discount",
        "datetime_created",
    ]
    list_filter = ["category", "datetime_created"]
    search_fields = ["title", "product_code", "slug"]
    inlines = [ProductImageInline, ProductVariantInline]
    readonly_fields = ["datetime_created", "datetime_updated"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "parent"]
    search_fields = ["name"]


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ["name", "code"]
    search_fields = ["name"]


@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "product",
        "stars",
        "is_published",
        "datetime_created",
    ]
    list_filter = ["is_published", "stars", "datetime_created"]
    list_editable = ["is_published"]
    search_fields = ["name", "text"]
    readonly_fields = ["datetime_created", "datetime_updated"]
    actions = ["approve_comments", "reject_comments"]

    @admin.action(description=_("Approve selected comments"))
    def approve_comments(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f"{updated} comment(s) approved.")

    @admin.action(description=_("Reject selected comments"))
    def reject_comments(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f"{updated} comment(s) rejected.")


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ["user", "product", "datetime_created"]
    list_filter = ["datetime_created"]
    search_fields = ["user__phone_number", "product__title"]
    readonly_fields = ["datetime_created"]
    autocomplete_fields = ["user", "product"]
