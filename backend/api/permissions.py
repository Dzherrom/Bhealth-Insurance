from rest_framework import permissions

def check_status(request):
    if not (request.user.is_authenticated and hasattr(request.user, 'profile')):
        return False, None
    return True, request.user.profile.status

class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role == 'ADMIN'

class IsManagerRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER']

class IsAgentL1Role(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'AGENT_L1']

class IsAgentL2Role(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'AGENT_L1', 'AGENT_L2']

class IsAgentL3Role(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'AGENT_L1', 'AGENT_L2', 'AGENT_L3']

class CanViewReports(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER']

class CanManageUsers(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role == 'ADMIN'

class CanPrintPolicies(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'AGENT_L1']

class IsPolicyOwnerOrHigher(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `agente` attribute.
    """
    def has_object_permission(self, request, view, obj):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False # Candidates don't own policies usually? Or maybe they do? Assuming False for now as per "only candidate permissions"

        role = request.user.profile.role

        # Admin, Manager, L1, L2 have access to all policies (L1/L2 of the agency, but here we assume one agency for now or handle agency logic separately)
        if role in ['ADMIN', 'MANAGER', 'AGENT_L1', 'AGENT_L2']:
            return True

        # Agent L3
        if role == 'AGENT_L3':
            # Check if obj has 'agente' field
            if hasattr(obj, 'agente'):
                # Check if the policy belongs to the user's agent profile
                return obj.agente == request.user.profile.agente
            
        return False

class IsRecruiterRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'RECRUITER']

class IsAccountantRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'ACCOUNTANT']

class IsCandidateRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return True
        return request.user.profile.role == 'CANDIDATE'

class IsStandardAgentRole(permissions.BasePermission):
    def has_permission(self, request, view):
        auth, status = check_status(request)
        if not auth: return False
        if status == 'INACTIVE': return request.method in permissions.SAFE_METHODS
        if status == 'CANDIDATE': return False
        return request.user.profile.role in ['ADMIN', 'MANAGER', 'AGENT']
