from unittest import mock

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from users.models import CustomUser
from products.models import (
    Category,
    Color,
    Size,
    Product,
    ProductVariant,
)
from .models import Order, OrderItem
from .services import create_order, cancel_order


# =========================================================
# Helpers
# =========================================================
def make_shipping():
    return {
        "full_name": "Ali Rezaei",
        "phone": "09121234567",
        "address": "Tehran, ...",
        "city": "Tehran",
        "postal_code": "1234567890",
        "note": "",
    }


def make_items(*pairs):
    """make_items((variant_id, qty), ...)"""
    return [{"variant_id": vid, "quantity": qty} for vid, qty in pairs]


# =========================================================
# Base setup
# =========================================================
class BaseSetUpMixin:
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="T-Shirts")
        cls.color_blue = Color.objects.create(name="Blue", code="#0000FF")
        cls.color_red = Color.objects.create(name="Red", code="#FF0000")
        cls.size_s = Size.objects.create(name="S")
        cls.size_m = Size.objects.create(name="M")

        # product: price=100_000, discount=10% -> final_price = 90_000
        cls.product = Product.objects.create(
            title="Sponge Bob T-Shirt",
            description="x",
            price=100_000,
            discount=10,
            category=cls.category,
        )

        cls.variant_blue_s = ProductVariant.objects.create(
            product=cls.product,
            color=cls.color_blue,
            size=cls.size_s,
            stock=9,
        )
        cls.variant_red_m = ProductVariant.objects.create(
            product=cls.product,
            color=cls.color_red,
            size=cls.size_m,
            stock=10,
        )

        cls.user = CustomUser.objects.create_user(username="buyer", password="pass1234")
        cls.other_user = CustomUser.objects.create_user(
            username="other", password="pass1234"
        )
        cls.staff_user = CustomUser.objects.create_user(
            username="admin", password="pass1234", is_staff=True
        )


# =========================================================
# MODEL TESTS
# =========================================================
class OrderModelTests(BaseSetUpMixin, TestCase):
    def test_order_code_auto_generated(self):
        order = Order.objects.create(user=self.user, **make_shipping())
        self.assertTrue(order.order_code)
        self.assertTrue(order.order_code.startswith("ORD-"))
        parts = order.order_code.split("-")
        self.assertEqual(len(parts), 3)

    def test_order_code_unique(self):
        o1 = Order.objects.create(user=self.user, **make_shipping())
        o2 = Order.objects.create(user=self.user, **make_shipping())
        self.assertNotEqual(o1.order_code, o2.order_code)

    def test_order_code_not_overwritten(self):
        order = Order.objects.create(
            user=self.user, order_code="CUSTOM-001", **make_shipping()
        )
        order.save()
        self.assertEqual(order.order_code, "CUSTOM-001")

    def test_default_status_pending(self):
        order = Order.objects.create(user=self.user, **make_shipping())
        self.assertEqual(order.status, Order.Status.PENDING)

    def test_items_count(self):
        order = Order.objects.create(user=self.user, **make_shipping())
        OrderItem.objects.create(
            order=order,
            variant=self.variant_blue_s,
            product_title="T",
            color_name="Blue",
            size_name="S",
            unit_price=90_000,
            quantity=3,
        )
        OrderItem.objects.create(
            order=order,
            variant=self.variant_red_m,
            product_title="T",
            color_name="Red",
            size_name="M",
            unit_price=90_000,
            quantity=2,
        )
        self.assertEqual(order.items_count, 5)

    def test_ordering_by_datetime_created_desc(self):
        o1 = Order.objects.create(user=self.user, **make_shipping())
        o2 = Order.objects.create(user=self.user, **make_shipping())
        orders = list(Order.objects.all())
        self.assertEqual(orders[0], o2)
        self.assertEqual(orders[1], o1)

    def test_str(self):
        order = Order.objects.create(user=self.user, **make_shipping())
        self.assertEqual(str(order), order.order_code)

    def test_guest_order_allowed(self):
        order = Order.objects.create(user=None, **make_shipping())
        self.assertIsNone(order.user)


