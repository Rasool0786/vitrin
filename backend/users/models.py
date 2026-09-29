from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    email = models.EmailField(
        max_length=254,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        verbose_name=_("Email"),
    )

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    objects = CustomUserManager()

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    def __str__(self):
        return self.username


class Profile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name=_("User"),
    )

    full_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_("Full Name"),
    )

    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Birth Date"),
    )

    national_code = models.CharField(
        max_length=10,
        blank=True,
        verbose_name=_("National Code"),
    )

    avatar = models.ImageField(
        upload_to="avatars/%Y/%m/",
        null=True,
        blank=True,
        verbose_name=_("Avatar"),
    )

    datetime_created = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Date/Time Created"),
    )

    datetime_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Date/Time Updated"),
    )

    class Meta:
        verbose_name = _("Profile")
        verbose_name_plural = _("Profiles")

    def __str__(self):
        return f"Profile of {self.user.username}"


class Address(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="addresses",
        verbose_name=_("User"),
    )

    title = models.CharField(
        max_length=100,
        verbose_name=_("Title"),
    )

    full_name = models.CharField(
        max_length=255,
        verbose_name=_("Full Name"),
    )

    phone = models.CharField(
        max_length=15,
        verbose_name=_("Phone"),
    )

    province = models.CharField(
        max_length=100,
        verbose_name=_("Province"),
    )

    city = models.CharField(
        max_length=100,
        verbose_name=_("City"),
    )

    postal_code = models.CharField(
        max_length=10,
        verbose_name=_("Postal Code"),
    )

    address = models.TextField(
        verbose_name=_("Address"),
    )

    is_default = models.BooleanField(
        default=False,
        verbose_name=_("Is Default"),
    )

    datetime_created = models.DateTimeField(
        auto_now_add=True,
    )

    datetime_updated = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = _("Address")
        verbose_name_plural = _("Addresses")

        ordering = [
            "-is_default",
            "-datetime_created",
        ]

        indexes = [
            models.Index(
                fields=["user", "-is_default"],
                name="addr_user_default_idx",
            ),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.username}"
