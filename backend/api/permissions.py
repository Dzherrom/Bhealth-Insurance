from rest_framework import permissions

from .models import MatrizPermisoRol
from .roles import (
    ADMIN_ROLES,
    CRM_ROLES,
    USER_ADMIN_ROLES,
    can_view_sensitive_data as role_can_view_sensitive,
    is_crm_role,
    is_super_admin,
    normalize_role,
)


def check_status(request):
    if not request.user.is_authenticated:
        return False, None
    if request.user.is_superuser:
        return True, 'ACTIVE'
    if not hasattr(request.user, 'profile'):
        return False, None
    return True, request.user.profile.status


def _user_role(request) -> str:
    if request.user.is_superuser:
        return 'SUPER_ADMIN'
    return normalize_role(request.user.profile.role)


class IsSuperAdminRole(permissions.BasePermission):
    """Super Admin — control total del sistema."""

    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        return is_super_admin(_user_role(request))


# Alias legacy
IsAdminRole = IsSuperAdminRole


class IsDepartmentLeadRole(permissions.BasePermission):
    """Coordinador de departamento (LED)."""

    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        role = _user_role(request)
        return role in USER_ADMIN_ROLES


# Alias legacy
IsManagerRole = IsDepartmentLeadRole
IsAdminOrManagerRole = IsDepartmentLeadRole


class IsClientSupportRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        return _user_role(request) in {'SUPER_ADMIN', 'LED', 'CLIENT_SUPPORT'}


IsAsistenteRole = IsClientSupportRole


class IsHealthSherpaRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        return _user_role(request) in {'SUPER_ADMIN', 'LED', 'HEALTH_SHERPA', 'AGENTE'}


IsSherpaRole = IsHealthSherpaRole


class IsCobranzaRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        return _user_role(request) in {'SUPER_ADMIN', 'LED', 'COBRANZA'}


IsPagosRole = IsCobranzaRole


class IsGestionResolucionRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        return _user_role(request) in {'SUPER_ADMIN', 'LED', 'GESTION_RESOLUCION'}


IsCitasRole = IsGestionResolucionRole


class IsCRMNonBasicRole(permissions.BasePermission):
    """Permite acceso a roles CRM excepto USER/CLIENTE."""

    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        return is_crm_role(_user_role(request))


class IsClienteRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False
        if not hasattr(request.user, 'profile'):
            return False
        return normalize_role(request.user.profile.role) == 'CLIENTE'


class IsPolicyOwnerOrHigher(permissions.BasePermission):
    """Permiso a nivel objeto para edición de pólizas."""

    def has_object_permission(self, request, view, obj):
        auth, status = check_status(request)
        if not auth or status != 'ACTIVE':
            return False

        role = _user_role(request)

        if role in {'SUPER_ADMIN', 'LED', 'HEALTH_SHERPA', 'AGENTE', 'COBRANZA', 'GESTION_RESOLUCION', 'RECUPERACION', 'SOPORTE_CLIENTE', 'RECEPCION'}:
            return True

        if role == 'CLIENT_SUPPORT':
            if hasattr(obj, 'agente') and request.user.profile.agente:
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
    if role in ADMIN_ROLES:
        return True

    permiso = MatrizPermisoRol.objects.filter(
        role=role,
        modulo=modulo,
        accion=accion,
    ).first()

    if permiso is None:
        return False

    return permiso.permitido


def can_view_sensitive_data(request_user):
    if not request_user or not request_user.is_authenticated:
        return False
    if request_user.is_superuser:
        return True
    if not hasattr(request_user, 'profile'):
        return False
    return role_can_view_sensitive(request_user.profile.role)
