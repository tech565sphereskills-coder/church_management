from rest_framework import permissions

def has_profile_perm(request, perm_field, required_role=None):
    if not (request.user and request.user.is_authenticated and hasattr(request.user, 'profile')):
        return False
    profile = request.user.profile
    if profile.role == 'admin':
        return True
    if required_role and profile.role == required_role:
        return True
    return getattr(profile, perm_field, False)

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'admin'
        )

class IsFinanceOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_profile_perm(request, 'can_manage_financials', 'finance_officer')

class IsAttendanceOfficerOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_profile_perm(request, 'can_manage_attendance', 'attendance_officer')

class IsChildrenOfficerOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_profile_perm(request, 'can_manage_children', 'children_officer')

class IsPrayerOfficerOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_profile_perm(request, 'can_manage_prayer_requests', 'prayer_officer')

class IsViewerOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and hasattr(request.user, 'profile')):
            return False
        
        # Admins have full access
        if request.user.profile.role == 'admin':
            return True
            
        # Others need at least some permission or to be a viewer
        return request.user.profile.role == 'viewer' or any([
            request.user.profile.can_manage_members,
            request.user.profile.can_manage_attendance,
            request.user.profile.can_manage_financials,
            request.user.profile.can_manage_departments,
            request.user.profile.can_manage_children,
            request.user.profile.can_manage_prayer_requests,
            request.user.profile.can_manage_calendar,
            request.user.profile.can_view_reports,
            request.user.profile.can_manage_settings
        ])

class ReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.method in permissions.SAFE_METHODS and
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile')
        )
