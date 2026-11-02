import pytest
from django.contrib.auth import get_user_model

from users.models import Address

User = get_user_model()

pytestmark = pytest.mark.django_db


BASE_PAYLOAD = {
    "title": "Home",
    "full_name": "Ali Rezaei",
    "phone": "09120000000",
    "province": "Tehran",
    "city": "Tehran",
    "postal_code": "1234567890",
    "address": "Somewhere in Tehran",
}


class TestAddressCRUD:
    url = "/api/addresses/"

    def test_requires_auth(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code in (401, 403)

    def test_create_first_address_becomes_default(self, authenticated_client):
        response = authenticated_client.post(
            self.url, BASE_PAYLOAD, format="json"
        )
        assert response.status_code == 201
        assert response.data["is_default"] is True

    def test_create_second_address_not_default(self, authenticated_client, user):
        Address.objects.create(
            user=user, is_default=True, **BASE_PAYLOAD
        )

        payload = {**BASE_PAYLOAD, "title": "Office"}
        response = authenticated_client.post(
            self.url, payload, format="json"
        )
        assert response.status_code == 201
        assert response.data["is_default"] is False

    def test_create_explicit_default_clears_previous(
        self, authenticated_client, user
    ):
        first = Address.objects.create(
            user=user, is_default=True, **BASE_PAYLOAD
        )

        payload = {**BASE_PAYLOAD, "title": "Office", "is_default": True}
        response = authenticated_client.post(
            self.url, payload, format="json"
        )
        assert response.status_code == 201

        first.refresh_from_db()
        assert first.is_default is False

    def test_list_only_own_addresses(self, authenticated_client, user):
        other = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="Pass123!",
        )
        Address.objects.create(user=user, **BASE_PAYLOAD)
        Address.objects.create(
            user=other, **{**BASE_PAYLOAD, "title": "Other's Home"}
        )

        response = authenticated_client.get(self.url)
        assert response.status_code == 200

        results = response.data.get("results", response.data)
        titles = [a["title"] for a in results]
        assert "Home" in titles
        assert "Other's Home" not in titles

    def test_update_address(self, authenticated_client, user):
        addr = Address.objects.create(user=user, **BASE_PAYLOAD)

        response = authenticated_client.patch(
            f"{self.url}{addr.id}/",
            {"title": "New Title"},
            format="json",
        )
        assert response.status_code == 200
        addr.refresh_from_db()
        assert addr.title == "New Title"

    def test_delete_address(self, authenticated_client, user):
        addr = Address.objects.create(user=user, **BASE_PAYLOAD)

        response = authenticated_client.delete(f"{self.url}{addr.id}/")
        assert response.status_code == 204
        assert not Address.objects.filter(id=addr.id).exists()

    def test_cannot_access_other_users_address(
        self, authenticated_client, user
    ):
        other = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="Pass123!",
        )
        other_addr = Address.objects.create(
            user=other, **{**BASE_PAYLOAD, "title": "Other"}
        )

        response = authenticated_client.get(
            f"{self.url}{other_addr.id}/"
        )
        assert response.status_code == 404
