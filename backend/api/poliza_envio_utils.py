from __future__ import annotations

from decimal import Decimal

from .models import EstadoPoliza, Poliza


QUOTE_KEYWORDS = ('quote', 'cotiz', 'draft', 'borrad')


def is_quote_estado_name(estado_nombre: str | None) -> bool:
    if not estado_nombre:
        return False
    normalized = estado_nombre.strip().lower()
    return any(keyword in normalized for keyword in QUOTE_KEYWORDS)


def poliza_is_quote(poliza: Poliza) -> bool:
    estado_nombre = poliza.estado.nombre if poliza.estado_id else None
    if is_quote_estado_name(estado_nombre):
        return True
    return str(poliza.id_mercado or '').strip().upper().startswith('QUOTE-')


def _has_plan_info(poliza: Poliza) -> bool:
    if poliza.plan_id:
        return True
    return bool(poliza.aseguradora_id and (poliza.nombre_plan or '').strip())


def _has_financial_info(poliza: Poliza) -> bool:
    try:
        prima = Decimal(str(poliza.prima_mensual or 0))
        costo = Decimal(str(poliza.costo_poliza or 0))
    except Exception:
        return False
    return prima > 0 or costo > 0


def _get_principal_cliente(poliza: Poliza):
    links = list(poliza.polizacliente_set.select_related('cliente').all())
    principal = next((link for link in links if link.es_solicitante_principal and link.cliente_id), None)
    if principal:
        return principal.cliente
    if links:
        return links[0].cliente
    return None


def _has_payment_method(poliza: Poliza) -> bool:
    if hasattr(poliza, '_prefetched_objects_cache'):
        tarjetas = poliza._prefetched_objects_cache.get('tarjetas_credito')
        cuentas = poliza._prefetched_objects_cache.get('cuentas_bancarias')
        if tarjetas is not None and len(tarjetas) > 0:
            return True
        if cuentas is not None and len(cuentas) > 0:
            return True

    if poliza.tarjetas_credito.exists() or poliza.cuentas_bancarias.exists():
        return True

    info_pago = getattr(poliza, 'info_pago', None)
    if info_pago and (info_pago.fecha_primer_pago or info_pago.pago_recurrente):
        return True
    return False


def validate_poliza_for_envio(poliza: Poliza) -> list[str]:
    """Return human-readable validation errors. Empty list means ready to send."""
    errors: list[str] = []

    if not poliza_is_quote(poliza):
        errors.append('La póliza ya fue enviada y no está en estatus de cotización.')
        return errors

    if not poliza.fecha_efectiva:
        errors.append('Falta la fecha de efectividad.')

    if not poliza.agente_id:
        errors.append('Falta asignar un agente a la póliza.')

    if not _has_plan_info(poliza):
        errors.append('Falta información del plan (plan asignado o aseguradora + nombre del plan).')

    if not _has_financial_info(poliza):
        errors.append('Faltan montos de prima o costo de la póliza.')

    if not poliza.direccion_fisica_id:
        errors.append('Falta la dirección física de la póliza.')

    principal = _get_principal_cliente(poliza)
    if not principal:
        errors.append('Falta al menos un miembro titular/aplicante en la póliza.')
    else:
        if not (principal.email or '').strip():
            errors.append('Falta el correo electrónico del titular.')
        if not (principal.telefono or '').strip():
            errors.append('Falta el teléfono del titular.')

    if not _has_payment_method(poliza):
        errors.append('Falta información de pago (tarjeta, cuenta bancaria o cronograma de pago).')

    id_miembro = (poliza.id_miembro or '').strip().lower()
    if not id_miembro or id_miembro in {'pendiente', 'pend', 'n/a', 'na', '-'}:
        errors.append('Falta el ID de miembro de la póliza.')

    return errors


def resolve_estado_activo_enviada() -> EstadoPoliza:
    estado = EstadoPoliza.objects.filter(nombre__iexact='ACTIVA').first()
    if estado:
        return estado

    for candidate in ('Activa', 'new', 'NEW', 'venta nueva 2026', 'Enviada'):
        estado = EstadoPoliza.objects.filter(nombre__iexact=candidate).first()
        if estado:
            return estado

    return EstadoPoliza.objects.get_or_create(
        nombre='ACTIVA',
        defaults={'color': '#10b981', 'disponible_para_agentes': True},
    )[0]


def build_id_mercado_for_envio(poliza: Poliza) -> str | None:
    current = str(poliza.id_mercado or '').strip()
    if not current:
        return f'POL-{poliza.id}'
    if current.upper().startswith('QUOTE-'):
        return f'POL-{poliza.id}'
    return None
