from rest_framework import serializers

from products.models import ProductVariant, ProductImage
from .models import Coupon


class AddToCartSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)


class CartItemReadSerializer(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source="id", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    final_price = serializers.IntegerField(source="product.final_price", read_only=True)
    color = serializers.CharField(source="color.name", read_only=True)
    size = serializers.CharField(source="size.name", read_only=True)
    image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "variant_id",
            "product_title",
            "product_slug",
            "color",
            "size",
            "stock",
            "final_price",
            "image",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        # پیدا کردن اولین عکس محصول مرتبط با این واریانت
        first_img = obj.product.images.first()
        if first_img and first_img.image:
            if request:
                return request.build_absolute_uri(first_img.image.url)
            return first_img.image.url
        return None


class CouponReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "code",
            "discount_percent",
            "max_discount",
            "min_purchase",
        ]
