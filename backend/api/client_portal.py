"""Helpers for the client self-service portal."""

from django.contrib.auth.models import User
from django.db import transaction

from .models import Cliente, Poliza, PolizaCliente, UserProfile


CLIENTE_ROLE = 'CLIENTE'

CLIENT_EDITABLE_FIELDS = frozenset({
    'fecha_nacimiento',
    'direccion',
    'telefono',
    'email',
    'estatus_poliza',
    'ingresos',
    'grupo_familiar',
    'tarjetas_digitales',
})

CLIENT_CAMPO_LABELS = {
    'fecha_nacimiento': 'Fecha de nacimiento',
    'direccion': 'Dirección completa',
    'telefono': 'Teléfono',
    'email': 'Correo electrónico',
    'estatus_poliza': 'Estatus de póliza',
    'ingresos': 'Ingresos',
    'grupo_familiar': 'Grupo familiar',
    'tarjetas_digitales': 'Tarjetas digitales',
}

DOCUMENTO_CATEGORIA_LABELS = {
    'IDENTIFICACION': 'Identificación',
    'ESTATUS_MIGRATORIO': 'Estatus migratorio',
    'CARTA_MERCADO': 'Carta de mercado',
    'ASEGURANZA': 'Aseguranza',
    'CONSENTIMIENTO': 'Consentimiento',
    'OTRO': 'Otro documento',
}


def normalize_role(role):
    return (role or '').strip().upper()


class PortalUserConflictError(Exception):
    def __init__(self, message: str, field: str = 'password_portal'):
        self.message = message
        self.field = field
        super().__init__(message)


def _build_unique_username(email: str) -> str:
    local = email.split('@')[0].strip() or 'cliente'
    base = local[:120]
    username = base
    suffix = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{suffix}'[:150]
        suffix += 1
    return username


@transaction.atomic
def ensure_portal_user_for_cliente(cliente: Cliente, password: str) -> tuple[User, bool]:
    """
    Crea o vincula un usuario CLIENTE para el portal.
    Returns (user, created_new_user).
    """
    email = (cliente.email or '').strip().lower()
    if not email:
        raise PortalUserConflictError(
            'El correo electrónico es obligatorio para crear la cuenta del portal.',
            field='email',
        )
    if not password or len(password.strip()) < 8:
        raise PortalUserConflictError(
            'La contraseña del portal debe tener al menos 8 caracteres.',
            field='password_portal',
        )

    password = password.strip()
    linked_profile = UserProfile.objects.filter(cliente=cliente, role=CLIENTE_ROLE).select_related('user').first()
    if linked_profile:
        user = linked_profile.user
        user.set_password(password)
        user.email = email
        user.first_name = cliente.primer_nombre or user.first_name
        user.last_name = cliente.apellido_paterno or user.last_name
        user.save(update_fields=['password', 'email', 'first_name', 'last_name'])
        return user, False

    existing_user = User.objects.filter(email__iexact=email).select_related('profile').first()
    if existing_user:
        profile = getattr(existing_user, 'profile', None)
        if not profile:
            raise PortalUserConflictError(
                'El correo ya está registrado pero no tiene perfil válido.',
                field='email',
            )
        if profile.cliente_id and profile.cliente_id != cliente.id:
            raise PortalUserConflictError(
                'Este correo ya está vinculado a otro cliente en el portal.',
                field='email',
            )
        role = normalize_role(profile.role)
        if role not in ('USER', 'CLIENTE'):
            raise PortalUserConflictError(
                'Este correo ya pertenece a un empleado del sistema.',
                field='email',
            )
        profile.role = CLIENTE_ROLE
        profile.cliente = cliente
        profile.save(update_fields=['role', 'cliente'])
        existing_user.set_password(password)
        existing_user.first_name = cliente.primer_nombre or existing_user.first_name
        existing_user.last_name = cliente.apellido_paterno or existing_user.last_name
        existing_user.save(update_fields=['password', 'first_name', 'last_name'])
        return existing_user, False

    username = _build_unique_username(email)
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=cliente.primer_nombre or '',
        last_name=cliente.apellido_paterno or '',
    )
    profile = user.profile
    profile.role = CLIENTE_ROLE
    profile.cliente = cliente
    profile.save(update_fields=['role', 'cliente'])
    return user, True


def get_portal_user_for_cliente(cliente: Cliente) -> User | None:
    profile = UserProfile.objects.filter(cliente=cliente, role=CLIENTE_ROLE).select_related('user').first()
    return profile.user if profile else None


def is_cliente_user(user: User) -> bool:
    if not user or not user.is_authenticated:
        return False
    if not hasattr(user, 'profile'):
        return False
    return normalize_role(user.profile.role) == CLIENTE_ROLE


def resolve_cliente_for_user(user: User) -> Cliente | None:
    if not user or not user.is_authenticated:
        return None

    profile = getattr(user, 'profile', None)
    if profile and profile.cliente_id:
        return profile.cliente

    if user.email:
        cliente = Cliente.objects.filter(email__iexact=user.email.strip()).first()
        if cliente and profile:
            profile.cliente = cliente
            if normalize_role(profile.role) == 'USER':
                profile.role = CLIENTE_ROLE
            profile.save(update_fields=['cliente', 'role'])
        return cliente

    return None


def get_cliente_poliza_ids(cliente: Cliente) -> set[int]:
    return set(
        PolizaCliente.objects.filter(cliente=cliente).values_list('poliza_id', flat=True)
    )


def user_owns_poliza(user: User, poliza: Poliza) -> bool:
    cliente = resolve_cliente_for_user(user)
    if not cliente:
        return False
    return PolizaCliente.objects.filter(poliza=poliza, cliente=cliente).exists()


def get_primary_poliza_for_cliente(cliente: Cliente) -> Poliza | None:
    principal = (
        Poliza.objects.filter(
            polizacliente__cliente=cliente,
            polizacliente__es_solicitante_principal=True,
        )
        .select_related('agente', 'plan', 'estado', 'plan__aseguradora', 'direccion_fisica')
        .prefetch_related(
            'polizacliente_set__cliente',
            'tarjetas_credito',
            'cuentas_bancarias',
        )
        .order_by('-ultima_actualizacion')
        .first()
    )
    if principal:
        return principal

    return (
        Poliza.objects.filter(polizacliente__cliente=cliente)
        .select_related('agente', 'plan', 'estado', 'plan__aseguradora', 'direccion_fisica')
        .prefetch_related('polizacliente_set__cliente', 'tarjetas_credito', 'cuentas_bancarias')
        .order_by('-ultima_actualizacion')
        .first()
    )


def format_direccion(direccion) -> str | None:
    if not direccion:
        return None
    parts = [
        direccion.linea1,
        direccion.linea2,
        direccion.ciudad,
        direccion.estado,
        direccion.zip_code,
    ]
    return ', '.join(part for part in parts if part)


def map_campo_to_tipo(campo: str) -> str:
    mapping = {
        'direccion': 'NUEVA_DIRECCION',
        'ingresos': 'CAMBIO_INGRESOS',
        'grupo_familiar': 'NUEVO_MIEMBRO',
        'tarjetas_digitales': 'OTROS',
        'fecha_nacimiento': 'OTROS',
        'telefono': 'OTROS',
        'email': 'OTROS',
        'estatus_poliza': 'OTROS',
    }
    return mapping.get(campo, 'OTROS')
