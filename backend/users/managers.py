from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):

    def create_user(
        self,
        username,
        email,
        password=None,
        **extra_fields,
    ):
        if not username:
            raise ValueError(_("Username is required"))

        if not email:
            raise ValueError(_("Email is required"))

        email = self.normalize_email(email)

        user = self.model(
            username=username,
            email=email,
            **extra_fields,
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        username,
        email,
        password=None,
        **extra_fields,
    ):
        extra_fields.setdefault(
            "is_staff",
            True,
        )

        extra_fields.setdefault(
            "is_superuser",
            True,
        )

        extra_fields.setdefault(
            "is_active",
            True,
        )

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True"))

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True"))

        return self.create_user(
            username=username,
            email=email,
            password=password,
            **extra_fields,
        )
