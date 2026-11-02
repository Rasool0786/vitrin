from django.contrib.auth import (
    login,
    logout,
)
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

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, CustomUser, Profile
from .serializers import (
    AddressSerializer,
    LoginSerializer,
    ProfileSerializer,
    SignupSerializer,
)


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def user_payload(user):
    """ساخت پروفایل کاربر برای پاسخ API."""
    profile, _ = Profile.objects.get_or_create(user=user)
    return ProfileSerializer(
        profile,
        context={"request": None},
    ).data


def _tokens_for_user(user):
    """تولید جفت توکن JWT برای یک کاربر."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# -----------------------------------------------------------------------------
# CSRF (فقط برای سازگاری با admin / browsable API)
# -----------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    return Response({"detail": "CSRF cookie set."})


# -----------------------------------------------------------------------------
# Auth: Login
# -----------------------------------------------------------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        password = serializer.validated_data["password"]

        user = (
            CustomUser.objects.filter(
                Q(username__iexact=identifier) | Q(email__iexact=identifier)
            ).first()
        )

        if not user or not user.check_password(password):
            return Response(
                {"detail": "نام کاربری/ایمیل یا رمز عبور اشتباه است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {"detail": "حساب کاربری غیرفعال است."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # لاگین سشن (برای admin و browsable API)
        login(request, user)

        tokens = _tokens_for_user(user)

        return Response(
            {
                "user": user_payload(user),
                "access": tokens["access"],
                "refresh": tokens["refresh"],
            }
        )


# -----------------------------------------------------------------------------
# Auth: Signup
# -----------------------------------------------------------------------------
class SignupView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # لاگین سشن
        login(request, user)

        tokens = _tokens_for_user(user)

        return Response(
            {
                "user": user_payload(user),
                "access": tokens["access"],
                "refresh": tokens["refresh"],
            },
            status=status.HTTP_201_CREATED,
        )


# -----------------------------------------------------------------------------
# Auth: Logout
# -----------------------------------------------------------------------------
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # 1) logout سشن
        logout(request)

        # 2) blacklist کردن refresh token در صورت ارسال
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                # توکن از قبل منقضی یا نامعتبر بود — نادیده بگیر
                pass

        return Response(status=status.HTTP_204_NO_CONTENT)


# -----------------------------------------------------------------------------
# Me (پروفایل کاربر جاری)
# -----------------------------------------------------------------------------
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(
            ProfileSerializer(
                profile,
                context={"request": request},
            ).data
        )

    serializer = ProfileSerializer(
        profile,
        data=request.data,
        partial=True,
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)


# -----------------------------------------------------------------------------
# Address
# -----------------------------------------------------------------------------
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
