"""
Definición central de departamentos, roles y capacidades del CRM.

Fuente de verdad alineada con la arquitectura operativa de BHealth Insurance.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Departamentos operativos
# ---------------------------------------------------------------------------

DEPARTMENT_CHOICES = [
    ('RECEPCION', 'Recepción'),
    ('SOPORTE_CLIENTE', 'Soporte al Cliente'),
    ('GESTION_RESOLUCION', 'Gestión y Resolución'),
    ('AREA_COMERCIAL', 'Área Comercial'),
    ('HEALTH_SHERPA', 'Health Sherpa'),
    ('AGENTES', 'Agentes'),
    ('COBRANZA', 'Cobranza'),
    ('RECUPERACION', 'Recuperación'),
]

DEPARTMENT_CODES = {code for code, _ in DEPARTMENT_CHOICES}

# Rol operativo → departamento por defecto al asignar usuarios
DEFAULT_DEPARTMENT_BY_ROLE = {
    'RECEPCION': 'RECEPCION',
    'SOPORTE_CLIENTE': 'SOPORTE_CLIENTE',
    'CLIENT_SUPPORT': 'AREA_COMERCIAL',
    'GESTION_RESOLUCION': 'GESTION_RESOLUCION',
    'HEALTH_SHERPA': 'HEALTH_SHERPA',
    'AGENTE': 'AGENTES',
    'COBRANZA': 'COBRANZA',
    'RECUPERACION': 'RECUPERACION',
    'LED': None,  # LED puede pertenecer a cualquier departamento
    'SUPER_ADMIN': None,
}

# ---------------------------------------------------------------------------
# Roles de usuario
# ---------------------------------------------------------------------------

ROLE_CHOICES = [
    ('SUPER_ADMIN', 'Super Admin'),
    ('LED', 'Coordinador de Departamento (LED)'),
    ('CLIENT_SUPPORT', 'Client Support'),
    ('GESTION_RESOLUCION', 'Gestión y Resolución'),
    ('HEALTH_SHERPA', 'Health Sherpa'),
    ('AGENTE', 'Agente'),
    ('COBRANZA', 'Cobranza'),
    ('RECUPERACION', 'Recuperación'),
    ('RECEPCION', 'Recepción'),
    ('SOPORTE_CLIENTE', 'Soporte al Cliente'),
    ('CLIENTE', 'Cliente'),
    ('USER', 'Usuario Básico'),
]

ROLE_CODES = {code for code, _ in ROLE_CHOICES}

# Migración desde roles legacy (pre-refactor)
LEGACY_ROLE_MAP = {
    'ADMIN': 'SUPER_ADMIN',
    'MANAGER': 'LED',
    'ASISTENTE': 'CLIENT_SUPPORT',
    'SHERPA': 'HEALTH_SHERPA',
    'PAGOS': 'COBRANZA',
    'CITAS': 'GESTION_RESOLUCION',
}

# Roles con acceso al panel CRM (empleados)
CRM_ROLES = {
    'SUPER_ADMIN',
    'LED',
    'CLIENT_SUPPORT',
    'GESTION_RESOLUCION',
    'HEALTH_SHERPA',
    'AGENTE',
    'COBRANZA',
    'RECUPERACION',
    'RECEPCION',
    'SOPORTE_CLIENTE',
}

# Roles que pueden vincularse a un registro Agente (NPN)
AGENT_LINK_ROLES = {
    'SUPER_ADMIN',
    'LED',
    'CLIENT_SUPPORT',
    'HEALTH_SHERPA',
    'AGENTE',
    'COBRANZA',
    'GESTION_RESOLUCION',
    'RECUPERACION',
    'RECEPCION',
    'SOPORTE_CLIENTE',
}

# Jerarquía para asignación de roles (mayor = más privilegios)
ROLE_RANK = {
    'SUPER_ADMIN': 100,
    'LED': 90,
    'CLIENT_SUPPORT': 70,
    'GESTION_RESOLUCION': 70,
    'HEALTH_SHERPA': 70,
    'AGENTE': 70,
    'COBRANZA': 70,
    'RECUPERACION': 70,
    'RECEPCION': 60,
    'SOPORTE_CLIENTE': 65,
    'CLIENTE': 20,
    'USER': 10,
}

# Roles con visibilidad global de pólizas (sin filtro por NPN/cartera propia)
POLICY_GLOBAL_VIEW_ROLES = {
    'SUPER_ADMIN',
    'LED',
    'GESTION_RESOLUCION',
    'COBRANZA',
    'RECUPERACION',
    'RECEPCION',
    'SOPORTE_CLIENTE',
}

# Roles con visibilidad por NPN del agente vinculado
POLICY_NPN_SCOPED_ROLES = {
    'HEALTH_SHERPA',
    'AGENTE',
}

# Cartera propia (solo pólizas del agente asignado al usuario)
POLICY_OWN_PORTFOLIO_ROLES = {
    'CLIENT_SUPPORT',
}

# Datos sensibles (SSN, cuentas bancarias completas, descarga de docs)
SENSITIVE_DATA_ROLES = {
    'SUPER_ADMIN',
    'LED',
    'HEALTH_SHERPA',
}

# Administración de usuarios / configuración global
ADMIN_ROLES = {'SUPER_ADMIN'}
USER_ADMIN_ROLES = {'SUPER_ADMIN', 'LED'}


def normalize_role(role: str | None) -> str:
    """Normaliza rol a código canónico UPPERCASE, resolviendo aliases legacy."""
    if not role:
        return 'USER'
    canonical = str(role).strip().upper().replace('-', '_').replace(' ', '_')
    return LEGACY_ROLE_MAP.get(canonical, canonical)


def is_crm_role(role: str | None) -> bool:
    return normalize_role(role) in CRM_ROLES


def is_super_admin(role: str | None) -> bool:
    return normalize_role(role) == 'SUPER_ADMIN'


def is_department_lead(role: str | None) -> bool:
    return normalize_role(role) == 'LED'


def can_view_all_policies(role: str | None) -> bool:
    return normalize_role(role) in POLICY_GLOBAL_VIEW_ROLES


def can_view_npn_scoped_policies(role: str | None) -> bool:
    return normalize_role(role) in POLICY_NPN_SCOPED_ROLES


def can_view_own_portfolio(role: str | None) -> bool:
    return normalize_role(role) in POLICY_OWN_PORTFOLIO_ROLES


def can_view_sensitive_data(role: str | None) -> bool:
    return normalize_role(role) in SENSITIVE_DATA_ROLES


def role_to_jwt_claim(role: str | None) -> str:
    """Claim JWT en minúsculas para el frontend."""
    return normalize_role(role).lower()


def jwt_claim_to_role(claim: str | None) -> str:
    """Convierte claim JWT del frontend a rol canónico backend."""
    if not claim:
        return 'USER'
    upper = str(claim).strip().upper().replace('-', '_')
    legacy_from_lower = {v.lower(): k for k, v in LEGACY_ROLE_MAP.items()}
    if claim.lower() in legacy_from_lower:
        return LEGACY_ROLE_MAP[legacy_from_lower[claim.lower()]]
    return normalize_role(upper)
