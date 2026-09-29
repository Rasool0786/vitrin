from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True, verbose_name=_("Code"))
    discount_percent = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name=_("Discount (%)"),
    )
    max_discount = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Max Discount"),
        help_text=_("Maximum discount amount (Toman). Null = no limit."),
    )
    min_purchase = models.PositiveBigIntegerField(
        default=0,
        verbose_name=_("Minimum Purchase"),
        help_text=_("Minimum subtotal required to use this coupon."),
    )
    valid_from = models.DateTimeField(verbose_name=_("Valid From"))
    valid_to = models.DateTimeField(verbose_name=_("Valid To"))
    max_uses = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Max Uses"),
        help_text=_(
            "Maximum number of times this coupon can be used. Null = unlimited."
        ),
    )
    used_count = models.PositiveIntegerField(default=0, verbose_name=_("Used Count"))
    per_user_limit = models.PositiveIntegerField(
        default=1,
        verbose_name=_("Per User Limit"),
        help_text=_("How many times one user can use this coupon."),
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))

    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )
    datetime_updated = models.DateTimeField(
        auto_now=True, verbose_name=_("Date/Time Updated")
    )

    class Meta:
        verbose_name = _("Coupon")
        verbose_name_plural = _("Coupons")
        ordering = ["-datetime_created"]
        indexes = [
            models.Index(fields=["code"], name="coupon_code_idx"),
            models.Index(fields=["is_active", "valid_to"], name="coupon_active_idx"),
        ]

    def __str__(self):
        return self.code

    @property
    def is_expired(self):
        return timezone.now() > self.valid_to

    @property
    def is_started(self):
        return timezone.now() >= self.valid_from

    @property
    def is_usable(self):
        if not self.is_active:
            return False
        if not self.is_started or self.is_expired:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        return True


class CouponUsage(models.Model):
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        related_name="usages",
        verbose_name=_("Coupon"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coupon_usages",
        verbose_name=_("User"),
        null=True,
        blank=True,
    )
    order_code = models.CharField(
        max_length=32, blank=True, verbose_name=_("Order Code")
    )
    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )

    class Meta:
        verbose_name = _("Coupon Usage")
        verbose_name_plural = _("Coupon Usages")
        indexes = [
            models.Index(fields=["coupon", "user"], name="coupon_usage_idx"),
        ]

    def __str__(self):
        return f"{self.coupon.code} - {self.user or 'guest'}"