class OrderItemModelTests(BaseSetUpMixin, TestCase):
    def setUp(self):
        self.order = Order.objects.create(user=self.user, **make_shipping())

    def test_line_total_computed_on_save(self):
        item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant_blue_s,
            product_title="T",
            color_name="Blue",
            size_name="S",
            unit_price=90_000,
            quantity=3,
        )
        self.assertEqual(item.line_total, 270_000)

    def test_line_total_updated_on_resave(self):
        item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant_blue_s,
            product_title="T",
            color_name="Blue",
            size_name="S",
            unit_price=90_000,
            quantity=3,
        )
        item.quantity = 5
        item.save()
        self.assertEqual(item.line_total, 450_000)

    def test_unique_variant_per_order(self):
        OrderItem.objects.create(
            order=self.order,
            variant=self.variant_blue_s,
            product_title="T",
            color_name="Blue",
            size_name="S",
            unit_price=90_000,
            quantity=1,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                OrderItem.objects.create(
                    order=self.order,
                    variant=self.variant_blue_s,
                    product_title="T",
                    color_name="Blue",
                    size_name="S",
                    unit_price=90_000,
                    quantity=1,
                )

    def test_snapshots_saved(self):
        item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant_blue_s,
            product_title="Snapshot Title",
            color_name="Snapshot Color",
            size_name="Snapshot Size",
            unit_price=90_000,
            quantity=1,
        )
        self.assertEqual(item.product_title, "Snapshot Title")
        self.assertEqual(item.color_name, "Snapshot Color")
        self.assertEqual(item.size_name, "Snapshot Size")

    def test_variant_protected_from_deletion(self):
        OrderItem.objects.create(
            order=self.order,
            variant=self.variant_blue_s,
            product_title="T",
            color_name="Blue",
            size_name="S",
            unit_price=90_000,
            quantity=1,
        )
        with self.assertRaises(Exception):  # ProtectedError
            self.variant_blue_s.delete()

    def test_str(self):
        item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant_blue_s,
            product_title="T-Shirt",
            color_name="Blue",
            size_name="S",
            unit_price=90_000,
            quantity=3,
        )
        self.assertIn("T-Shirt", str(item))
        self.assertIn("3", str(item))


