from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from .models import (
    Category,
    Color,
    Size,
    Product,
    ProductImage,
    Comment,
    ProductVariant,
    Wishlist,
)


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "image", "image_url", "product_count"]
        read_only_fields = ["id", "slug", "image_url", "product_count"]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ["id", "name", "code"]


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ["id", "name"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "datetime_created"]
        read_only_fields = ["id", "datetime_created"]


class ProductVariantSerializer(serializers.ModelSerializer):
    color = ColorSerializer(read_only=True)
    size = SizeSerializer(read_only=True)
    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(), source="color", write_only=True
    )
    size_id = serializers.PrimaryKeyRelatedField(
        queryset=Size.objects.all(), source="size", write_only=True
    )

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "color",
            "color_id",
            "size",
            "size_id",
            "stock",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        product = validated_data.get("product")
        color = validated_data.get("color")
        size = validated_data.get("size")

        if ProductVariant.objects.filter(
            product=product,
            color=color,
            size=size,
        ).exists():
            raise serializers.ValidationError(
                {
                    "detail": _(
                        "A variant with this color and size already exists "
                        "for this product."
                    )
                }
            )
        return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = [
            "id",
            "name",
            "text",
            "stars",
            "is_published",
            "datetime_created",
        ]
        read_only_fields = ["id", "is_published", "datetime_created"]


class ProductListSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="product-detail",
        lookup_field="slug",
        read_only=True,
    )
    final_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    main_image = serializers.ImageField(read_only=True)
    category = CategorySerializer(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "url",
            "id",
            "product_code",
            "title",
            "slug",
            "price",
            "discount",
            "final_price",
            "main_image",
            "category",
            "average_rating",
            "comments_count",
            "datetime_created",
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    main_image = serializers.ImageField(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    available_colors = serializers.SerializerMethodField()
    available_sizes = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "product_code",
            "title",
            "slug",
            "description",
            "price",
            "discount",
            "final_price",
            "category",
            "category_id",
            "main_image",
            "images",
            "variants",
            "comments",
            "available_colors",
            "available_sizes",
            "average_rating",
            "comments_count",
            "datetime_created",
            "datetime_updated",
        ]
        read_only_fields = [
            "id",
            "slug",
            "datetime_created",
            "datetime_updated",
        ]

    def get_available_colors(self, obj):
        seen = {}
        for variant in obj.variants.all():
            if variant.stock > 0 and variant.color_id not in seen:
                seen[variant.color_id] = variant.color

        return ColorSerializer(seen.values(), many=True).data

    def get_available_sizes(self, obj):
        seen = {}
        for variant in obj.variants.all():
            if variant.stock > 0 and variant.size_id not in seen:
                seen[variant.size_id] = variant.size

        return SizeSerializer(seen.values(), many=True).data


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ["id", "product", "datetime_created"]
        read_only_fields = fields


class WishlistCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("محصول مورد نظر یافت نشد.")
        return value
