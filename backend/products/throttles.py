from rest_framework.throttling import AnonRateThrottle


class CommentCreateThrottle(AnonRateThrottle):
    scope = "comment_create"