# =========================================================
# create_order SERVICE TESTS
# =========================================================
class CreateOrderServiceTests(BaseSetUpMixin, TestCase):
    def test_happy_path(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.user, self.user)

    def test_empty_cart_raises(self):
        with self.assertRaises(ValidationError):
            create_order(
                user=self.user,
                cart_items=[],
                shipping_data=make_shipping(),
            )

    def test_missing_variant_raises(self):
        with self.assertRaises(ValidationError):
            create_order(
                user=self.user,
                cart_items=make_items((99999, 1)),
                shipping_data=make_shipping(),
            )

    def test_insufficient_stock_raises(self):
        with self.assertRaises(ValidationError):
            create_order(
                user=self.user,
                cart_items=make_items((self.variant_blue_s.id, 100)),
                shipping_data=make_shipping(),
            )

    def test_zero_quantity_raises(self):
        with self.assertRaises(ValidationError):
            create_order(
                user=self.user,
                cart_items=make_items((self.variant_blue_s.id, 0)),
                shipping_data=make_shipping(),
            )

    def test_negative_quantity_raises(self):
        with self.assertRaises(ValidationError):
            create_order(
                user=self.user,
                cart_items=make_items((self.variant_blue_s.id, -1)),
                shipping_data=make_shipping(),
            )

    def test_stock_decremented(self):
        create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 3)),
            shipping_data=make_shipping(),
        )
        self.variant_blue_s.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 6)

    def test_multiple_items_stock_decremented(self):
        create_order(
            user=self.user,
            cart_items=make_items(
                (self.variant_blue_s.id, 2),
                (self.variant_red_m.id, 5),
            ),
            shipping_data=make_shipping(),
        )
        self.variant_blue_s.refresh_from_db()
        self.variant_red_m.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 7)
        self.assertEqual(self.variant_red_m.stock, 5)

    def test_totals_calculated(self):
        # final_price = 90_000
        order = create_order(
            user=self.user,
            cart_items=make_items(
                (self.variant_blue_s.id, 2),  # 180_000
                (self.variant_red_m.id, 1),  #  90_000
            ),
            shipping_data=make_shipping(),
        )
        self.assertEqual(order.subtotal, 270_000)
        self.assertEqual(order.discount_amount, 0)
        self.assertEqual(order.total_price, 270_000)

    def test_unit_price_snapshots_final_price(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        item = order.items.first()
        self.assertEqual(item.unit_price, 90_000)

    def test_snapshots_stored_in_order_item(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        item = order.items.first()
        self.assertEqual(item.product_title, self.product.title)
        self.assertEqual(item.color_name, self.color_blue.name)
        self.assertEqual(item.size_name, self.size_s.name)

    def test_atomic_on_failure_rolls_back_everything(self):
        stock_blue_before = self.variant_blue_s.stock
        stock_red_before = self.variant_red_m.stock

        with self.assertRaises(ValidationError):
            create_order(
                user=self.user,
                cart_items=make_items(
                    (self.variant_blue_s.id, 2),  # ok
                    (self.variant_red_m.id, 99999),  # too many
                ),
                shipping_data=make_shipping(),
            )

        self.assertEqual(Order.objects.count(), 0)

        self.variant_blue_s.refresh_from_db()
        self.variant_red_m.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, stock_blue_before)
        self.assertEqual(self.variant_red_m.stock, stock_red_before)

    def test_atomic_when_db_error_midway(self):
        with mock.patch(
            "orders.services.OrderItem.objects.create",
            side_effect=[None, RuntimeError("boom")],
        ):
            with self.assertRaises(RuntimeError):
                create_order(
                    user=self.user,
                    cart_items=make_items(
                        (self.variant_blue_s.id, 1),
                        (self.variant_red_m.id, 1),
                    ),
                    shipping_data=make_shipping(),
                )

        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)
        self.variant_blue_s.refresh_from_db()
        self.variant_red_m.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 9)
        self.assertEqual(self.variant_red_m.stock, 10)

    def test_guest_order(self):
        order = create_order(
            user=None,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        self.assertIsNone(order.user)

    def test_coupon_code_snapshot_saved(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
            coupon_code="SUMMER10",
        )
        self.assertEqual(order.coupon_code, "SUMMER10")


# =========================================================
# cancel_order SERVICE TESTS
# =========================================================
class CancelOrderServiceTests(BaseSetUpMixin, TestCase):
    def _create(self, qty=2):
        return create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, qty)),
            shipping_data=make_shipping(),
        )

    def test_cancel_restores_stock(self):
        order = self._create(qty=3)
        self.variant_blue_s.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 6)

        cancel_order(order=order)

        self.variant_blue_s.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 9)

    def test_cancel_restores_multiple_items(self):
        order = create_order(
            user=self.user,
            cart_items=make_items(
                (self.variant_blue_s.id, 2),
                (self.variant_red_m.id, 4),
            ),
            shipping_data=make_shipping(),
        )
        cancel_order(order=order)
        self.variant_blue_s.refresh_from_db()
        self.variant_red_m.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 9)
        self.assertEqual(self.variant_red_m.stock, 10)

    def test_cancel_sets_status(self):
        order = self._create()
        cancel_order(order=order)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)

    def test_cancel_already_cancelled_raises(self):
        order = self._create()
        cancel_order(order=order)
        with self.assertRaises(ValidationError):
            cancel_order(order=order)

    def test_cannot_cancel_shipped(self):
        order = self._create()
        order.status = Order.Status.SHIPPED
        order.save(update_fields=["status"])
        with self.assertRaises(ValidationError):
            cancel_order(order=order)

    def test_cannot_cancel_delivered(self):
        order = self._create()
        order.status = Order.Status.DELIVERED
        order.save(update_fields=["status"])
        with self.assertRaises(ValidationError):
            cancel_order(order=order)

    def test_cancel_paid_order_allowed(self):
        order = self._create()
        order.status = Order.Status.PAID
        order.save(update_fields=["status"])
        cancel_order(order=order)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)


