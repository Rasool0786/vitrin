from django.contrib.auth import (
    authenticate,
    login,
    logout,
)
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import (
    status,
    viewsets,
)
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Address, CustomUser, Profile
from .serializers import (
    AddressSerializer,
    LoginSerializer,
    ProfileSerializer,
    SignupSerializer,
)


def user_payload(user):
    profile, _ = Profile.objects.get_or_create(
        user=user
    )

    return ProfileSerializer(
        profile,
        context={
            "request": None
        },
    ).data


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    return Response(
        {
            "detail": "CSRF cookie set."
        }
    )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [
        ScopedRateThrottle
    ]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        identifier = (
            serializer.validated_data[
                "identifier"
            ]
        )

        password = (
            serializer.validated_data[
                "password"
            ]
        )

        user = (
            CustomUser.objects
            .filter(
                Q(
                    username__iexact=identifier
                )
                | Q(
                    email__iexact=identifier
                )
            )
            .first()
        )

        if (
            not user
            or not user.check_password(password)
        ):
            return Response(
                {
                    "detail":
                        "نام کاربری/ایمیل یا رمز عبور اشتباه است."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {
                    "detail":
                        "حساب کاربری غیرفعال است."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        login(
            request,
            user,
        )

        return Response(
            {
                "user": user_payload(user)
            }
        )


class SignupView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [
        ScopedRateThrottle
    ]
    throttle_scope = "signup"

    def post(self, request):
        serializer = SignupSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        login(
            request,
            user,
        )

        return Response(
            {
                "user": user_payload(user)
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    permission_classes = [
        AllowAny
    ]

    def post(self, request):
        logout(request)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(["GET", "PATCH"])
@permission_classes([
    IsAuthenticated
])
def me(request):
    profile, _ = Profile.objects.get_or_create(
        user=request.user
    )

    if request.method == "GET":
        return Response(
            ProfileSerializer(
                profile,
                context={
                    "request": request
                },
            ).data
        )

    serializer = ProfileSerializer(
        profile,
        data=request.data,
        partial=True,
        context={
            "request": request
        },
    )

    serializer.is_valid(
        raise_exception=True
    )

    serializer.save()

    return Response(
        serializer.data
    )


class AddressViewSet(
    viewsets.ModelViewSet
):
    serializer_class = AddressSerializer
    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
              return Address.objects.none()
        return Address.objects.filter(
            user=self.request.user
        )
