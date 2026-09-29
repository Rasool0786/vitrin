from decimal import Decimal
import io
import shutil
import tempfile

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from PIL import Image
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient, APITestCase

from users.models import CustomUser
from .models import (
    Category,
    Color,
    Size,
    Product,
    ProductImage,
    Comment,
    ProductVariant,
)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def create_test_image(name="test.png", size=(100, 100), color="red"):
    file = io.BytesIO()
    image = Image.new("RGB", size, color=color)
    image.save(file, "PNG")
    file.seek(0)
    return SimpleUploadedFile(name, file.read(), content_type="image/png")


def get_jwt_access_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


class MediaRootMixin:
    """Per-class temporary MEDIA_ROOT, cleaned up afterwards."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._temp_media = tempfile.mkdtemp()
        cls._media_override = override_settings(MEDIA_ROOT=cls._temp_media)
        cls._media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._media_override.disable()
        shutil.rmtree(cls._temp_media, ignore_errors=True)
        super().tearDownClass()


# ---------------------------------------------------------
# Base test data
# ---------------------------------------------------------
class BaseSetUpMixin:
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="T-Shirts")
        cls.color_blue = Color.objects.create(name="Blue", code="#0000FF")
        cls.color_red = Color.objects.create(name="Red", code="#FF0000")
        cls.size_s = Size.objects.create(name="S")
        cls.size_m = Size.objects.create(name="M")

        cls.product = Product.objects.create(
            title="Sponge Bob T-Shirt",
            description="A very nice t-shirt",
            price=Decimal("100000.00"),
            discount=Decimal("10.00"),
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

        cls.staff_user = CustomUser.objects.create_user(
            username="admin",
            password="pass1234",
            is_staff=True,
        )
        cls.normal_user = CustomUser.objects.create_user(
            username="user",
            password="pass1234",
        )


class APIBaseMixin(BaseSetUpMixin):
    """Base mixin for API tests. Clears cache in setUp to avoid throttle pollution."""

    def setUp(self):
        super().setUp()
        cache.clear()


# =========================================================
# MODEL TESTS
# =========================================================
class CategoryModelTests(BaseSetUpMixin, TestCase):
    def test_slug_auto_generated_from_name(self):
        cat = Category.objects.create(name="Winter Clothes")
        self.assertEqual(cat.slug, "winter-clothes")

    def test_slug_respects_unicode(self):
        cat = Category.objects.create(name="لباس زمستانی")
        self.assertTrue(cat.slug)
        self.assertIn("لباس", cat.slug)

    def test_slug_not_overwritten_if_provided(self):
        cat = Category.objects.create(name="Shoes", slug="custom-slug")
        self.assertEqual(cat.slug, "custom-slug")

    def test_slug_updated_on_second_save_only_if_changed(self):
        cat = Category.objects.create(name="Hats")
        first_slug = cat.slug
        cat.name = "Caps"
        cat.save()
        self.assertEqual(cat.slug, first_slug)

    def test_parent_relationship(self):
        parent = Category.objects.create(name="Parent Cat")
        child = Category.objects.create(name="Child Cat", parent=parent)
        self.assertIn(child, parent.children.all())

    def test_delete_parent_sets_null(self):
        parent = Category.objects.create(name="Parent Cat 2")
        child = Category.objects.create(name="Child Cat 2", parent=parent)
        parent.delete()
        child.refresh_from_db()
        self.assertIsNone(child.parent)

    def test_str(self):
        self.assertEqual(str(self.category), "T-Shirts")


class ProductModelTests(BaseSetUpMixin, TestCase):
    def test_slug_auto_generated_from_title(self):
        p = Product.objects.create(
            title="Cool Hoodie",
            description="x",
            price=Decimal("50000"),
            category=self.category,
        )
        self.assertEqual(p.slug, "cool-hoodie")

    def test_final_price_with_discount(self):
        self.assertEqual(self.product.final_price, Decimal("90000.00"))

    def test_final_price_without_discount(self):
        self.product.discount = Decimal("0")
        self.product.save()
        self.assertEqual(self.product.final_price, self.product.price)

    def test_final_price_with_full_discount(self):
        self.product.discount = Decimal("100")
        self.product.save()
        self.assertEqual(self.product.final_price, Decimal("0.00"))

    def test_discount_max_validation(self):
        from django.core.exceptions import ValidationError

        self.product.discount = Decimal("150")
        with self.assertRaises(ValidationError):
            self.product.full_clean()

    def test_price_negative_validation(self):
        from django.core.exceptions import ValidationError

        self.product.price = Decimal("-1")
        with self.assertRaises(ValidationError):
            self.product.full_clean()

    def test_str(self):
        self.assertEqual(str(self.product), "Sponge Bob T-Shirt")

    def test_ordering_by_datetime_created_desc(self):
        p2 = Product.objects.create(
            title="Another",
            description="x",
            price=Decimal("10"),
            category=self.category,
        )
        products = list(Product.objects.all())
        self.assertEqual(products[0], p2)
        self.assertEqual(products[-1], self.product)


class ProductImageModelTests(MediaRootMixin, BaseSetUpMixin, TestCase):
    def test_main_image_none_when_no_images(self):
        self.assertIsNone(self.product.main_image)

    def test_main_image_returns_first_image(self):
        ProductImage.objects.create(
            product=self.product, image=create_test_image("first.png")
        )
        ProductImage.objects.create(
            product=self.product, image=create_test_image("second.png")
        )
        self.assertIsNotNone(self.product.main_image)
        self.assertIn("first", self.product.main_image.name)

    def test_upload_path_includes_product_slug(self):
        img = ProductImage.objects.create(
            product=self.product, image=create_test_image()
        )
        self.assertIn(f"products/{self.product.slug}/", img.image.name)

    def test_str_contains_product_title(self):
        img = ProductImage.objects.create(
            product=self.product, image=create_test_image()
        )
        self.assertIn(self.product.title, str(img))


class ProductVariantModelTests(BaseSetUpMixin, TestCase):
    def test_unique_variant_per_product(self):
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            ProductVariant.objects.create(
                product=self.product,
                color=self.color_blue,
                size=self.size_s,
                stock=5,
            )

    def test_same_color_size_allowed_on_different_products(self):
        p2 = Product.objects.create(
            title="Other",
            description="x",
            price=Decimal("10"),
            category=self.category,
        )
        v = ProductVariant.objects.create(
            product=p2,
            color=self.color_blue,
            size=self.size_s,
            stock=5,
        )
        self.assertEqual(v.stock, 5)

    def test_str(self):
        s = str(self.variant_blue_s)
        self.assertIn("Sponge Bob T-Shirt", s)
        self.assertIn("Blue", s)
        self.assertIn("S", s)

    def test_default_stock_zero(self):
        v = ProductVariant.objects.create(
            product=self.product,
            color=self.color_red,
            size=self.size_s,
        )
        self.assertEqual(v.stock, 0)

    def test_negative_stock_not_allowed(self):
        from django.db import IntegrityError, transaction

        with self.assertRaises((IntegrityError, ValueError)):
            with transaction.atomic():
                ProductVariant.objects.create(
                    product=self.product,
                    color=self.color_red,
                    size=self.size_s,
                    stock=-1,
                )


class CommentModelTests(BaseSetUpMixin, TestCase):
    def test_default_is_published_false(self):
        c = Comment.objects.create(
            product=self.product, name="Ali", text="Nice!", stars=5
        )
        self.assertFalse(c.is_published)

    def test_stars_default_five(self):
        c = Comment.objects.create(product=self.product, name="Ali", text="Nice!")
        self.assertEqual(c.stars, 5)

    def test_str(self):
        c = Comment.objects.create(
            product=self.product, name="Ali", text="Nice!", stars=4
        )
        self.assertIn("Ali", str(c))
        self.assertIn(self.product.title, str(c))

    def test_stars_validation_above_max(self):
        from django.core.exceptions import ValidationError

        c = Comment(product=self.product, name="Ali", text="x", stars=6)
        with self.assertRaises(ValidationError):
            c.full_clean()

    def test_stars_validation_below_min(self):
        from django.core.exceptions import ValidationError

        c = Comment(product=self.product, name="Ali", text="x", stars=0)
        with self.assertRaises(ValidationError):
            c.full_clean()

    def test_ordering_newest_first(self):
        c1 = Comment.objects.create(product=self.product, name="A", text="x", stars=5)
        c2 = Comment.objects.create(product=self.product, name="B", text="x", stars=5)
        comments = list(Comment.objects.all())
        self.assertEqual(comments[0], c2)
        self.assertEqual(comments[1], c1)


# =========================================================
# CATEGORY API
# =========================================================
class CategoryAPITests(APIBaseMixin, APITestCase):
    def test_list_public(self):
        res = self.client.get("/api/categories/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_detail_by_slug(self):
        res = self.client.get(f"/api/categories/{self.category.slug}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], self.category.name)

    def test_retrieve_by_id_returns_404(self):
        res = self.client.get(f"/api/categories/{self.category.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_anonymous_forbidden(self):
        res = self.client.post("/api/categories/", {"name": "New"})
        self.assertIn(res.status_code, (401, 403))

    def test_create_as_staff(self):
        self.client.force_authenticate(self.staff_user)
        res = self.client.post("/api/categories/", {"name": "New Cat"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["slug"], "new-cat")

    def test_delete_requires_staff(self):
        self.client.force_authenticate(self.normal_user)
        res = self.client.delete(f"/api/categories/{self.category.slug}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_search(self):
        Category.objects.create(name="Winter Clothes")
        res = self.client.get("/api/categories/?search=Winter")
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["name"], "Winter Clothes")


# =========================================================
# COLOR / SIZE API
# =========================================================
class ColorSizeAPITests(APIBaseMixin, APITestCase):
    def test_colors_list(self):
        res = self.client.get("/api/colors/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_sizes_list(self):
        res = self.client.get("/api/sizes/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_create_color_as_staff(self):
        self.client.force_authenticate(self.staff_user)
        res = self.client.post("/api/colors/", {"name": "Green", "code": "#00FF00"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_color_anonymous_forbidden(self):
        res = self.client.post("/api/colors/", {"name": "Green"})
        self.assertIn(res.status_code, (401, 403))


# =========================================================
# PRODUCT API
# =========================================================
class ProductAPITests(APIBaseMixin, APITestCase):
    def test_list_products(self):
        res = self.client.get("/api/products/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)

    def test_list_excludes_heavy_fields(self):
        res = self.client.get("/api/products/")
        item = res.data["results"][0]
        self.assertNotIn("description", item)
        self.assertNotIn("variants", item)
        self.assertNotIn("images", item)

    def test_detail_by_slug(self):
        res = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], self.product.title)
        for key in (
            "final_price",
            "variants",
            "images",
            "comments",
            "available_colors",
            "available_sizes",
        ):
            self.assertIn(key, res.data)

    def test_final_price_in_response(self):
        res = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertEqual(Decimal(res.data["final_price"]), Decimal("90000.00"))

    def test_average_rating_only_published(self):
        Comment.objects.create(
            product=self.product, name="A", text="x", stars=5, is_published=True
        )
        Comment.objects.create(
            product=self.product, name="B", text="x", stars=1, is_published=False
        )
        res = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertEqual(res.data["comments_count"], 1)
        self.assertEqual(res.data["average_rating"], 5.0)

    def test_average_rating_none_when_no_published(self):
        res = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertIsNone(res.data["average_rating"])
        self.assertEqual(res.data["comments_count"], 0)

    def test_available_colors_excludes_out_of_stock(self):
        ProductVariant.objects.filter(id=self.variant_blue_s.id).update(stock=0)
        res = self.client.get(f"/api/products/{self.product.slug}/")
        color_names = [c["name"] for c in res.data["available_colors"]]
        self.assertNotIn("Blue", color_names)
        self.assertIn("Red", color_names)

    def test_available_colors_empty_when_all_out_of_stock(self):
        ProductVariant.objects.all().update(stock=0)
        res = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertEqual(res.data["available_colors"], [])
        self.assertEqual(res.data["available_sizes"], [])

    def test_filter_by_category(self):
        res = self.client.get(f"/api/products/?category={self.category.slug}")
        self.assertEqual(res.data["count"], 1)

    def test_filter_by_price_range(self):
        res = self.client.get("/api/products/?min_price=50000&max_price=150000")
        self.assertEqual(res.data["count"], 1)
        res2 = self.client.get("/api/products/?min_price=200000")
        self.assertEqual(res2.data["count"], 0)

    def test_filter_by_color(self):
        res = self.client.get("/api/products/?color=Blue")
        self.assertEqual(res.data["count"], 1)
        res2 = self.client.get("/api/products/?color=Purple")
        self.assertEqual(res2.data["count"], 0)

    def test_filter_by_size(self):
        res = self.client.get("/api/products/?size=S")
        self.assertEqual(res.data["count"], 1)

    def test_filter_in_stock(self):
        ProductVariant.objects.all().update(stock=0)
        res = self.client.get("/api/products/?in_stock=true")
        self.assertEqual(res.data["count"], 0)

    def test_search(self):
        res = self.client.get("/api/products/?search=Sponge")
        self.assertEqual(res.data["count"], 1)

    def test_ordering_by_price(self):
        Product.objects.create(
            title="Cheap",
            description="x",
            price=Decimal("10"),
            category=self.category,
        )
        res = self.client.get("/api/products/?ordering=price")
        prices = [Decimal(p["price"]) for p in res.data["results"]]
        self.assertEqual(prices, sorted(prices))

    def test_create_product_requires_staff(self):
        payload = {
            "title": "New",
            "description": "d",
            "price": "100",
            "category_id": self.category.id,
        }
        res = self.client.post("/api/products/", payload)
        self.assertIn(res.status_code, (401, 403))

    def test_create_product_as_staff(self):
        self.client.force_authenticate(self.staff_user)
        payload = {
            "title": "New Product",
            "description": "d",
            "price": "100",
            "discount": "5",
            "category_id": self.category.id,
        }
        res = self.client.post("/api/products/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["slug"], "new-product")

    def test_update_product_as_staff(self):
        self.client.force_authenticate(self.staff_user)
        res = self.client.patch(
            f"/api/products/{self.product.slug}/", {"price": "120000.00"}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, Decimal("120000.00"))

    def test_slug_not_overwritten_on_update(self):
        self.client.force_authenticate(self.staff_user)
        old_slug = self.product.slug
        self.client.patch(f"/api/products/{self.product.slug}/", {"title": "Renamed"})
        self.product.refresh_from_db()
        self.assertEqual(self.product.slug, old_slug)


# =========================================================
# PRODUCT IMAGES ENDPOINT
# =========================================================
class ProductImageAPITests(MediaRootMixin, APIBaseMixin, APITestCase):
    def test_upload_image_requires_staff(self):
        res = self.client.post(
            f"/api/products/{self.product.slug}/images/",
            {"image": create_test_image()},
            format="multipart",
        )
        self.assertIn(res.status_code, (401, 403))

    def test_upload_image_as_staff(self):
        self.client.force_authenticate(self.staff_user)
        res = self.client.post(
            f"/api/products/{self.product.slug}/images/",
            {"image": create_test_image()},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_upload_without_file_rejected(self):
        self.client.force_authenticate(self.staff_user)
        res = self.client.post(
            f"/api/products/{self.product.slug}/images/",
            {},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_images(self):
        self.client.force_authenticate(self.staff_user)
        self.client.post(
            f"/api/products/{self.product.slug}/images/",
            {"image": create_test_image()},
            format="multipart",
        )
        res = self.client.get(f"/api/products/{self.product.slug}/images/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)


# =========================================================
# PRODUCT VARIANTS ENDPOINT
# =========================================================
class ProductVariantAPITests(APIBaseMixin, APITestCase):
    def test_list_variants(self):
        res = self.client.get(f"/api/products/{self.product.slug}/variants/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_create_variant_as_staff(self):
        self.client.force_authenticate(self.staff_user)
        payload = {
            "color_id": self.color_blue.id,
            "size_id": self.size_m.id,
            "stock": 7,
        }
        res = self.client.post(f"/api/products/{self.product.slug}/variants/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["stock"], 7)

    def test_create_variant_duplicate_fails(self):
        self.client.force_authenticate(self.staff_user)
        payload = {
            "color_id": self.color_blue.id,
            "size_id": self.size_s.id,
            "stock": 3,
        }
        res = self.client.post(f"/api/products/{self.product.slug}/variants/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_variant_anonymous_forbidden(self):
        payload = {
            "color_id": self.color_blue.id,
            "size_id": self.size_m.id,
            "stock": 3,
        }
        res = self.client.post(f"/api/products/{self.product.slug}/variants/", payload)
        self.assertIn(res.status_code, (401, 403))


# =========================================================
# COMMENT ENDPOINTS
# =========================================================
class CommentAPITests(APIBaseMixin, APITestCase):
    def test_anyone_can_post_comment(self):
        payload = {"name": "Ali", "text": "Nice!", "stars": 5}
        res = self.client.post(f"/api/products/{self.product.slug}/comments/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data["comment"]["is_published"])

    def test_client_cannot_set_is_published(self):
        payload = {
            "name": "Ali",
            "text": "x",
            "stars": 5,
            "is_published": True,
        }
        res = self.client.post(f"/api/products/{self.product.slug}/comments/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data["comment"]["is_published"])

    def test_missing_name_rejected(self):
        res = self.client.post(
            f"/api/products/{self.product.slug}/comments/",
            {"text": "x", "stars": 5},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_text_rejected(self):
        res = self.client.post(
            f"/api/products/{self.product.slug}/comments/",
            {"name": "A", "text": "", "stars": 5},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_list_excludes_unpublished(self):
        Comment.objects.create(
            product=self.product, name="A", text="x", stars=5, is_published=False
        )
        Comment.objects.create(
            product=self.product, name="B", text="x", stars=5, is_published=True
        )
        res = self.client.get(f"/api/products/{self.product.slug}/comments/")
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["name"], "B")

    def test_staff_sees_all_comments(self):
        Comment.objects.create(
            product=self.product, name="A", text="x", stars=5, is_published=False
        )
        Comment.objects.create(
            product=self.product, name="B", text="x", stars=5, is_published=True
        )
        self.client.force_authenticate(self.staff_user)
        res = self.client.get(f"/api/products/{self.product.slug}/comments/")
        self.assertEqual(res.data["count"], 2)

    def test_stars_out_of_range_rejected(self):
        res = self.client.post(
            f"/api/products/{self.product.slug}/comments/",
            {"name": "Ali", "text": "x", "stars": 10},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stars_below_range_rejected(self):
        res = self.client.post(
            f"/api/products/{self.product.slug}/comments/",
            {"name": "Ali", "text": "x", "stars": 0},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_comment_requires_staff(self):
        c = Comment.objects.create(product=self.product, name="A", text="x", stars=5)
        res = self.client.post(f"/api/comments/{c.id}/approve/")
        self.assertIn(res.status_code, (401, 403))

    def test_approve_comment_as_staff(self):
        c = Comment.objects.create(product=self.product, name="A", text="x", stars=5)
        self.client.force_authenticate(self.staff_user)
        res = self.client.post(f"/api/comments/{c.id}/approve/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        c.refresh_from_db()
        self.assertTrue(c.is_published)

    def test_reject_comment_as_staff(self):
        c = Comment.objects.create(
            product=self.product, name="A", text="x", stars=5, is_published=True
        )
        self.client.force_authenticate(self.staff_user)
        res = self.client.post(f"/api/comments/{c.id}/reject/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        c.refresh_from_db()
        self.assertFalse(c.is_published)

    def test_delete_comment_requires_staff(self):
        c = Comment.objects.create(product=self.product, name="A", text="x", stars=5)
        res = self.client.delete(f"/api/comments/{c.id}/")
        self.assertIn(res.status_code, (401, 403))

    def test_delete_comment_as_staff(self):
        c = Comment.objects.create(product=self.product, name="A", text="x", stars=5)
        self.client.force_authenticate(self.staff_user)
        res = self.client.delete(f"/api/comments/{c.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(id=c.id).exists())


# =========================================================
# PERMISSIONS
# =========================================================
class PermissionTests(APIBaseMixin, APITestCase):
    def test_anonymous_can_read_products(self):
        res = self.client.get("/api/products/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_create_product(self):
        res = self.client.post("/api/products/", {})
        self.assertIn(res.status_code, (401, 403))

    def test_normal_user_cannot_create_product(self):
        self.client.force_authenticate(self.normal_user)
        res = self.client.post("/api/products/", {})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_create_product(self):
        self.client.force_authenticate(self.staff_user)
        res = self.client.post(
            "/api/products/",
            {
                "title": "X",
                "description": "d",
                "price": "10",
                "category_id": self.category.id,
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


# =========================================================
# JWT AUTHENTICATION
# =========================================================
class JWTAuthTests(APIBaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.token_url = "/api/token/"

    def test_obtain_token_with_valid_credentials(self):
        res = self.client.post(
            self.token_url,
            {"username": "admin", "password": "pass1234"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_obtain_token_with_invalid_credentials(self):
        res = self.client.post(
            self.token_url,
            {"username": "admin", "password": "wrong"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_protected_endpoint_with_jwt(self):
        token = get_jwt_access_token(self.staff_user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = client.post(
            "/api/products/",
            {
                "title": "JWT Product",
                "description": "d",
                "price": "10",
                "category_id": self.category.id,
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_protected_endpoint_without_token_forbidden(self):
        client = APIClient()
        res = client.post(
            "/api/products/",
            {
                "title": "X",
                "description": "d",
                "price": "10",
                "category_id": self.category.id,
            },
        )
        self.assertIn(res.status_code, (401, 403))

    def test_protected_endpoint_with_invalid_token_forbidden(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer invalid.token.here")
        res = client.post(
            "/api/products/",
            {
                "title": "X",
                "description": "d",
                "price": "10",
                "category_id": self.category.id,
            },
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token(self):
        login = self.client.post(
            self.token_url,
            {"username": "admin", "password": "pass1234"},
        )
        refresh = login.data["refresh"]
        res = self.client.post("/api/token/refresh/", {"refresh": refresh})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_verify_token(self):
        token = get_jwt_access_token(self.staff_user)
        res = self.client.post("/api/token/verify/", {"token": token})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_normal_user_with_jwt_cannot_create_product(self):
        token = get_jwt_access_token(self.normal_user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = client.post(
            "/api/products/",
            {
                "title": "X",
                "description": "d",
                "price": "10",
                "category_id": self.category.id,
            },
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# =========================================================
# PAGINATION
# =========================================================
class PaginationTests(APIBaseMixin, APITestCase):
    def _create_products(self, count):
        # bulk_create متد save() مدل رو صدا نمیزنه، پس slug رو دستی ست میکنیم
        Product.objects.bulk_create(
            [
                Product(
                    title=f"P{i}",
                    slug=f"p-{i}",
                    description="x",
                    price=Decimal("10"),
                    category=self.category,
                )
                for i in range(count)
            ]
        )

    def test_default_page_size(self):
        self._create_products(20)
        res = self.client.get("/api/products/")
        self.assertEqual(len(res.data["results"]), 12)

    def test_custom_page_size(self):
        self._create_products(20)
        res = self.client.get("/api/products/?page_size=5")
        self.assertEqual(len(res.data["results"]), 5)

    def test_max_page_size_capped(self):
        self._create_products(20)
        res = self.client.get("/api/products/?page_size=1000")
        self.assertLessEqual(len(res.data["results"]), 100)

    def test_second_page(self):
        self._create_products(20)
        res = self.client.get("/api/products/?page=2")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 21)


# =========================================================
# THROTTLE
# =========================================================
class CommentThrottleTests(APIBaseMixin, APITestCase):
    def test_comment_throttle_blocks_after_limit(self):
        url = f"/api/products/{self.product.slug}/comments/"
        payload = {"name": "A", "text": "x", "stars": 5}
        statuses = []
        for _ in range(8):
            res = self.client.post(url, payload)
            statuses.append(res.status_code)
        self.assertIn(status.HTTP_429_TOO_MANY_REQUESTS, statuses)


# =========================================================
# ADMIN
# =========================================================
class AdminTests(BaseSetUpMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.superuser = CustomUser.objects.create_superuser(
            username="superadmin",
            email="super@example.com",
            password="pass1234",
        )

    def test_admin_loads(self):
        self.client.force_login(self.superuser)
        res = self.client.get("/admin/products/product/")
        self.assertEqual(res.status_code, 200)

    def test_admin_comment_list(self):
        self.client.force_login(self.superuser)
        res = self.client.get("/admin/products/comment/")
        self.assertEqual(res.status_code, 200)

    def test_comment_admin_approve_action(self):
        self.client.force_login(self.superuser)
        c = Comment.objects.create(product=self.product, name="A", text="x", stars=5)
        res = self.client.post(
            "/admin/products/comment/",
            {
                "action": "approve_comments",
                "_selected_action": [str(c.id)],
            },
            follow=True,
        )
        self.assertEqual(res.status_code, 200)
        c.refresh_from_db()
        self.assertTrue(c.is_published)

    def test_comment_admin_reject_action(self):
        self.client.force_login(self.superuser)
        c = Comment.objects.create(
            product=self.product,
            name="A",
            text="x",
            stars=5,
            is_published=True,
        )
        res = self.client.post(
            "/admin/products/comment/",
            {
                "action": "reject_comments",
                "_selected_action": [str(c.id)],
            },
            follow=True,
        )
        self.assertEqual(res.status_code, 200)
        c.refresh_from_db()
        self.assertFalse(c.is_published)


class ProductDetailQueryCountTests(APIBaseMixin, APITestCase):
    def test_detail_query_count_does_not_grow_with_data(self):
        """تعداد کوئری‌های detail نباید به تعداد variant/color/size وابسته باشه"""
        url = f"/api/products/{self.product.slug}/"

        with CaptureQueriesContext(connection) as ctx:
            self.client.get(url, HTTP_ACCEPT="application/json")
        base_count = len(ctx.captured_queries)

        for i in range(10):
            color = Color.objects.create(name=f"ExtraColor{i}")
            size = Size.objects.create(name=f"ExtraSize{i}")
            ProductVariant.objects.create(
                product=self.product,
                color=color,
                size=size,
                stock=1,
            )
        for i in range(10):
            Comment.objects.create(
                product=self.product,
                name=f"User{i}",
                text="x",
                stars=5,
                is_published=True,
            )

        with CaptureQueriesContext(connection) as ctx:
            self.client.get(url, HTTP_ACCEPT="application/json")
        new_count = len(ctx.captured_queries)

        self.assertEqual(
            base_count,
            new_count,
            f"N+1 detected! Query count grew from {base_count} to {new_count}.",
        )


class ProductListQueryCountTests(APIBaseMixin, APITestCase):
    def test_list_query_count_does_not_grow_with_data(self):
        """تعداد کوئری‌های list نباید به تعداد آیتم‌ها وابسته باشه"""
        url = "/api/products/"

        with CaptureQueriesContext(connection) as ctx:
            self.client.get(url, HTTP_ACCEPT="application/json")
        base_count = len(ctx.captured_queries)

        for i in range(10):
            p = Product.objects.create(
                title=f"Bulk {i}",
                description="x",
                price=Decimal("10"),
                category=self.category,
            )
            ProductVariant.objects.create(
                product=p,
                color=self.color_blue,
                size=self.size_s,
                stock=5,
            )
            Comment.objects.create(
                product=p,
                name=f"U{i}",
                text="x",
                stars=5,
                is_published=True,
            )

        with CaptureQueriesContext(connection) as ctx:
            self.client.get(url, HTTP_ACCEPT="application/json")
        new_count = len(ctx.captured_queries)

        self.assertEqual(
            base_count,
            new_count,
            f"N+1 in list! Query count grew from {base_count} to {new_count}.",
        )
