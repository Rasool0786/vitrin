from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from cart.services import CartService, CouponService
from .models import Order
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
)
from .permissions import IsOrderOwnerOrStaff
from .services import create_order, cancel_order


class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items").select_related("user")
        if self.request.user.is_staff:
            return qs
        if getattr(self, 'swagger_fake_view', False):
            return qs.none()
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "list":
            return OrderListSerializer
        return OrderDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        cart = CartService(request)
        coupon_code = data.get("coupon_code") or cart.get_coupon_code() or ""

        try:
            order = create_order(
                user=request.user,
                cart_items=data["items"],
                shipping_data={
                    "full_name": data["full_name"],
                    "phone": data["phone"],
                    "address": data["address"],
                    "city": data.get("city", ""),
                    "postal_code": data.get("postal_code", ""),
                    "note": data.get("note", ""),
                },
                coupon_code=coupon_code,
            )
        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if coupon_code:
            try:
                coupon, discount = CouponService.validate_and_calculate(
                    code=coupon_code,
                    subtotal=order.subtotal,
                    user=request.user,
                )
                order.discount_amount = discount
                order.total_price = max(order.subtotal - discount, 0)
                order.save(
                    update_fields=[
                        "discount_amount",
                        "total_price",
                        "datetime_updated",
                    ]
                )
                CouponService.record_usage(
                    coupon=coupon,
                    user=request.user,
                    order_code=order.order_code,
                )
            except DjangoValidationError:
                pass

        cart.clear_items()

        out = OrderDetailSerializer(order, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsOrderOwnerOrStaff],
    )
    def cancel(self, request, pk=None):
        order = self.get_object()
        try:
            cancel_order(order=order)
        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(OrderDetailSerializer(order).data)
