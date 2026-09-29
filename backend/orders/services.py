from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from products.models import ProductVariant
from .models import Order, OrderItem


@transaction.atomic
def create_order(*, user, cart_items, shipping_data, coupon_code=""):
    """
    Create an order atomically and decrement stock.

    Args:
        user: CustomUser or None for guest orders
        cart_items: list of dicts [{"variant_id": int, "quantity": int}, ...]
        shipping_data: dict {full_name, phone, address, city, postal_code, note}
        coupon_code: optional coupon code snapshot

    Returns:
        Order instance

    Raises:
        ValidationError: if variant missing, insufficient stock, etc.
    """
    if not cart_items:
        raise ValidationError(_("Cart is empty."))

    variant_ids = [int(item["variant_id"]) for item in cart_items]
    variants = (
        ProductVariant.objects.select_for_update()
        .filter(id__in=variant_ids)
        .select_related("product", "color", "size")
        .in_bulk()
    )

    missing = set(variant_ids) - set(variants.keys())
    if missing:
        raise ValidationError(
            _("Some variants were not found: %(ids)s")
            % {"ids": ", ".join(map(str, missing))}
        )

    # Validate stock before mutating anything
    for item in cart_items:
        variant = variants[int(item["variant_id"])]
        qty = int(item["quantity"])
        if qty < 1:
            raise ValidationError(_("Quantity must be at least 1."))
        if variant.stock < qty:
            raise ValidationError(
                _(
                    "Not enough stock for %(name)s. "
                    "Available: %(stock)d, requested: %(qty)d."
                )
                % {
                    "name": str(variant),
                    "stock": variant.stock,
                    "qty": qty,
                }
            )

    order = Order.objects.create(
        user=user,
        coupon_code=coupon_code,
        **shipping_data,
    )

    subtotal = 0
    for item in cart_items:
        variant = variants[int(item["variant_id"])]
        unit_price = int(variant.product.final_price)
        qty = int(item["quantity"])
        subtotal += unit_price * qty

        OrderItem.objects.create(
            order=order,
            variant=variant,
            product_title=variant.product.title,
            color_name=variant.color.name,
            size_name=variant.size.name,
            unit_price=unit_price,
            quantity=qty,
        )

        variant.stock -= qty
        variant.save(update_fields=["stock", "datetime_updated"])

    # Coupon (integration point for cart app)
    discount_amount = 0
    if coupon_code:
        # TODO: integrate coupon logic from cart app
        pass

    order.subtotal = subtotal
    order.discount_amount = discount_amount
    order.total_price = max(subtotal - discount_amount, 0)
    order.save(
        update_fields=[
            "subtotal",
            "discount_amount",
            "total_price",
            "datetime_updated",
        ]
    )

    return order


@transaction.atomic
def cancel_order(*, order):
    """
    Cancel an order and restore stock for its items.
    """
    if order.status == Order.Status.CANCELLED:
        raise ValidationError(_("Order is already cancelled."))
    if order.status in (Order.Status.SHIPPED, Order.Status.DELIVERED):
        raise ValidationError(_("Cannot cancel a shipped or delivered order."))

    items = list(order.items.select_related("variant").all())
    variant_ids = [i.variant_id for i in items]

    variants = (
        ProductVariant.objects.select_for_update().filter(id__in=variant_ids).in_bulk()
    )

    for item in items:
        variant = variants[item.variant_id]
        variant.stock += item.quantity
        variant.save(update_fields=["stock", "datetime_updated"])

    order.status = Order.Status.CANCELLED
    order.save(update_fields=["status", "datetime_updated"])
    return order
