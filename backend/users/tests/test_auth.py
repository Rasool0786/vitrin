import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

pytestmark = pytest.mark.django_db


# =============================================================================
# Signup
# =============================================================================
class TestSignup:
    url = "/api/auth/signup/"

    def test_signup_success_returns_jwt(self, api_client):
        payload = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == 201
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == "new@example.com"
        assert User.objects.filter(username="newuser").exists()

    def test_signup_password_mismatch(self, api_client):
        payload = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "password_confirm": "WrongPass123!",
        }
        response = api_client.post(self.url, payload, format="json")
        assert response.status_code == 400
        assert "password_confirm" in response.data

    def test_signup_duplicate_email(self, api_client):
        User.objects.create_user(
            username="existing",
            email="dup@example.com",
            password="TestPass123!",
        )
        payload = {
            "username": "newuser",
            "email": "dup@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = api_client.post(self.url, payload, format="json")
        assert response.status_code == 400
        assert "email" in response.data

    def test_signup_duplicate_username(self, api_client):
        User.objects.create_user(
            username="taken",
            email="taken@example.com",
            password="TestPass123!",
        )
        payload = {
            "username": "taken",
            "email": "fresh@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = api_client.post(self.url, payload, format="json")
        assert response.status_code == 400
        assert "username" in response.data

    def test_signup_weak_password(self, api_client):
        payload = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "123",
            "password_confirm": "123",
        }
        response = api_client.post(self.url, payload, format="json")
        assert response.status_code == 400

    def test_signup_creates_profile(self, api_client):
        from users.models import Profile

        payload = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        api_client.post(self.url, payload, format="json")

        user = User.objects.get(username="newuser")
        assert Profile.objects.filter(user=user).exists()


# =============================================================================
# Login
# =============================================================================
class TestLogin:
    url = "/api/auth/login/"

    def test_login_with_username(self, api_client, user):
        response = api_client.post(
            self.url,
            {"identifier": user.username, "password": "TestPass123!"},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == user.email

    def test_login_with_email_case_insensitive(self, api_client, user):
        response = api_client.post(
            self.url,
            {"identifier": user.email.upper(), "password": "TestPass123!"},
            format="json",
        )
        assert response.status_code == 200

    def test_login_wrong_password(self, api_client, user):
        response = api_client.post(
            self.url,
            {"identifier": user.username, "password": "wrong"},
            format="json",
        )
        assert response.status_code == 400
        assert "detail" in response.data

    def test_login_inactive_user(self, api_client, user):
        user.is_active = False
        user.save(update_fields=["is_active"])
        response = api_client.post(
            self.url,
            {"identifier": user.username, "password": "TestPass123!"},
            format="json",
        )
        assert response.status_code == 403

    def test_login_unknown_user(self, api_client, db):
        response = api_client.post(
            self.url,
            {"identifier": "ghost", "password": "whatever"},
            format="json",
        )
        assert response.status_code == 400


# =============================================================================
# Refresh
# =============================================================================
class TestRefresh:
    url = "/api/auth/refresh/"

    def test_refresh_returns_new_access(self, api_client, user):
        login = api_client.post(
            "/api/auth/login/",
            {"identifier": user.username, "password": "TestPass123!"},
            format="json",
        )
        refresh = login.data["refresh"]

        response = api_client.post(
            self.url,
            {"refresh": refresh},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data

    def test_refresh_invalid_token(self, api_client):
        response = api_client.post(
            self.url,
            {"refresh": "not-a-real-token"},
            format="json",
        )
        assert response.status_code == 401


# =============================================================================
# Logout
# =============================================================================
class TestLogout:
    url = "/api/auth/logout/"

    def test_logout_blacklists_refresh(self, api_client, user):
        login = api_client.post(
            "/api/auth/login/",
            {"identifier": user.username, "password": "TestPass123!"},
            format="json",
        )
        refresh = login.data["refresh"]

        response = api_client.post(
            self.url,
            {"refresh": refresh},
            format="json",
        )
        assert response.status_code == 204

        refresh_resp = api_client.post(
            "/api/auth/refresh/",
            {"refresh": refresh},
            format="json",
        )
        assert refresh_resp.status_code == 401

    def test_logout_without_refresh_ok(self, api_client):
        response = api_client.post(self.url, {}, format="json")
        assert response.status_code == 204

    def test_logout_with_invalid_refresh_ok(self, api_client):
        response = api_client.post(
            self.url,
            {"refresh": "garbage"},
            format="json",
        )
        assert response.status_code == 204
