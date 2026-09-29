import uuid
from decimal import Decimal

import redis
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .models import Coupon, CouponUsage

redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)


class CartService:
    """
    Redis-backed cart.
    Key: cart:u:{user_id}  or  cart:g:{guest_uuid}
    Storage: hash {variant_id_str: quantity_str}
    Coupon: separate key coupon:u:{user_id} or coupon:g:{guest_uuid}
    TTL: 30 days
    """

    CART_TTL = 60 * 60 * 24 * 30  # 30 days
    COOKIE_NAME = "cart_id"

    def __init__(self, request):
        self.request = request
        self.user = request.user if request.user.is_authenticated else None
        self._guest_id_created = None
        self._identifier = self._resolve_identifier()
        self._key = f"cart:{self._identifier}"
        self._coupon_key = f"coupon:{self._identifier}"

    # ----- identifier -----
    def _resolve_identifier(self):
        if self.user:
            return f"u:{self.user.id}"
        guest_id = self.request.COOKIES.get(self.COOKIE_NAME)
        if not guest_id:
            guest_id = str(uuid.uuid4())
            self._guest_id_created = guest_id
        return f"g:{guest_id}"

    def attach_cookie_if_needed(self, response):
        """Call from views to set the guest cookie on first interaction."""
        if self._guest_id_created:
            response.set_cookie(
                self.COOKIE_NAME,
                self._guest_id_created,
                max_age=self.CART_TTL,
                httponly=True,
                samesite="Lax",
            )

    # ----- core ops -----
    def get_raw_items(self):
        """Returns dict {variant_id_str: quantity_int}"""
        raw = redis_client.hgetall(self._key) or {}
        return {int(k): int(v) for k, v in raw.items()}

    def get_coupon_code(self):
        return redis_client.get(self._coupon_key)

    def add(self, variant_id: int, quantity: int = 1):
        if quantity < 1:
            raise ValidationError(_("Quantity must be at least 1."))
        redis_client.hincrby(self._key, str(variant_id), quantity)
        self._refresh_ttl()

    def update(self, variant_id: int, quantity: int):
        if quantity <= 0:
            self.remove(variant_id)
            return
        redis_client.hset(self._key, str(variant_id), quantity)
        self._refresh_ttl()

    def remove(self, variant_id: int):
        redis_client.hdel(self._key, str(variant_id))
        self._refresh_ttl()

    def clear_items(self):
        redis_client.delete(self._key)
        redis_client.delete(self._coupon_key)

    def set_coupon(self, code: str):
        redis_client.set(self._coupon_key, code)
        redis_client.expire(self._coupon_key, self.CART_TTL)

    def clear_coupon(self):
        redis_client.delete(self._coupon_key)

    def _refresh_ttl(self):
        redis_client.expire(self._key, self.CART_TTL)

    # ----- merge (guest -> user after login) -----
    def merge_guest_into_user(self, user):
        """
        Called after login. Moves guest cart items into user cart.
        The current request must have COOKIES[cart_id] pointing to the guest key.
        """
        guest_id = self.request.COOKIES.get(self.COOKIE_NAME)
        if not guest_id:
            return

        guest_key = f"cart:g:{guest_id}"
        guest_coupon_key = f"coupon:g:{guest_id}"
        user_key = f"cart:u:{user.id}"
        user_coupon_key = f"coupon:u:{user.id}"

        guest_items = redis_client.hgetall(guest_key) or {}
        for variant_id, qty in guest_items.items():
            redis_client.hincrby(user_key, variant_id, int(qty))

        if guest_items:
            redis_client.expire(user_key, self.CART_TTL)

        # coupon: guest's coupon wins (if user has none)
        guest_coupon = redis_client.get(guest_coupon_key)
        if guest_coupon and not redis_client.get(user_coupon_key):
            redis_client.set(user_coupon_key, guest_coupon)
            redis_client.expire(user_coupon_key, self.CART_TTL)

        # cleanup
        redis_client.delete(guest_key, guest_coupon_key)


class CouponService:
    @staticmethod
    def validate_and_calculate(*, code, subtotal, user=None):
        """
        Returns (coupon, discount_amount).
        Raises ValidationError if invalid.
        """
        if not code:
            raise ValidationError(_("No coupon code provided."))

        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            raise ValidationError(_("Invalid coupon code."))

        if not coupon.is_active:
            raise ValidationError(_("This coupon is no longer active."))
        if not coupon.is_started:
            raise ValidationError(_("This coupon is not yet valid."))
        if coupon.is_expired:
            raise ValidationError(_("This coupon has expired."))
        if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
            raise ValidationError(_("This coupon has reached its usage limit."))
        if subtotal < coupon.min_purchase:
            raise ValidationError(
                _("Minimum purchase of %(min)d Toman required for this coupon.")
                % {"min": coupon.min_purchase}
            )

        # per-user limit
        if user is not None:
            user_uses = CouponUsage.objects.filter(coupon=coupon, user=user).count()
            if user_uses >= coupon.per_user_limit:
                raise ValidationError(
                    _("You have already used this coupon the maximum number of times.")
                )

        discount = (subtotal * coupon.discount_percent) // 100
        if coupon.max_discount is not None:
            discount = min(discount, coupon.max_discount)

        return coupon, discount

    @staticmethod
    def record_usage(*, coupon, user=None, order_code=""):
        """Call this once the order is successfully created."""
        CouponUsage.objects.create(coupon=coupon, user=user, order_code=order_code)
        Coupon.objects.filter(pk=coupon.pk).update(used_count=coupon.used_count + 1)
