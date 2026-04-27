from rest_framework import permissions

def check_status(request):
    if not (request.user.is_authenticated and hasattr(request.user, 'profile')):
        return False, None
    return True, request.user.profile.status

class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        return request.user.profile.role == 'ADMIN'

class IsManagerRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER']

class IsAsistenteRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'ASISTENTE']

class IsSherpaRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'SHERPA']

class IsPagosRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'PAGOS']

class IsCitasRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'CITAS']

class IsPolicyOwnerOrHigher(permissions.BasePermission):
    """
    Object-level permission to only allow owners (Asistentes) of a policy to edit it.
    """
    def has_object_permission(self, request, view, obj):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False

        role = request.user.profile.role

        if role in ['ADMIN', 'MANAGER']:
            return True

        if role == 'ASISTENTE':
            if hasattr(obj, 'agente'):
                return obj.agente == request.user.profile.agente
            
        return False
