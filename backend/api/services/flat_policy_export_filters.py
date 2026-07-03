from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping, Optional

from django.db.models import Q, QuerySet

from ..models import Poliza


def _parse_int(value: Optional[str]) -> Optional[int]:
    if value is None or str(value).strip() == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_date(value: Optional[str]):
    if not value or not str(value).strip():
        return None
    raw = str(value).strip()[:10]
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(raw).date()
    except ValueError:
        return None


def apply_flat_export_filters(queryset: QuerySet[Poliza], params: Mapping[str, Any]) -> QuerySet[Poliza]:
    etiqueta_id = _parse_int(params.get("etiqueta"))
    if etiqueta_id:
        queryset = queryset.filter(documentos__etiquetas__id=etiqueta_id).distinct()

    estado_id = _parse_int(params.get("estado"))
    if estado_id:
        queryset = queryset.filter(estado_id=estado_id)

    zip_code = (params.get("zip_code") or params.get("codigo_postal") or "").strip()
    if zip_code:
        queryset = queryset.filter(
            Q(direccion_fisica__zip_code__iexact=zip_code)
            | Q(direccion_postal__zip_code__iexact=zip_code)
            | Q(polizacliente__cliente__direccion_fisica__zip_code__iexact=zip_code)
        ).distinct()

    aseguradora_id = _parse_int(params.get("aseguradora") or params.get("compania"))
    if aseguradora_id:
        queryset = queryset.filter(
            Q(aseguradora_id=aseguradora_id) | Q(plan__aseguradora_id=aseguradora_id)
        ).distinct()

    tipo_producto_id = _parse_int(params.get("tipo_producto"))
    if tipo_producto_id:
        queryset = queryset.filter(tipo_producto_id=tipo_producto_id)

    fecha_efectiva_desde = _parse_date(params.get("fecha_efectiva_desde"))
    if fecha_efectiva_desde:
        queryset = queryset.filter(fecha_efectiva__gte=fecha_efectiva_desde)

    fecha_efectiva_hasta = _parse_date(params.get("fecha_efectiva_hasta"))
    if fecha_efectiva_hasta:
        queryset = queryset.filter(fecha_efectiva__lte=fecha_efectiva_hasta)

    fecha_creacion_desde = _parse_date(params.get("fecha_creacion_desde"))
    if fecha_creacion_desde:
        queryset = queryset.filter(fecha_envio__gte=fecha_creacion_desde)

    fecha_creacion_hasta = _parse_date(params.get("fecha_creacion_hasta"))
    if fecha_creacion_hasta:
        queryset = queryset.filter(fecha_envio__lte=fecha_creacion_hasta)

    aplicantes_desde = _parse_int(params.get("aplicantes_desde"))
    if aplicantes_desde is not None:
        queryset = queryset.filter(total_aplicantes__gte=aplicantes_desde)

    aplicantes_hasta = _parse_int(params.get("aplicantes_hasta"))
    if aplicantes_hasta is not None:
        queryset = queryset.filter(total_aplicantes__lte=aplicantes_hasta)

    agente_id = _parse_int(params.get("agente"))
    if agente_id:
        queryset = queryset.filter(agente_id=agente_id)

    return queryset
