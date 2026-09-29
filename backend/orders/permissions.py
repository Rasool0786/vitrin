from rest_framework import permissions


class IsOrderOwnerOrStaff(permissions.BasePermission):
    """
    Object-level: only the owner (or staff) can view/modify the order.
    """

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return (
            obj.user_id == request.user.id if request.user.is_authenticated else False
        )
