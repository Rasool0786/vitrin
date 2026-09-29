import django_filters as filters
from .models import Product


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    color = filters.CharFilter(field_name="variants__color__name", lookup_expr="iexact")
    size = filters.CharFilter(field_name="variants__size__name", lookup_expr="iexact")
    in_stock = filters.BooleanFilter(method="filter_in_stock")
    search = filters.CharFilter(field_name="title", lookup_expr="icontains")

    class Meta:
        model = Product
        fields = [
            "category",
            "min_price",
            "max_price",
            "color",
            "size",
            "in_stock",
            "search",
        ]

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(variants__stock__gt=0).distinct()
        return queryset
