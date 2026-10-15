from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Q
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from . import models, serializers
from .filters import ProductFilter
from .pagination import ProductPagination, CommentPagination
from .permissions import IsAdminOrReadOnly
from .services import WishlistService
from .throttles import CommentCreateThrottle


class BaseAdminOrReadOnlyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]


class CategoryViewSet(BaseAdminOrReadOnlyViewSet):
    serializer_class = serializers.CategorySerializer
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]
    pagination_class = None

    def get_queryset(self):
        return models.Category.objects.annotate(
            product_count=Count(
                "products",
                distinct=True,
            ),
        )


class ColorViewSet(BaseAdminOrReadOnlyViewSet):
    queryset = models.Color.objects.all()
    serializer_class = serializers.ColorSerializer
    pagination_class = None


class SizeViewSet(BaseAdminOrReadOnlyViewSet):
    queryset = models.Size.objects.all()
    serializer_class = serializers.SizeSerializer
    pagination_class = None


class ProductViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = ProductPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    filterset_class = ProductFilter
    ordering_fields = ["price", "datetime_created", "average_rating"]
    ordering = ["-datetime_created"]
    search_fields = ["title", "description", "category__name"]

    def get_queryset(self):
        base = models.Product.objects.select_related("category").annotate(
            average_rating=Avg(
                "comments__stars",
                filter=Q(comments__is_published=True),
            ),
            comments_count=Count(
                "comments",
                filter=Q(comments__is_published=True),
                distinct=True,
            ),
        )

        if self.action == "list":
            return base.prefetch_related("images")

        return base.prefetch_related(
            "images",
            "variants__color",
            "variants__size",
            "comments",
        )

    def filter_queryset(self, queryset):
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            search_query = search_query.replace('ي', 'ی').replace('ك', 'ک')
            queryset = queryset.filter(
                Q(title__icontains=search_query) | 
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query)
            )
        
        for backend in list(self.filter_backends):
            if backend != filters.SearchFilter:
                queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return serializers.ProductListSerializer
        return serializers.ProductDetailSerializer

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="images",
        permission_classes=[IsAdminOrReadOnly],
    )
    def images(self, request, slug=None):
        product = self.get_object()
        if request.method == "GET":
            serializer = serializers.ProductImageSerializer(
                product.images.all(), many=True
            )
            return Response(serializer.data)
        serializer = serializers.ProductImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="variants",
        permission_classes=[IsAdminOrReadOnly],
    )
    def variants(self, request, slug=None):
        product = self.get_object()
        if request.method == "GET":
            serializer = serializers.ProductVariantSerializer(
                product.variants.all(), many=True
            )
            return Response(serializer.data)
        serializer = serializers.ProductVariantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="comments",
        permission_classes=[AllowAny],
        throttle_classes=[CommentCreateThrottle],
        pagination_class=CommentPagination,
    )
    def comments(self, request, slug=None):
        product = self.get_object()

        if request.method == "GET":
            qs = product.comments.filter(is_published=True)
            if request.user.is_authenticated and request.user.is_staff:
                qs = product.comments.all()

            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = serializers.CommentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = serializers.CommentSerializer(qs, many=True)
            return Response(serializer.data)

        serializer = serializers.CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(
            {
                "detail": _(
                    "Your comment has been submitted and is awaiting approval."
                ),
                "comment": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class CommentViewSet(viewsets.ModelViewSet):
    queryset = models.Comment.objects.select_related("product").all()
    serializer_class = serializers.CommentSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = CommentPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        return qs

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
        permission_classes=[IsAdminOrReadOnly],
    )
    def approve(self, request, pk=None):
        comment = self.get_object()
        comment.is_published = True
        comment.save(update_fields=["is_published", "datetime_updated"])
        return Response(
            {
                "detail": _("Comment approved."),
                "comment": serializers.CommentSerializer(comment).data,
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
        permission_classes=[IsAdminOrReadOnly],
    )
    def reject(self, request, pk=None):
        comment = self.get_object()
        comment.is_published = False
        comment.save(update_fields=["is_published", "datetime_updated"])
        return Response({"detail": _("Comment rejected.")})


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _service(self, request) -> WishlistService:
        return WishlistService(request)

    def list(self, request):
        service = self._service(request)
        product_ids = service.list_product_ids()

        products_qs = (
            models.Product.objects.filter(id__in=product_ids)
            .select_related("category")
            .prefetch_related("images")
            .annotate(
                average_rating=Avg(
                    "comments__stars",
                    filter=Q(comments__is_published=True),
                ),
                comments_count=Count(
                    "comments",
                    filter=Q(comments__is_published=True),
                    distinct=True,
                ),
            )
        )
        product_map = {p.id: p for p in products_qs}
        ordered_products = [
            product_map[pid] for pid in product_ids if pid in product_map
        ]

        serializer = serializers.ProductListSerializer(
            ordered_products, many=True, context={"request": request}
        )
        response = Response(
            {
                "count": len(ordered_products),
                "product_ids": [p.id for p in ordered_products],
                "results": serializer.data,
            }
        )
        service.attach_cookie_if_needed(response)
        return response

    def create(self, request):
        serializer = serializers.WishlistCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]

        service = self._service(request)
        created = service.add(product_id)

        response = Response(
            {
                "status": "added" if created else "exists",
                "product_id": product_id,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
        service.attach_cookie_if_needed(response)
        return response

    def destroy(self, request, product_id=None):
        service = self._service(request)
        removed = service.remove(int(product_id))

        if removed:
            response = Response(status=status.HTTP_204_NO_CONTENT)
        else:
            response = Response(
                {"detail": "این محصول در لیست علاقه‌مندی‌ها نیست."},
                status=status.HTTP_404_NOT_FOUND,
            )
        service.attach_cookie_if_needed(response)
        return response

    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request):
        serializer = serializers.WishlistCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]

        service = self._service(request)
        if service.contains(product_id):
            service.remove(product_id)
            response = Response({"status": "removed", "product_id": product_id})
        else:
            service.add(product_id)
            response = Response(
                {"status": "added", "product_id": product_id},
                status=status.HTTP_201_CREATED,
            )
        service.attach_cookie_if_needed(response)
        return response

    @action(detail=False, methods=["get"], url_path="ids")
    def ids(self, request):
        service = self._service(request)
        product_ids = service.list_product_ids()
        response = Response({"product_ids": product_ids})
        service.attach_cookie_if_needed(response)
        return response

    @action(
        detail=False,
        methods=["post"],
        url_path="merge",
        permission_classes=[IsAuthenticated],
    )
    def merge(self, request):
        service = self._service(request)
        count = service.merge_guest_into_user(request.user)
        response = Response(
            {"status": "merged", "items_added": count},
            status=status.HTTP_200_OK,
        )
        response.delete_cookie(WishlistService.COOKIE_NAME)
        return response
