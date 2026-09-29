from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify


def product_image_upload_path(instance, filename):
    product = instance.product
    folder_name = product.slug or f"product-{product.pk or 'new'}"
    return f"products/{folder_name}/{filename}"


class Category(models.Model):
    name = models.CharField(max_length=255, verbose_name=_("Name"))
    slug = models.CharField(
        max_length=255,
        unique=True,
        blank=True,
        verbose_name=_("Slug"),
        help_text=_("Auto-generated from name if left empty."),
    )
    image = models.ImageField(
        upload_to="categories/",
        null=True,
        blank=True,
        verbose_name=_("Image"),
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
        verbose_name=_("Parent Category"),
    )

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    @property
    def product_count(self):
        return self.products.count()

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None


class Color(models.Model):
    name = models.CharField(max_length=50, verbose_name=_("Name"))
    code = models.CharField(max_length=7, blank=True, verbose_name=_("HEX Code"))

    class Meta:
        verbose_name = _("Color")
        verbose_name_plural = _("Colors")

    def __str__(self):
        return self.name


class Size(models.Model):
    name = models.CharField(max_length=50, verbose_name=_("Name"))

    class Meta:
        verbose_name = _("Size")
        verbose_name_plural = _("Sizes")

    def __str__(self):
        return self.name


class Product(models.Model):
    product_code = models.PositiveBigIntegerField(
        unique=True,
        blank=True,
        null=True,
        verbose_name=_("Product Code"),
    )
    title = models.CharField(max_length=255, verbose_name=_("Title"))
    slug = models.CharField(
        max_length=255,
        unique=True,
        blank=True,
        verbose_name=_("Slug"),
        help_text=_("Auto-generated from title if left empty."),
    )
    description = models.TextField(verbose_name=_("Description"))
    price = models.PositiveBigIntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Price"),
    )
    discount = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name=_("Discount (%)"),
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name=_("Category"),
    )
    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )
    datetime_updated = models.DateTimeField(
        auto_now=True, verbose_name=_("Date/Time Updated")
    )

    class Meta:
        ordering = ["-datetime_created"]
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        indexes = [
            models.Index(fields=["product_code"], name="product_code_idx"),
            models.Index(fields=["category"], name="product_category_idx"),
            models.Index(fields=["datetime_created"], name="product_created_idx"),
            models.Index(fields=["slug"], name="product_slug_idx"),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    @property
    def final_price(self):
        """Final price after percentage discount, as an integer (Toman)."""
        if self.discount and self.discount > 0:
            discount_amount = (self.price * self.discount) // 100
            return self.price - discount_amount
        return self.price

    @property
    def main_image(self):
        if "images" in self._prefetched_objects_cache:
            images = self._prefetched_objects_cache["images"]
            return images[0].image if images else None

        first_image = self.images.order_by("datetime_created", "id").first()
        return first_image.image if first_image else None

    def get_absolute_url(self):
        return reverse("product-detail", kwargs={"slug": self.slug})


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name=_("Product"),
    )
    image = models.ImageField(
        upload_to=product_image_upload_path, verbose_name=_("Image")
    )
    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )

    class Meta:
        ordering = ["datetime_created", "id"]
        verbose_name = _("Product Image")
        verbose_name_plural = _("Product Images")

    def __str__(self):
        return f"Image for {self.product.title}"


class Comment(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name=_("Product"),
    )
    name = models.CharField(max_length=100, verbose_name=_("Name"))
    text = models.TextField(verbose_name=_("Comment"))
    stars = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name=_("Stars"),
    )
    is_published = models.BooleanField(
        default=False,
        verbose_name=_("Is Published"),
        help_text=_("Only published comments are visible to the public."),
    )
    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )
    datetime_updated = models.DateTimeField(
        auto_now=True, verbose_name=_("Date/Time Updated")
    )

    class Meta:
        ordering = ["-datetime_created"]
        verbose_name = _("Comment")
        verbose_name_plural = _("Comments")
        indexes = [
            models.Index(
                fields=["product", "is_published"],
                name="comment_product_pub_idx",
            ),
        ]

    def __str__(self):
        return f"Comment by {self.name} on {self.product.title}"


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
        verbose_name=_("Product"),
    )
    color = models.ForeignKey(
        Color,
        on_delete=models.PROTECT,
        related_name="variants",
        verbose_name=_("Color"),
    )
    size = models.ForeignKey(
        Size,
        on_delete=models.PROTECT,
        related_name="variants",
        verbose_name=_("Size"),
    )
    stock = models.PositiveIntegerField(default=0, verbose_name=_("Stock"))
    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )
    datetime_updated = models.DateTimeField(
        auto_now=True, verbose_name=_("Date/Time Updated")
    )

    class Meta:
        verbose_name = _("Product Variant")
        verbose_name_plural = _("Product Variants")
        constraints = [
            models.UniqueConstraint(
                fields=["product", "color", "size"],
                name="unique_variant_per_product",
            )
        ]
        indexes = [
            models.Index(fields=["product", "stock"], name="variant_stock_idx"),
        ]

    def __str__(self):
        return f"{self.product.title} - {self.color.name} - {self.size.name}"


class Wishlist(models.Model):
    user = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
        verbose_name=_("User"),
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
        verbose_name=_("Product"),
    )
    datetime_created = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Date/Time Created")
    )

    class Meta:
        verbose_name = _("Wishlist Item")
        verbose_name_plural = _("Wishlist Items")
        ordering = ["-datetime_created"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_wishlist_per_user_product",
            ),
        ]
        indexes = [
            models.Index(
                fields=["user", "-datetime_created"],
                name="wishlist_user_created_idx",
            ),
        ]

    def __str__(self):
        return f"{self.user} ❤ {self.product.title}"
