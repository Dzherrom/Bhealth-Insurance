"""Helpers for the client self-service portal."""

from django.contrib.auth.models import User

from .models import Cliente, Poliza, PolizaCliente
from .serializers import normalize_role


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
        )
        .order_by('-ultima_actualizacion')
        .first()
    )
    if principal:
        return principal

    return (
        Poliza.objects.filter(polizacliente__cliente=cliente)
        .select_related('agente', 'plan', 'estado', 'plan__aseguradora', 'direccion_fisica')
        .prefetch_related('polizacliente_set__cliente', 'tarjetas_credito')
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
