from django.contrib import admin
from .models import Coupon, CouponUsage


class CouponUsageInline(admin.TabularInline):
    model = CouponUsage
    extra = 0
    readonly_fields = [
        "user",
        "order_code",
        "datetime_created",
    ]
    can_delete = False


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "discount_percent",
        "max_discount",
        "min_purchase",
        "valid_from",
        "valid_to",
        "used_count",
        "max_uses",
        "is_active",
    ]
    list_filter = [
        "is_active",
        "valid_from",
        "valid_to",
    ]
    search_fields = ["code"]
    readonly_fields = [
        "used_count",
        "datetime_created",
        "datetime_updated",
    ]
    inlines = [CouponUsageInline]


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = [
        "coupon",
        "user",
        "order_code",
        "datetime_created",
    ]
    list_filter = ["coupon", "datetime_created"]
    search_fields = [
        "coupon__code",
        "user__username",
        "order_code",
    ]
    readonly_fields = ["datetime_created"]
