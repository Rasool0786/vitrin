from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = [
        "product_title",
        "color_name",
        "size_name",
        "unit_price",
        "line_total",
    ]
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_code",
        "user",
        "status",
        "total_price",
        "items_count",
        "datetime_created",
    ]
    list_filter = ["status", "datetime_created"]
    search_fields = [
        "order_code",
        "full_name",
        "phone",
        "user__username",
    ]
    readonly_fields = [
        "order_code",
        "subtotal",
        "discount_amount",
        "total_price",
        "datetime_created",
        "datetime_updated",
    ]
    inlines = [OrderItemInline]
