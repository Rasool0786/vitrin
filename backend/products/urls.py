from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("colors", views.ColorViewSet, basename="color")
router.register("sizes", views.SizeViewSet, basename="size")
router.register("products", views.ProductViewSet, basename="product")
router.register("comments", views.CommentViewSet, basename="comment")
router.register("wishlist", views.WishlistViewSet, basename="wishlist")

urlpatterns = router.urls
