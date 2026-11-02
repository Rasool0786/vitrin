import pytest

from products.models import Product

pytestmark = pytest.mark.django_db


class TestProductList:
    url = "/api/products/"

    def test_list_is_public(self, api_client, product):
        response = api_client.get(self.url)
        assert response.status_code == 200
        results = response.data["results"]
        assert len(results) == 1
        assert results[0]["title"] == "Running Shoe"

    def test_list_shows_final_price(self, api_client, discounted_product):
        response = api_client.get(self.url)
        results = response.data["results"]
        assert len(results) == 1
        # 1000000 with 20 percent off -> 800000
        assert results[0]["final_price"] == "800000.00"

    def test_list_pagination(self, api_client, category):
        for i in range(15):
            Product.objects.create(
                title=f"Product {i}",
                description="Desc",
                price=1000,
                discount=0,
                category=category,
            )

        response = api_client.get(self.url)
        assert response.status_code == 200
        assert response.data["count"] == 15
        assert len(response.data["results"]) == 12
        assert response.data["next"] is not None

    def test_list_search_by_title(self, api_client, category, product):
        Product.objects.create(
            title="Leather Boot",
            description="Boots",
            price=500000,
            discount=0,
            category=category,
        )
        response = api_client.get(self.url, {"search": "running"})
        results = response.data["results"]
        assert len(results) == 1
        assert results[0]["title"] == "Running Shoe"

    def test_list_filter_by_category(self, api_client, product, category):
        from products.models import Category

        other_cat = Category.objects.create(name="Bags")
        Product.objects.create(
            title="Travel Bag",
            description="A bag",
            price=500000,
            discount=0,
            category=other_cat,
        )
        response = api_client.get(self.url, {"category": category.id})
        results = response.data["results"]
        titles = [r["title"] for r in results]
        assert "Running Shoe" in titles
        assert "Travel Bag" not in titles


class TestProductDetail:
    def _url(self, product):
        return f"/api/products/{product.slug}/"

    def test_detail_is_public(self, api_client, product):
        response = api_client.get(self._url(product))
        assert response.status_code == 200
        assert response.data["title"] == product.title
        assert response.data["description"] == product.description

    def test_detail_includes_variants(self, api_client, product, product_variant):
        response = api_client.get(self._url(product))
        assert response.status_code == 200
        assert len(response.data["variants"]) == 1
        assert response.data["variants"][0]["stock"] == 10

    def test_detail_available_colors_only_in_stock(
        self, api_client, product, product_variant, color
    ):
        from products.models import Color, ProductVariant, Size

        sold_out_color = Color.objects.create(name="Red", code="#FF0000")
        sold_out_size = Size.objects.create(name="44")
        ProductVariant.objects.create(
            product=product,
            color=sold_out_color,
            size=sold_out_size,
            stock=0,
        )
        response = api_client.get(self._url(product))
        colors = [c["name"] for c in response.data["available_colors"]]
        assert "Black" in colors
        assert "Red" not in colors

    def test_detail_404_unknown_slug(self, api_client):
        response = api_client.get("/api/products/unknown-slug/")
        assert response.status_code == 404


class TestProductWrite:
    url = "/api/products/"

    def _payload(self, category):
        return {
            "title": "New Product",
            "description": "Brand new",
            "price": 500000,
            "discount": 10,
            "category_id": category.id,
        }

    def test_anonymous_cannot_create(self, api_client, category):
        response = api_client.post(
            self.url, self._payload(category), format="json"
        )
        assert response.status_code in (401, 403)

    def test_authenticated_non_staff_cannot_create(
        self, authenticated_client, category
    ):
        response = authenticated_client.post(
            self.url, self._payload(category), format="json"
        )
        assert response.status_code == 403

    def test_staff_can_create(self, staff_client, category):
        response = staff_client.post(
            self.url, self._payload(category), format="json"
        )
        assert response.status_code == 201
        assert response.data["title"] == "New Product"

    def test_staff_create_auto_generates_slug(self, staff_client, category):
        payload = self._payload(category)
        payload["title"] = "Test Slug Product"
        response = staff_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        assert response.data["slug"] == "test-slug-product"

    def test_non_staff_cannot_update(
        self, authenticated_client, product
    ):
        response = authenticated_client.patch(
            f"/api/products/{product.slug}/",
            {"title": "Hacked"},
            format="json",
        )
        assert response.status_code == 403

    def test_staff_can_update(self, staff_client, product):
        response = staff_client.patch(
            f"/api/products/{product.slug}/",
            {"title": "Updated Title"},
            format="json",
        )
        assert response.status_code == 200
        product.refresh_from_db()
        assert product.title == "Updated Title"

    def test_staff_can_delete(self, staff_client, product):
        response = staff_client.delete(f"/api/products/{product.slug}/")
        assert response.status_code == 204
        assert not Product.objects.filter(pk=product.pk).exists()
