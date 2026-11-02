import pytest

from orders.models import Order
from products.models import ProductVariant

pytestmark = pytest.mark.django_db


BASE_ORDER_PAYLOAD = {
    "full_name": "Ali Rezaei",
    "phone": "09120000000",
    "address": "Somewhere in Tehran",
    "city": "Tehran",
    "postal_code": "1234567890",
    "note": "",
}


def _payload(variant, quantity=1, **overrides):
    data = {
        **BASE_ORDER_PAYLOAD,
        "items": [{"variant_id": variant.id, "quantity": quantity}],
    }
    data.update(overrides)
    return data


class TestOrderCreate:
    url = "/api/orders/"

    def test_unauthenticated_cannot_create(
        self, api_client, product_variant
    ):
        response = api_client.post(
            self.url, _payload(product_variant), format="json"
        )
        assert response.status_code in (401, 403)

    def test_create_order_success(
        self, authenticated_client, user, product_variant
    ):
        response = authenticated_client.post(
            self.url, _payload(product_variant, quantity=2), format="json"
        )
        assert response.status_code == 201
        data = response.data
        assert data["status"] == Order.Status.PENDING
        assert data["subtotal"] == 2_000_000
        assert data["total_price"] == 2_000_000
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 2
        assert Order.objects.filter(user=user).count() == 1

    def test_stock_is_decremented(
        self, authenticated_client, product_variant
    ):
        assert product_variant.stock == 10
        authenticated_client.post(
            self.url, _payload(product_variant, quantity=3), format="json"
        )
        product_variant.refresh_from_db()
        assert product_variant.stock == 7

    def test_insufficient_stock_fails(
        self, authenticated_client, product_variant
    ):
        response = authenticated_client.post(
            self.url, _payload(product_variant, quantity=100), format="json"
        )
        assert response.status_code == 400
        product_variant.refresh_from_db()
        assert product_variant.stock == 10

    def test_unknown_variant_fails(self, authenticated_client, db):
        payload = {
            **BASE_ORDER_PAYLOAD,
            "items": [{"variant_id": 99999, "quantity": 1}],
        }
        response = authenticated_client.post(
            self.url, payload, format="json"
        )
        assert response.status_code == 400

    def test_empty_items_fails(self, authenticated_client, db):
        payload = {**BASE_ORDER_PAYLOAD, "items": []}
        response = authenticated_client.post(
            self.url, payload, format="json"
        )
        assert response.status_code == 400

    def test_missing_required_fields(
        self, authenticated_client, product_variant
    ):
        payload = {
            "items": [{"variant_id": product_variant.id, "quantity": 1}],
        }
        response = authenticated_client.post(
            self.url, payload, format="json"
        )
        assert response.status_code == 400

    def test_discounted_price_in_order(
        self, authenticated_client, discounted_product, color, size
    ):
        variant = ProductVariant.objects.create(
            product=discounted_product,
            color=color,
            size=size,
            stock=5,
        )
        response = authenticated_client.post(
            self.url, _payload(variant, quantity=2), format="json"
        )
        assert response.status_code == 201
        # 1000000 - 20 percent = 800000 per unit, times 2 = 1600000
        assert response.data["subtotal"] == 1_600_000


class TestOrderList:
    url = "/api/orders/"

    def _make_order(self, client, variant, quantity=1, **overrides):
        return client.post(
            self.url, _payload(variant, quantity, **overrides), format="json"
        )

    def test_user_sees_only_own_orders(
        self,
        api_client,
        authenticated_client,
        user,
        product_variant,
        second_variant,
    ):
        self._make_order(authenticated_client, product_variant)
        self._make_order(authenticated_client, second_variant)

        # Another user
        from users.models import CustomUser

        other = CustomUser.objects.create_user(
            username="other",
            email="other@example.com",
            password="OtherPass123!",
        )
        api_client.force_authenticate(user=other)
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert response.data["count"] == 0

    def test_staff_sees_all_orders(
        self,
        authenticated_client,
        staff_client,
        product_variant,
    ):
        self._make_order(authenticated_client, product_variant)

        response = staff_client.get(self.url)
        assert response.status_code == 200
        assert response.data["count"] == 1


class TestOrderDetail:
    def test_owner_can_view(self, authenticated_client, product_variant):
        create = authenticated_client.post(
            "/api/orders/",
            _payload(product_variant, quantity=1),
            format="json",
        )
        order_id = create.data["id"]
        response = authenticated_client.get(f"/api/orders/{order_id}/")
        assert response.status_code == 200
        assert response.data["order_code"] == create.data["order_code"]

    def test_other_user_gets_404(
        self, api_client, authenticated_client, product_variant
    ):
        create = authenticated_client.post(
            "/api/orders/",
            _payload(product_variant, quantity=1),
            format="json",
        )
        order_id = create.data["id"]

        from users.models import CustomUser

        other = CustomUser.objects.create_user(
            username="intruder",
            email="intruder@example.com",
            password="Pass123!",
        )
        api_client.force_authenticate(user=other)
        response = api_client.get(f"/api/orders/{order_id}/")
        assert response.status_code == 404


class TestOrderCancel:
    def _create_order(self, client, variant, quantity=1):
        return client.post(
            "/api/orders/",
            _payload(variant, quantity=quantity),
            format="json",
        )

    def test_cancel_restores_stock(
        self, authenticated_client, product_variant
    ):
        create = self._create_order(
            authenticated_client, product_variant, quantity=2
        )
        order_id = create.data["id"]

        product_variant.refresh_from_db()
        assert product_variant.stock == 8

        response = authenticated_client.post(
            f"/api/orders/{order_id}/cancel/", format="json"
        )
        assert response.status_code == 200

        product_variant.refresh_from_db()
        assert product_variant.stock == 10

        from orders.models import Order

        order = Order.objects.get(pk=order_id)
        assert order.status == Order.Status.CANCELLED

    def test_cannot_cancel_twice(
        self, authenticated_client, product_variant
    ):
        create = self._create_order(
            authenticated_client, product_variant, quantity=1
        )
        order_id = create.data["id"]

        authenticated_client.post(
            f"/api/orders/{order_id}/cancel/", format="json"
        )
        response = authenticated_client.post(
            f"/api/orders/{order_id}/cancel/", format="json"
        )
        assert response.status_code == 400

    def test_cannot_cancel_shipped_order(
        self, authenticated_client, product_variant
    ):
        from orders.models import Order

        create = self._create_order(
            authenticated_client, product_variant, quantity=1
        )
        order_id = create.data["id"]

        order = Order.objects.get(pk=order_id)
        order.status = Order.Status.SHIPPED
        order.save(update_fields=["status"])

        response = authenticated_client.post(
            f"/api/orders/{order_id}/cancel/", format="json"
        )
        assert response.status_code == 400
