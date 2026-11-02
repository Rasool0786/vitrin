import pytest

pytestmark = pytest.mark.django_db


class TestGuestCart:
    list_url = "/api/cart/"
    items_url = "/api/cart/items/"

    def test_empty_cart(self, api_client):
        response = api_client.get(self.list_url)
        assert response.status_code == 200
        assert response.data["items"] == []
        assert response.data["subtotal"] == 0
        assert response.data["total"] == 0

    def test_add_item_persists_across_requests(
        self, api_client, product_variant
    ):
        payload = {"variant_id": product_variant.id, "quantity": 2}
        add_resp = api_client.post(self.items_url, payload, format="json")
        assert add_resp.status_code == 200

        list_resp = api_client.get(self.list_url)
        items = list_resp.data["items"]
        assert len(items) == 1
        assert items[0]["variant_id"] == product_variant.id
        assert items[0]["quantity"] == 2

    def test_subtotal_and_total(self, api_client, discounted_product, color, size):
        from products.models import ProductVariant

        variant = ProductVariant.objects.create(
            product=discounted_product,
            color=color,
            size=size,
            stock=10,
        )
        payload = {"variant_id": variant.id, "quantity": 2}
        api_client.post(self.items_url, payload, format="json")

        response = api_client.get(self.list_url)
        # 1000000 - 20 percent = 800000 per unit, times 2 = 1600000
        assert response.data["subtotal"] == 1600000
        assert response.data["total"] == 1600000

    def test_add_too_many_fails(self, api_client, product_variant):
        # stock = 10
        payload = {"variant_id": product_variant.id, "quantity": 20}
        response = api_client.post(self.items_url, payload, format="json")
        assert response.status_code == 400
        assert "stock" in response.data["detail"].lower()

    def test_add_unknown_variant_returns_404(self, api_client):
        payload = {"variant_id": 99999, "quantity": 1}
        response = api_client.post(self.items_url, payload, format="json")
        assert response.status_code == 404

    def test_update_item(self, api_client, product_variant):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 2},
            format="json",
        )
        url = f"/api/cart/items/{product_variant.id}/"
        response = api_client.patch(url, {"quantity": 5}, format="json")
        assert response.status_code == 200
        assert response.data["items"][0]["quantity"] == 5

    def test_update_to_zero_removes_item(self, api_client, product_variant):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 2},
            format="json",
        )
        url = f"/api/cart/items/{product_variant.id}/"
        response = api_client.patch(url, {"quantity": 0}, format="json")
        assert response.status_code == 200
        assert response.data["items"] == []

    def test_delete_item(self, api_client, product_variant):
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 2},
            format="json",
        )
        url = f"/api/cart/items/{product_variant.id}/"
        response = api_client.delete(url)
        assert response.status_code == 200
        assert response.data["items"] == []

    def test_clear_cart(self, api_client, product_variant, second_variant):
        for v in (product_variant, second_variant):
            api_client.post(
                self.items_url,
                {"variant_id": v.id, "quantity": 1},
                format="json",
            )
        response = api_client.delete("/api/cart/clear/")
        assert response.status_code == 200
        assert response.data["items"] == []


class TestAuthenticatedCart:
    list_url = "/api/cart/"
    items_url = "/api/cart/items/"

    def test_authenticated_user_has_separate_cart(
        self,
        api_client,
        product_variant,
        user,
    ):
        # Guest adds one item
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 1},
            format="json",
        )

        # Now authenticate and check cart is empty
        api_client.force_authenticate(user=user)
        response = api_client.get(self.list_url)
        assert response.data["items"] == []

    def test_merge_guest_cart_into_user(
        self,
        api_client,
        product_variant,
        user,
    ):
        # Guest adds item
        api_client.post(
            self.items_url,
            {"variant_id": product_variant.id, "quantity": 3},
            format="json",
        )

        # Authenticate and merge
        api_client.force_authenticate(user=user)
        merge_resp = api_client.post("/api/cart/merge/", format="json")
        assert merge_resp.status_code == 200
        assert len(merge_resp.data["items"]) == 1
        assert merge_resp.data["items"][0]["quantity"] == 3
