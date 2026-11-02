import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestMe:
    url = "/api/me/"

    # -------------------- GET --------------------
    def test_get_requires_auth(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code in (401, 403)

    def test_get_returns_profile(self, authenticated_client, user):
        response = authenticated_client.get(self.url)
        assert response.status_code == 200
        assert response.data["email"] == user.email
        assert response.data["username"] == user.username

    # -------------------- PATCH --------------------
    def test_patch_updates_email(self, authenticated_client, user):
        response = authenticated_client.patch(
            self.url,
            {"email": "updated@example.com"},
            format="json",
        )
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email == "updated@example.com"

    def test_patch_duplicate_email_rejected(
        self, authenticated_client, user, db
    ):
        User.objects.create_user(
            username="other",
            email="other@example.com",
            password="Pass123!",
        )
        response = authenticated_client.patch(
            self.url,
            {"email": "other@example.com"},
            format="json",
        )
        assert response.status_code == 400
        assert "email" in response.data

    def test_patch_updates_full_name(self, authenticated_client):
        response = authenticated_client.patch(
            self.url,
            {"full_name": "Ali Rezaei"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["full_name"] == "Ali Rezaei"

    def test_patch_username_is_readonly(self, authenticated_client, user):
        original = user.username
        response = authenticated_client.patch(
            self.url,
            {"username": "hacker"},
            format="json",
        )
        user.refresh_from_db()
        assert user.username == original
