from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import Address, CustomUser, Profile


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
    )

    def validate_identifier(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "نام کاربری یا ایمیل الزامی است."
            )

        return value


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=150,
    )

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    password_confirm = serializers.CharField(
        write_only=True,
    )

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "نام کاربری الزامی است."
            )

        if CustomUser.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "این نام کاربری قبلاً استفاده شده است."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if CustomUser.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "این ایمیل قبلاً ثبت شده است."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {
                    "password_confirm":
                        "رمزهای عبور یکسان نیستند."
                }
            )

        validate_password(
            attrs["password"]
        )

        return attrs

    def create(self, validated_data):
        validated_data.pop(
            "password_confirm"
        )

        user = CustomUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        Profile.objects.create(
            user=user
        )

        return user


class ProfileSerializer(
    serializers.ModelSerializer
):
    user_id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
    )

    phone_number = serializers.SerializerMethodField()

    class Meta:
        model = Profile

        fields = [
            "user_id",
            "username",
            "email",
            "phone_number",
            "full_name",
            "birth_date",
            "national_code",
            "avatar",
            "datetime_created",
            "datetime_updated",
        ]

        read_only_fields = [
            "user_id",
            "username",
            "phone_number",
            "datetime_created",
            "datetime_updated",
        ]

    def get_phone_number(self, obj):
        return None

    def validate_email(self, value):
        value = value.strip().lower()

        user = self.instance.user if self.instance else None

        queryset = CustomUser.objects.filter(
            email__iexact=value
        )

        if user:
            queryset = queryset.exclude(
                pk=user.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "این ایمیل قبلاً استفاده شده است."
            )

        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop(
            "user",
            {},
        )

        if "email" in user_data:
            instance.user.email = user_data[
                "email"
            ]
            instance.user.save(
                update_fields=["email"]
            )

        return super().update(
            instance,
            validated_data,
        )


class AddressSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Address

        fields = [
            "id",
            "title",
            "full_name",
            "phone",
            "province",
            "city",
            "postal_code",
            "address",
            "is_default",
            "datetime_created",
        ]

        read_only_fields = [
            "id",
            "datetime_created",
        ]

    def create(self, validated_data):
        user = self.context["request"].user

        if validated_data.get(
            "is_default"
        ):
            Address.objects.filter(
                user=user,
                is_default=True,
            ).update(
                is_default=False
            )

        if not Address.objects.filter(
            user=user
        ).exists():
            validated_data["is_default"] = True

        return Address.objects.create(
            user=user,
            **validated_data,
        )

    def update(
        self,
        instance,
        validated_data,
    ):
        if validated_data.get(
            "is_default"
        ):
            Address.objects.filter(
                user=instance.user,
                is_default=True,
            ).exclude(
                pk=instance.pk
            ).update(
                is_default=False
            )

        return super().update(
            instance,
            validated_data,
        )