# =========================================================
# API TESTS
# =========================================================
class OrderAPITests(BaseSetUpMixin, APITestCase):
    def _payload(self, *pairs, **extra):
        payload = {
            "items": make_items(*pairs),
            "full_name": "Ali",
            "phone": "09121234567",
            "address": "Tehran",
        }
        payload.update(extra)
        return payload

    # ----- AUTH -----
    def test_create_requires_auth(self):
        res = self.client.post(
            "/api/orders/",
            self._payload((self.variant_blue_s.id, 1)),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_requires_auth(self):
        res = self.client.get("/api/orders/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ----- CREATE -----
    def test_create_happy_path(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(
            "/api/orders/",
            self._payload((self.variant_blue_s.id, 2)),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("order_code", res.data)
        self.assertEqual(res.data["status"], Order.Status.PENDING)
        self.assertEqual(len(res.data["items"]), 1)
        self.assertEqual(res.data["total_price"], 180_000)

    def test_create_decrements_stock(self):
        self.client.force_authenticate(self.user)
        self.client.post(
            "/api/orders/",
            self._payload((self.variant_blue_s.id, 3)),
            format="json",
        )
        self.variant_blue_s.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 6)

    def test_create_insufficient_stock_returns_400(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(
            "/api/orders/",
            self._payload((self.variant_blue_s.id, 999)),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_empty_items_returns_400(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(
            "/api/orders/",
            {
                "items": [],
                "full_name": "Ali",
                "phone": "09121234567",
                "address": "Tehran",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_shipping_returns_400(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(
            "/api/orders/",
            {"items": make_items((self.variant_blue_s.id, 1))},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_coupon_code(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(
            "/api/orders/",
            self._payload((self.variant_blue_s.id, 1), coupon_code="X10"),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["coupon_code"], "X10")

    # ----- LIST -----
    def test_list_only_own_orders(self):
        create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        create_order(
            user=self.other_user,
            cart_items=make_items((self.variant_red_m.id, 1)),
            shipping_data=make_shipping(),
        )
        self.client.force_authenticate(self.user)
        res = self.client.get("/api/orders/")
        self.assertEqual(res.data["count"], 1)

    def test_staff_sees_all_orders(self):
        create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        create_order(
            user=self.other_user,
            cart_items=make_items((self.variant_red_m.id, 1)),
            shipping_data=make_shipping(),
        )
        self.client.force_authenticate(self.staff_user)
        res = self.client.get("/api/orders/")
        self.assertEqual(res.data["count"], 2)

    # ----- DETAIL -----
    def test_retrieve_own_order(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        self.client.force_authenticate(self.user)
        res = self.client.get(f"/api/orders/{order.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["order_code"], order.order_code)

    def test_cannot_retrieve_other_users_order(self):
        order = create_order(
            user=self.other_user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        self.client.force_authenticate(self.user)
        res = self.client.get(f"/api/orders/{order.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_can_retrieve_any_order(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        self.client.force_authenticate(self.staff_user)
        res = self.client.get(f"/api/orders/{order.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    # ----- CANCEL -----
    def test_cancel_own_order(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 2)),
            shipping_data=make_shipping(),
        )
        self.client.force_authenticate(self.user)
        res = self.client.post(f"/api/orders/{order.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)

    def test_cancel_restores_stock_via_api(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 3)),
            shipping_data=make_shipping(),
        )
        self.variant_blue_s.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 6)

        self.client.force_authenticate(self.user)
        self.client.post(f"/api/orders/{order.id}/cancel/")

        self.variant_blue_s.refresh_from_db()
        self.assertEqual(self.variant_blue_s.stock, 9)

    def test_cannot_cancel_other_users_order(self):
        order = create_order(
            user=self.other_user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        self.client.force_authenticate(self.user)
        res = self.client.post(f"/api/orders/{order.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cancel_requires_auth(self):
        order = create_order(
            user=self.user,
            cart_items=make_items((self.variant_blue_s.id, 1)),
            shipping_data=make_shipping(),
        )
        res = self.client.post(f"/api/orders/{order.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ----- JWT -----
    def test_jwt_auth_works_for_create(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        token = str(RefreshToken.for_user(self.user).access_token)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = client.post(
            "/api/orders/",
            self._payload((self.variant_blue_s.id, 1)),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
