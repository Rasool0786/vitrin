from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "variant",
            "product_title",
            "color_name",
            "size_name",
            "unit_price",
            "quantity",
            "line_total",
        ]
        read_only_fields = fields


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "status",
            "total_price",
            "items_count",
            "datetime_created",
        ]
        read_only_fields = fields


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "status",
            "subtotal",
            "discount_amount",
            "total_price",
            "coupon_code",
            "full_name",
            "phone",
            "address",
            "city",
            "postal_code",
            "note",
            "items",
            "datetime_created",
            "datetime_updated",
            "datetime_paid",
        ]
        read_only_fields = fields


class OrderCreateItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderCreateItemSerializer(many=True)
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value
