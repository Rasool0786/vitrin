import secrets
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        PAID = "paid", _("Paid")
        SHIPPED = "shipped", _("Shipped")
        DELIVERED = "delivered", _("Delivered")
        CANCELLED = "cancelled", _("Cancelled")
        REFUNDED = "refunded", _("Refunded")

    order_code = models.CharField(
        max_length=32,
        unique=True,
        blank=True,
        verbose_name=_("Order Code"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name=_("User"),
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_("Status"),
    )

    subtotal = models.PositiveBigIntegerField(default=0, verbose_name=_("Subtotal"))
    discount_amount = models.PositiveBigIntegerField(
        default=0, verbose_name=_("Discount Amount")
    )
    total_price = models.PositiveBigIntegerField(
        default=0, verbose_name=_("Total Price")
    )

    coupon_code = models.CharField(
        max_length=50, blank=True, verbose_name=_("Coupon Code")
    )

    full_name = models.CharField(max_length=255, verbose_name=_("Full Name"))
    phone = models.CharField(max_length=20, verbose_name=_("Phone"))
    address = models.TextField(verbose_name=_("Address"))
    city = models.CharField(max_length=100, blank=True, verbose_name=_("City"))
    postal_code = models.CharField(
        max_length=20, blank=True, verbose_name=_("Postal Code")
    )
    note = models.TextField(blank=True, verbose_name=_("Note"))

    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )
    datetime_updated = models.DateTimeField(
        auto_now=True, verbose_name=_("Date/Time Updated")
    )
    datetime_paid = models.DateTimeField(
        null=True, blank=True, verbose_name=_("Date/Time Paid")
    )

    class Meta:
        ordering = ["-datetime_created"]
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        indexes = [
            models.Index(fields=["order_code"], name="order_code_idx"),
            models.Index(
                fields=["user", "-datetime_created"],
                name="order_user_created_idx",
            ),
            models.Index(fields=["status"], name="order_status_idx"),
        ]

    def __str__(self):
        return self.order_code

    def save(self, *args, **kwargs):
        if not self.order_code:
            self.order_code = self._generate_order_code()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_order_code():
        year = timezone.now().year
        random_part = secrets.token_hex(4).upper()
        return f"ORD-{year}-{random_part}"

    @property
    def items_count(self):
        return sum(item.quantity for item in self.items.all())


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Order"),
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name=_("Variant"),
    )
    product_title = models.CharField(max_length=255, blank=True, verbose_name=_("Product Title"))
    color_name = models.CharField(max_length=50, blank=True, verbose_name=_("Color Name"))
    size_name = models.CharField(max_length=50, blank=True, verbose_name=_("Size Name"))
    unit_price = models.PositiveBigIntegerField(default=0, verbose_name=_("Unit Price"))
    quantity = models.PositiveIntegerField(default=1, verbose_name=_("Quantity"))
    line_total = models.PositiveBigIntegerField(default=0, verbose_name=_("Line Total"))

    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )

    class Meta:
        verbose_name = _("Order Item")
        verbose_name_plural = _("Order Items")
        constraints = [
            models.UniqueConstraint(
                fields=["order", "variant"],
                name="unique_variant_per_order",
            )
        ]

    def __str__(self):
        return f"{self.product_title} x {self.quantity}"

    def save(self, *args, **kwargs):
        if self.variant:
            if not self.product_title:
                self.product_title = self.variant.product.title
            if not self.color_name and self.variant.color:
                self.color_name = self.variant.color.name
            if not self.size_name and self.variant.size:
                self.size_name = self.variant.size.name
            if not self.unit_price:
                self.unit_price = int(self.variant.product.final_price)

        self.line_total = self.unit_price * self.quantity
        super().save(*args, **kwargs)
