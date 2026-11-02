import pytest

from products.models import Comment

pytestmark = pytest.mark.django_db


class TestCommentList:
    def _url(self, product):
        return f"/api/products/{product.slug}/comments/"

    def test_public_sees_only_published(
        self, api_client, product, published_comment, unpublished_comment
    ):
        response = api_client.get(self._url(product))
        assert response.status_code == 200
        data = response.data.get("results", response.data)
        names = [c["name"] for c in data]
        assert "Alice" in names
        assert "Bob" not in names

    def test_staff_sees_all(
        self, staff_client, product, published_comment, unpublished_comment
    ):
        response = staff_client.get(self._url(product))
        assert response.status_code == 200
        data = response.data.get("results", response.data)
        names = [c["name"] for c in data]
        assert "Alice" in names
        assert "Bob" in names


class TestCommentCreate:
    def _url(self, product):
        return f"/api/products/{product.slug}/comments/"

    def test_guest_can_create_comment(self, api_client, product):
        payload = {"name": "Guest", "text": "Nice!", "stars": 5}
        response = api_client.post(
            self._url(product), payload, format="json"
        )
        assert response.status_code == 201
        assert Comment.objects.filter(name="Guest").exists()

    def test_created_comment_is_unpublished(self, api_client, product):
        payload = {"name": "Guest", "text": "Nice!", "stars": 4}
        api_client.post(self._url(product), payload, format="json")
        comment = Comment.objects.get(name="Guest")
        assert comment.is_published is False

    def test_stars_must_be_in_range(self, api_client, product):
        payload = {"name": "Guest", "text": "Bad stars", "stars": 10}
        response = api_client.post(
            self._url(product), payload, format="json"
        )
        assert response.status_code == 400

    def test_name_and_text_required(self, api_client, product):
        response = api_client.post(
            self._url(product), {"stars": 5}, format="json"
        )
        assert response.status_code == 400


class TestCommentModeration:
    def test_staff_can_approve(
        self, staff_client, unpublished_comment
    ):
        response = staff_client.post(
            f"/api/comments/{unpublished_comment.id}/approve/",
            format="json",
        )
        assert response.status_code == 200
        unpublished_comment.refresh_from_db()
        assert unpublished_comment.is_published is True

    def test_staff_can_reject(
        self, staff_client, published_comment
    ):
        response = staff_client.post(
            f"/api/comments/{published_comment.id}/reject/",
            format="json",
        )
        assert response.status_code == 200
        published_comment.refresh_from_db()
        assert published_comment.is_published is False

    def test_non_staff_cannot_approve(
        self, authenticated_client, unpublished_comment
    ):
        response = authenticated_client.post(
            f"/api/comments/{unpublished_comment.id}/approve/",
            format="json",
        )
        assert response.status_code == 403
