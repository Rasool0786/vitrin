# cart/views.py
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    inline_serializer,
    OpenApiParameter,
)
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from products.models import ProductVariant
from .services import CartService, CouponService
from .serializers import (
    AddToCartSerializer,
    UpdateCartItemSerializer,
    ApplyCouponSerializer,
    CartItemReadSerializer,
    CouponReadSerializer,
)


class CartItemResponseSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    product_title = serializers.CharField()
    product_slug = serializers.CharField()
    color = serializers.CharField()
    size = serializers.CharField()
    stock = serializers.IntegerField()
    final_price = serializers.IntegerField()
    quantity = serializers.IntegerField()
    line_total = serializers.IntegerField()


class CartResponseSerializer(serializers.Serializer):
    items = CartItemResponseSerializer(many=True)
    subtotal = serializers.IntegerField()
    discount_amount = serializers.IntegerField()
    total = serializers.IntegerField()
    coupon = CouponReadSerializer(allow_null=True)


class CartErrorSerializer(serializers.Serializer):
    detail = serializers.CharField()


def _build_cart_response(cart: CartService):
    raw_items = cart.get_raw_items()
    if not raw_items:
        return {
            "items": [],
            "subtotal": 0,
            "discount_amount": 0,
            "total": 0,
            "coupon": None,
        }

    variants = ProductVariant.objects.filter(
        id__in=list(raw_items.keys())
    ).select_related("product", "color", "size")
    variant_map = {v.id: v for v in variants}

    items = []
    subtotal = 0
    for variant_id, qty in raw_items.items():
        variant = variant_map.get(variant_id)
        if not variant:
            continue
        unit_price = int(variant.product.final_price)
        line_total = unit_price * qty
        subtotal += line_total

        item_data = CartItemReadSerializer(variant).data
        item_data["quantity"] = qty
        item_data["line_total"] = line_total
        items.append(item_data)

    coupon_code = cart.get_coupon_code()
    discount_amount = 0
    coupon_data = None
    if coupon_code:
        try:
            coupon, discount_amount = CouponService.validate_and_calculate(
                code=coupon_code,
                subtotal=subtotal,
                user=cart.user,
            )
            coupon_data = CouponReadSerializer(coupon).data
        except DjangoValidationError:
            cart.clear_coupon()

    total = max(subtotal - discount_amount, 0)
    return {
        "items": items,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total": total,
        "coupon": coupon_data,
    }


class CartViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _cart(self, request) -> CartService:
        return CartService(request)

    def _finalize(self, request, cart, data=None, status_code=status.HTTP_200_OK):
        response = Response(
            data if data is not None else _build_cart_response(cart),
            status=status_code,
        )
        cart.attach_cookie_if_needed(response)
        return response

    # ---------------------------------------------------------
    @extend_schema(
        summary="Get current cart",
        responses={200: CartResponseSerializer},
        tags=["cart"],
    )
    def list(self, request):
        cart = self._cart(request)
        return self._finalize(request, cart)

    # ---------------------------------------------------------
    @extend_schema(
        summary="Add item to cart",
        request=AddToCartSerializer,
        responses={
            200: CartResponseSerializer,
            400: CartErrorSerializer,
            404: CartErrorSerializer,
        },
        tags=["cart"],
    )
    @action(detail=False, methods=["post"], url_path="items")
    def add_item(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant_id = serializer.validated_data["variant_id"]
        quantity = serializer.validated_data["quantity"]

        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return Response(
                {"detail": "Variant not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cart = self._cart(request)
        current = cart.get_raw_items().get(variant_id, 0)
        if current + quantity > variant.stock:
            return Response(
                {"detail": f"Only {variant.stock} in stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart.add(variant_id, quantity)
        return self._finalize(request, cart)

    # ---------------------------------------------------------
    @extend_schema(
        summary="Update or remove cart item",
        request=UpdateCartItemSerializer,
        responses={
            200: CartResponseSerializer,
            400: CartErrorSerializer,
            404: CartErrorSerializer,
        },
        parameters=[
            OpenApiParameter(
                name="variant_id",
                type=int,
                location=OpenApiParameter.PATH,
                description="ProductVariant ID",
            ),
        ],
        tags=["cart"],
    )
    @action(
        detail=False,
        methods=["patch", "delete"],
        url_path=r"items/(?P<variant_id>[0-9]+)",
        url_name="item",
    )
    def item(self, request, variant_id=None):
        cart = self._cart(request)
        variant_id = int(variant_id)

        if request.method == "PATCH":
            serializer = UpdateCartItemSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            quantity = serializer.validated_data["quantity"]

            if quantity > 0:
                try:
                    variant = ProductVariant.objects.get(id=variant_id)
                except ProductVariant.DoesNotExist:
                    return Response(
                        {"detail": "Variant not found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                if quantity > variant.stock:
                    return Response(
                        {"detail": f"Only {variant.stock} in stock."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            cart.update(variant_id, quantity)
        else:  # DELETE
            cart.remove(variant_id)

        return self._finalize(request, cart)

    # ---------------------------------------------------------
    @extend_schema(
        summary="Clear the cart",
        responses={200: CartResponseSerializer},
        tags=["cart"],
    )
    @action(detail=False, methods=["delete"], url_path="clear")
    def clear_cart(self, request):
        cart = self._cart(request)
        cart.clear_items()
        return self._finalize(request, cart)

    # ---------------------------------------------------------
    @extend_schema(
        summary="Apply coupon to cart (POST) / remove coupon (DELETE)",
        request=ApplyCouponSerializer,
        responses={
            200: CartResponseSerializer,
            400: CartErrorSerializer,
        },
        tags=["cart"],
    )
    @action(detail=False, methods=["post", "delete"], url_path="coupon")
    def coupon(self, request):
        cart = self._cart(request)

        if request.method == "DELETE":
            cart.clear_coupon()
            return self._finalize(request, cart)

        serializer = ApplyCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]

        raw_items = cart.get_raw_items()
        if not raw_items:
            return Response(
                {"detail": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        variants = ProductVariant.objects.filter(
            id__in=list(raw_items.keys())
        ).select_related("product")
        subtotal = sum(int(v.product.final_price) * raw_items[v.id] for v in variants)

        try:
            CouponService.validate_and_calculate(
                code=code, subtotal=subtotal, user=cart.user
            )
        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart.set_coupon(code)
        return self._finalize(request, cart)

    # ---------------------------------------------------------
    @extend_schema(
        summary="Merge guest cart into authenticated user cart",
        request=None,
        responses={200: CartResponseSerializer},
        tags=["cart"],
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="merge",
        permission_classes=[IsAuthenticated],
    )
    def merge(self, request):
        cart = self._cart(request)
        cart.merge_guest_into_user(request.user)
        response = self._finalize(request, CartService(request))
        response.delete_cookie(CartService.COOKIE_NAME)
        return response
