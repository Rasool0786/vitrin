from datetime import timedelta

import pytest
from django.utils import timezone

from cart.models import Coupon

pytestmark = pytest.mark.django_db


@pytest.fixture
def coupon(db):
    return Coupon.objects.create(
        code="SAVE10",
        discount_percent=10,
        min_purchase=0,
        max_discount=None,
        valid_from=timezone.now() - timedelta(days=1),
        valid_to=timezone.now() + timedelta(days=30),
        max_uses=None,
        used_count=0,
        per_user_limit=10,
        is_active=True,
    )


@pytest.fixture
def capped_coupon(db):
    return Coupon.objects.create(
        code="CAP200K",
        discount_percent=50,
        min_purchase=0,
        max_discount=200_000,
        valid_from=timezone.now() - timedelta(days=1),
        valid_to=timezone.now() + timedelta(days=30),
        max_uses=None,
        used_count=0,
        per_user_limit=10,
        is_active=True,
    )


class TestCouponApply:
    apply_url = "/api/cart/coupon/"
    items_url = "/api/cart/items/"

    def test_apply_valid_coupon(self, api_client, product_variant, coupon):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        assert response.status_code == 200
        assert response.data["coupon"] is not None
        assert response.data["coupon"]["code"] == "SAVE10"
        assert response.data["discount_amount"] == 100_000
        assert response.data["total"] == 900_000

    def test_coupon_code_is_case_insensitive(
        self, api_client, product_variant, coupon
    ):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "save10"}, format="json"
        )
        assert response.status_code == 200
        assert response.data["coupon"]["code"] == "SAVE10"

    def test_max_discount_caps_discount(
        self, api_client, product_variant, capped_coupon
    ):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "CAP200K"}, format="json"
        )
        assert response.status_code == 200
        # 50 percent of 1000000 = 500000, capped at 200000
        assert response.data["discount_amount"] == 200_000
        assert response.data["total"] == 800_000

    def test_apply_invalid_code(self, api_client, product_variant):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "NOPE"}, format="json"
        )
        assert response.status_code == 400

    def test_apply_inactive_coupon(self, api_client, product_variant, coupon):
        coupon.is_active = False
        coupon.save(update_fields=["is_active"])

        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        assert response.status_code == 400

    def test_apply_expired_coupon(self, api_client, product_variant, coupon):
        coupon.valid_to = timezone.now() - timedelta(days=1)
        coupon.save(update_fields=["valid_to"])

        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        assert response.status_code == 400

    def test_apply_not_yet_started_coupon(
        self, api_client, product_variant, coupon
    ):
        coupon.valid_from = timezone.now() + timedelta(days=1)
        coupon.save(update_fields=["valid_from"])

        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        assert response.status_code == 400

    def test_max_uses_reached(self, api_client, product_variant, coupon):
        coupon.max_uses = 5
        coupon.used_count = 5
        coupon.save(update_fields=["max_uses", "used_count"])

        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        assert response.status_code == 400

    def test_apply_coupon_on_empty_cart_fails(self, api_client, coupon):
        response = api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        assert response.status_code == 400
        assert "empty" in response.data["detail"].lower()

    def test_remove_coupon(self, api_client, product_variant, coupon):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        response = api_client.delete(self.apply_url)
        assert response.status_code == 200
        assert response.data["coupon"] is None
        assert response.data["discount_amount"] == 0

    def test_min_purchase_not_met(
        self, api_client, product_variant, coupon
    ):
        coupon.min_purchase = 5_000_000
        coupon.save(update_fields=["min_purchase"])

        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )
        response = api_client.post(
            self.apply_url, {"code": "SAVE10"}, format="json"
        )
        assert response.status_code == 400
