from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role in their profile.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'admin'
        )

class IsFinanceOfficer(permissions.BasePermission):
    """
    Allows access only to users with the 'finance_officer' role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'finance_officer'
        )

class IsAttendanceOfficerOrHigher(permissions.BasePermission):
    """
    Allows access to users with 'admin' or 'attendance_officer' roles.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and hasattr(request.user, 'profile')):
            return False
        
        return request.user.profile.role in ['admin', 'attendance_officer']

class IsViewerOrHigher(permissions.BasePermission):
    """
    Allows access to users with 'admin', 'attendance_officer', or 'viewer' roles.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and hasattr(request.user, 'profile')):
            return False
        
        return request.user.profile.role in ['admin', 'attendance_officer', 'finance_officer', 'viewer']

class ReadOnly(permissions.BasePermission):
    """
    Allows read-only access to any authenticated user with a profile.
    """
    def has_permission(self, request, view):
        return bool(
            request.method in permissions.SAFE_METHODS and
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile')
        )
