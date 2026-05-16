from rest_framework import permissions
from .models import MatrizPermisoRol


def normalize_role(role):
    return (role or '').strip().upper()

def check_status(request):
    if not request.user.is_authenticated:
        return False, None
    if request.user.is_superuser:
        return True, 'ACTIVE'
    if not hasattr(request.user, 'profile'):
        return False, None
    return True, request.user.profile.status

class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        if request.user.is_superuser:
            return True
        return normalize_role(request.user.profile.role) == 'ADMIN'

class IsManagerRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        if request.user.is_superuser:
            return True
        return normalize_role(request.user.profile.role) in ['ADMIN', 'MANAGER']

class IsAsistenteRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        if request.user.is_superuser:
            return True
        return normalize_role(request.user.profile.role) in ['ADMIN', 'MANAGER', 'ASISTENTE']

class IsSherpaRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        if request.user.is_superuser:
            return True
        return normalize_role(request.user.profile.role) in ['ADMIN', 'MANAGER', 'SHERPA']

class IsPagosRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        if request.user.is_superuser:
            return True
        return normalize_role(request.user.profile.role) in ['ADMIN', 'MANAGER', 'PAGOS']

class IsCitasRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False
        if request.user.is_superuser:
            return True
        return normalize_role(request.user.profile.role) in ['ADMIN', 'MANAGER', 'CITAS']


class IsCRMNonBasicRole(permissions.BasePermission):
    """Permite acceso a roles CRM excepto USER (usuario básico)."""

    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False

        if request.user.is_superuser:
            return True

        role = normalize_role(request.user.profile.role)
        return role in ['ADMIN', 'MANAGER', 'ASISTENTE', 'SHERPA', 'PAGOS', 'CITAS']

class IsPolicyOwnerOrHigher(permissions.BasePermission):
    """
    Object-level permission to only allow owners (Asistentes) of a policy to edit it.
    """
    def has_object_permission(self, request, view, obj):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE': return False

        if request.user.is_superuser:
            return True

        role = normalize_role(request.user.profile.role)

        if role in ['ADMIN', 'MANAGER', 'SHERPA', 'PAGOS', 'CITAS']:
            return True

        if role == 'ASISTENTE':
            if hasattr(obj, 'agente'):
                return obj.agente == request.user.profile.agente
            
        return False

def has_matrix_permission(user, modulo, accion):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if not hasattr(user, 'profile'):
        return False

    role = normalize_role(user.profile.role)
    if role == 'ADMIN':
        return True

    permiso = MatrizPermisoRol.objects.filter(
        role=role,
        modulo=modulo,
        accion=accion,
    ).first()

    if permiso is None:
        return False

    return permiso.permitido
