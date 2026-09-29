import time
import uuid

import redis
from django.conf import settings

from .models import Product, Wishlist

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


class WishlistService:
    """
    Wishlist storage:
      - Logged-in user  → DB table `Wishlist`
      - Guest           → Redis Sorted Set `wishlist:g:{guest_id}`
                          (score = timestamp → preserves insertion order)

    Cookie `wishlist_id` identifies the guest.
    """

    COOKIE_NAME = "wishlist_id"
    TTL = 60 * 60 * 24 * 5

    def __init__(self, request):
        self.request = request
        self.user = request.user if request.user.is_authenticated else None
        self._guest_id_created = None
        self._identifier = self._resolve_identifier()
        self._key = f"wishlist:{self._identifier}"

    def _resolve_identifier(self):
        if self.user:
            return f"u:{self.user.id}"
        guest_id = self.request.COOKIES.get(self.COOKIE_NAME)
        if not guest_id:
            guest_id = str(uuid.uuid4())
            self._guest_id_created = guest_id
        return f"g:{guest_id}"

    def attach_cookie_if_needed(self, response):
        if self._guest_id_created:
            response.set_cookie(
                self.COOKIE_NAME,
                self._guest_id_created,
                max_age=self.TTL,
                httponly=True,
                samesite="Lax",
            )

    # ---------- reads ----------
    def list_product_ids(self):
        """Newest first."""
        if self.user:
            return list(
                Wishlist.objects.filter(user=self.user)
                .order_by("-datetime_created")
                .values_list("product_id", flat=True)
            )
        # ZREVRANGE → newest first
        return [int(x) for x in redis_client.zrevrange(self._key, 0, -1)]

    def contains(self, product_id):
        if self.user:
            return Wishlist.objects.filter(
                user=self.user, product_id=product_id
            ).exists()
        return redis_client.zscore(self._key, product_id) is not None

    # ---------- writes ----------
    def add(self, product_id):
        """Returns True if newly added, False if already there."""
        if self.user:
            _, created = Wishlist.objects.get_or_create(
                user=self.user, product_id=product_id
            )
            return created
        added = redis_client.zadd(self._key, {product_id: time.time()})
        redis_client.expire(self._key, self.TTL)
        return bool(added)

    def remove(self, product_id):
        """Returns True if removed, False if wasn't there."""
        if self.user:
            deleted, _ = Wishlist.objects.filter(
                user=self.user, product_id=product_id
            ).delete()
            return deleted > 0
        removed = redis_client.zrem(self._key, product_id)
        return bool(removed)

    def clear(self):
        if self.user:
            Wishlist.objects.filter(user=self.user).delete()
        else:
            redis_client.delete(self._key)

    # ---------- merge ----------
    def merge_guest_into_user(self, user):
        """Called after login: move guest Redis items → DB. Returns count of newly added items."""
        guest_id = self.request.COOKIES.get(self.COOKIE_NAME)
        if not guest_id:
            return 0

        guest_key = f"wishlist:g:{guest_id}"
        guest_product_ids = {int(x) for x in redis_client.zrange(guest_key, 0, -1)}

        if not guest_product_ids:
            return 0

        # Only keep products that still exist
        valid_ids = set(
            Product.objects.filter(id__in=guest_product_ids).values_list(
                "id", flat=True
            )
        )
        if not valid_ids:
            redis_client.delete(guest_key)
            return 0

        existing_ids = set(
            Wishlist.objects.filter(user=user, product_id__in=valid_ids).values_list(
                "product_id", flat=True
            )
        )

        to_create = valid_ids - existing_ids
        if to_create:
            Wishlist.objects.bulk_create(
                [Wishlist(user=user, product_id=pid) for pid in to_create]
            )

        redis_client.delete(guest_key)
        return len(to_create)
