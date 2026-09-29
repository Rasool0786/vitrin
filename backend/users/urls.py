from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    LoginView,
    LogoutView,
    SignupView,
    csrf_token,
    me,
)

router = DefaultRouter()

router.register(
    "addresses",
    AddressViewSet,
    basename="address",
)


urlpatterns = [
    path(
        "auth/csrf/",
        csrf_token,
        name="csrf-token",
    ),
    path(
        "auth/login/",
        LoginView.as_view(),
        name="login",
    ),
    path(
        "auth/signup/",
        SignupView.as_view(),
        name="signup",
    ),
    path(
        "auth/logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
        "me/",
        me,
        name="me",
    ),
    path(
        "",
        include(router.urls),
    ),
]
