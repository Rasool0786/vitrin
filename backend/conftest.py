"""
Shared test fixtures for the Vitrin project.

Notes:
- Password hashing is switched to MD5 for speed.
- Throttles are disabled automatically in every test.
- Django cache is switched to LocMemCache (no real Redis required).
- The redis client inside cart.services is replaced with fakeredis.
"""

import pytest
from rest_framework.test import APIClient
from rest_framework.throttling import (
    AnonRateThrottle,
    ScopedRateThrottle,
    UserRateThrottle,
)

from users.models import CustomUser


# -----------------------------------------------------------------------------
# Autouse fixtures
# -----------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def _fast_password_hashers(settings):
    settings.PASSWORD_HASHERS = [
        "django.contrib.auth.hashers.MD5PasswordHasher",
    ]


@pytest.fixture(autouse=True)
def _locmem_cache(settings):
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "vitrin-test-cache",
        }
    }


@pytest.fixture(autouse=True)
def _disable_throttles(monkeypatch):
    def _allow(self, request, view):
        return True

    monkeypatch.setattr(AnonRateThrottle, "allow_request", _allow)
    monkeypatch.setattr(UserRateThrottle, "allow_request", _allow)
    monkeypatch.setattr(ScopedRateThrottle, "allow_request", _allow)


@pytest.fixture(autouse=True)
def _fake_redis(monkeypatch):
    """
    Replace the module-level redis client in cart.services with fakeredis.
    This lets cart/orders tests run without a real Redis server.
    """
    import fakeredis
    from cart import services as cart_services

    fake = fakeredis.FakeStrictRedis(decode_responses=True)
    monkeypatch.setattr(cart_services, "redis_client", fake)
    yield fake
    fake.flushall()


# -----------------------------------------------------------------------------
# Clients
# -----------------------------------------------------------------------------
@pytest.fixture
def api_client():
    return APIClient()


# -----------------------------------------------------------------------------
# Users
# -----------------------------------------------------------------------------
@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        username="testuser",
        email="testuser@example.com",
        password="TestPass123!",
    )


@pytest.fixture
def staff_user(db):
    return CustomUser.objects.create_user(
        username="staffuser",
        email="staff@example.com",
        password="StaffPass123!",
        is_staff=True,
    )


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    return api_client


# -----------------------------------------------------------------------------
# Products
# -----------------------------------------------------------------------------
@pytest.fixture
def category(db):
    from products.models import Category

    return Category.objects.create(name="Shoes")


@pytest.fixture
def color(db):
    from products.models import Color

    return Color.objects.create(name="Black", code="#000000")


@pytest.fixture
def size(db):
    from products.models import Size

    return Size.objects.create(name="42")


@pytest.fixture
def product(db, category):
    from products.models import Product

    return Product.objects.create(
        title="Running Shoe",
        description="A comfortable running shoe.",
        price=1000000,
        discount=0,
        category=category,
    )


@pytest.fixture
def discounted_product(db, category):
    from products.models import Product

    return Product.objects.create(
        title="Discounted Shoe",
        description="A shoe with 20 percent off.",
        price=1000000,
        discount=20,
        category=category,
    )


@pytest.fixture
def product_variant(db, product, color, size):
    from products.models import ProductVariant

    return ProductVariant.objects.create(
        product=product,
        color=color,
        size=size,
        stock=10,
    )


@pytest.fixture
def second_variant(db, product, color):
    from products.models import ProductVariant, Size

    other_size = Size.objects.create(name="43")
    return ProductVariant.objects.create(
        product=product,
        color=color,
        size=other_size,
        stock=5,
    )


@pytest.fixture
def published_comment(db, product):
    from products.models import Comment

    return Comment.objects.create(
        product=product,
        name="Alice",
        text="Great shoe!",
        stars=5,
        is_published=True,
    )


@pytest.fixture
def unpublished_comment(db, product):
    from products.models import Comment

    return Comment.objects.create(
        product=product,
        name="Bob",
        text="Waiting for approval.",
        stars=4,
        is_published=False,
    )
