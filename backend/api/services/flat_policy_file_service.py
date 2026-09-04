import csv
import datetime
import io
import os
import uuid
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import openpyxl
from openpyxl.utils.datetime import from_excel
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone

from ..models import (
    Agencia,
    Agente,
    Aseguradora,
    Cliente,
    Direccion,
    EstadoPoliza,
    Plan,
    Poliza,
    PolizaCliente,
    TipoProducto,
)

# Formato compatible con ejemplo polizas.xlsx: 51 columnas base + 20 bloques de 16 columnas
BASE_COLUMNS_COUNT = 51
DEPENDENT_BLOCK_SIZE = 16
MAX_DEPENDENT_BLOCKS = 20

BASE_HEADERS: List[str] = [
    "AGENT",
    "AGENT NPN",
    "BROKER/AGENCY",
    "IS APPLICANT",
    "FULL NAME",
    "FIRST NAME",
    "MIDDLE NAME",
    "LAST NAME",
    "SECOND LAST NAME",
    "GENDER",
    "DATE OF BIRTH",
    "PHONE",
    "EMAIL",
    "ANNUAL INCOME",
    "MARITAL STATUS",
    "SSN",
    "COUNTRY OF BIRTH",
    "IMMIGRATION STATUS",
    "IMMIGRATION CATEGORY",
    "ADDRESS 1",
    "ADDRESS 2",
    "CITY",
    "STATE",
    "ZIP",
    "COUNTY",
    "MAILING ADDRESS 1",
    "MAILING ADDRESS 2",
    "MAILING CITY",
    "MAILING STATE",
    "MAILING ZIP",
    "MAILING COUNTY",
    "CARRIER/ISSUER",
    "PLAN",
    "PLAN ID",
    "MARKETPLACE ID",
    "MEMBER ID",
    "APPLICANTS",
    "POLICY COST",
    "SUBSIDY",
    "MONTHLY PREMIUM",
    "EFFECTIVE DATE",
    "STATUS",
    "ASSIGNED TO",
    "SUBMITTED",
    "LAST UPDATE",
    "CANCELLATION DATE",
    "IS DUPLICATE",
    "LAST DUPLICATE",
    "NPN USED IN MARKETPLACE",
    "FFM USED IN MARKETPLACE",
    "INTERNAL CODE",
]

DEPENDENT_HEADERS: List[str] = [
    "IS APPLICANT",
    "RELATIONSHIP",
    "FIRST NAME",
    "MIDDLE NAME",
    "LAST NAME",
    "SECOND LAST NAME",
    "GENDER",
    "DATE OF BIRTH",
    "PHONE",
    "EMAIL",
    "ANNUAL INCOME",
    "MARITAL STATUS",
    "SSN",
    "COUNTRY OF BIRTH",
    "IMMIGRATION STATUS",
    "IMMIGRATION CATEGORY",
]

BASE_ALIASES: Dict[str, Sequence[str]] = {
    "agent": ("AGENT", "AGENT NAME"),
    "agent_npn": ("AGENT NPN", "NPN"),
    "agency": ("BROKER/AGENCY", "AGENCY", "BROKER AGENCY"),
    "is_applicant": ("IS APPLICANT",),
    "full_name": ("FULL NAME",),
    "first_name": ("FIRST NAME", "APPLICANT FIRST NAME"),
    "middle_name": ("MIDDLE NAME",),
    "last_name": ("LAST NAME",),
    "second_last_name": ("SECOND LAST NAME",),
    "gender": ("GENDER",),
    "dob": ("DATE OF BIRTH", "DOB"),
    "phone": ("PHONE",),
    "email": ("EMAIL",),
    "income": ("ANNUAL INCOME",),
    "marital_status": ("MARITAL STATUS",),
    "ssn": ("SSN",),
    "country_birth": ("COUNTRY OF BIRTH",),
    "imm_status": ("IMMIGRATION STATUS",),
    "imm_category": ("IMMIGRATION CATEGORY",),
    "address_1": ("ADDRESS 1",),
    "address_2": ("ADDRESS 2",),
    "city": ("CITY",),
    "state": ("STATE",),
    "zip": ("ZIP", "ZIP CODE", "POSTAL CODE"),
    "county": ("COUNTY",),
    "mail_address_1": ("MAILING ADDRESS 1",),
    "mail_address_2": ("MAILING ADDRESS 2",),
    "mail_city": ("MAILING CITY",),
    "mail_state": ("MAILING STATE",),
    "mail_zip": ("MAILING ZIP",),
    "mail_county": ("MAILING COUNTY",),
    "carrier": ("CARRIER/ISSUER", "CARRIER", "ISSUER"),
    "plan_name": ("PLAN", "PLAN NAME"),
    "plan_id": ("PLAN ID",),
    "market_id": ("MARKETPLACE ID", "ID MERCADO"),
    "member_id": ("MEMBER ID", "ID MIEMBRO"),
    "applicants": ("APPLICANTS",),
    "policy_cost": ("POLICY COST", "COSTO POLIZA"),
    "subsidy": ("SUBSIDY", "SUBSIDIO"),
    "monthly_premium": ("MONTHLY PREMIUM", "PRIMA MENSUAL"),
    "effective_date": ("EFFECTIVE DATE", "FECHA EFECTIVA"),
    "status": ("STATUS", "ESTADO"),
    "assigned_to": ("ASSIGNED TO",),
    "submitted": ("SUBMITTED", "FECHA ENVIO"),
    "last_update": ("LAST UPDATE",),
    "cancellation_date": ("CANCELLATION DATE", "FECHA CANCELACION"),
    "is_duplicate": ("IS DUPLICATE",),
    "last_duplicate": ("LAST DUPLICATE",),
    "npn_market": ("NPN USED IN MARKETPLACE", "NPN MARKET"),
    "ffm_market": ("FFM USED IN MARKETPLACE", "FFM USED IN MARKET"),
    "internal_code": ("INTERNAL CODE", "ID INTERNO"),
}


def _clean(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_key(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def _parse_decimal(value: object, default: Decimal = Decimal("0")) -> Decimal:
    raw = _clean(value)
    if not raw:
        return default
    cleaned = raw.replace(",", "").replace("$", "")
    try:
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return default


def _parse_date(value: object) -> Optional[datetime.date]:
    if isinstance(value, datetime.datetime):
        return value.date()
    if isinstance(value, datetime.date):
        return value
    if isinstance(value, (int, float)) and value > 0:
        try:
            converted = from_excel(value)
            if isinstance(converted, datetime.datetime):
                return converted.date()
            if isinstance(converted, datetime.date):
                return converted
        except (TypeError, ValueError):
            pass

    raw = _clean(value)
    if not raw:
        return None

    if raw.replace(".", "", 1).isdigit():
        try:
            excel_value = float(raw)
            if excel_value > 20000:
                converted = from_excel(excel_value)
                if isinstance(converted, datetime.datetime):
                    return converted.date()
                if isinstance(converted, datetime.date):
                    return converted
        except (TypeError, ValueError):
            pass

    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%d/%m/%Y"):
        try:
            return datetime.datetime.strptime(raw[:10], fmt).date()
        except ValueError:
            continue

    try:
        return datetime.date.fromisoformat(raw[:10])
    except ValueError:
        return None


def _parse_datetime(value: object) -> Optional[datetime.datetime]:
    raw = _clean(value)
    if not raw:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%m/%d/%Y %H:%M:%S", "%Y-%m-%d"):
        try:
            parsed = datetime.datetime.strptime(raw, fmt)
            if timezone.is_naive(parsed):
                return timezone.make_aware(parsed, timezone.get_current_timezone())
            return parsed
        except ValueError:
            continue
    date_only = _parse_date(raw)
    if date_only:
        return timezone.make_aware(datetime.datetime.combine(date_only, datetime.time.min))
    return None


def _infer_metal(plan_name: str) -> Optional[str]:
    normalized = _normalize_key(plan_name)
    for metal, aliases in {
        "BRONCE": ("bronze", "bronce"),
        "PLATA": ("silver", "plata"),
        "ORO": ("gold", "oro"),
        "PLATINO": ("platinum", "platino"),
    }.items():
        if any(alias in normalized for alias in aliases):
            return metal
    return None


def _format_date(value: Optional[datetime.date]) -> str:
    return value.isoformat() if value else ""


def _format_datetime(value: Optional[datetime.datetime]) -> str:
    if not value:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    return value.strftime("%Y-%m-%d %H:%M:%S")


def _split_full_name(full_name: str) -> Tuple[str, str, str, str]:
    parts = [p for p in full_name.split() if p]
    if not parts:
        return "", "", "", ""
    if len(parts) == 1:
        return parts[0], "", "", ""
    if len(parts) == 2:
        return parts[0], "", parts[1], ""
    if len(parts) == 3:
        return parts[0], parts[1], parts[2], ""
    return parts[0], " ".join(parts[1:-2]), parts[-2], parts[-1]


def _safe_email(value: str) -> str:
    email = value.strip().lower()
    if email and "@" in email:
        return email
    return f"import-{uuid.uuid4().hex[:12]}@import.local"


def _safe_ssn(value: str) -> str:
    raw = "".join(ch for ch in value if ch.isdigit())
    return raw or f"TMP-{uuid.uuid4().hex[:12]}"


def _bool_label(value: bool) -> str:
    return "TRUE" if value else "FALSE"


@dataclass
class ImportSummary:
    processed_rows: int = 0
    created_policies: int = 0
    updated_policies: int = 0
    created_dependents: int = 0
    updated_dependents: int = 0
    errors: Optional[List[str]] = None
    imported_policies: Optional[List[Dict[str, object]]] = None

    def to_dict(self) -> Dict[str, object]:
        return {
            "processed_rows": self.processed_rows,
            "created_policies": self.created_policies,
            "updated_policies": self.updated_policies,
            "created_dependents": self.created_dependents,
            "updated_dependents": self.updated_dependents,
            "errors": self.errors or [],
            "imported_policies": self.imported_policies or [],
        }


class FlatPolicyFileService:
    BASE_COLUMNS_COUNT = BASE_COLUMNS_COUNT
    DEPENDENT_BLOCK_SIZE = DEPENDENT_BLOCK_SIZE
    MAX_DEPENDENT_BLOCKS = MAX_DEPENDENT_BLOCKS
    BASE_HEADERS = BASE_HEADERS
    DEPENDENT_HEADERS = DEPENDENT_HEADERS
    BASE_ALIASES = BASE_ALIASES

    def build_export_headers(self, dependent_blocks: int = MAX_DEPENDENT_BLOCKS) -> List[str]:
        headers = list(BASE_HEADERS)
        for _ in range(dependent_blocks):
            headers.extend(DEPENDENT_HEADERS)
        return headers

    def import_file(self, file_obj) -> ImportSummary:
        headers, rows = self._read_file(file_obj)
        return self.import_rows(headers, rows)

    def import_rows(
        self,
        headers: Sequence[str],
        rows: Sequence[Sequence[object]],
        start_row_index: int = 2,
    ) -> ImportSummary:
        summary = ImportSummary(errors=[], imported_policies=[])

        for row_index, row in enumerate(rows, start=start_row_index):
            if not any(_clean(value) for value in row):
                continue

            summary.processed_rows += 1
            try:
                with transaction.atomic():
                    self._import_row(headers=headers, row=row, summary=summary, row_index=row_index)
            except Exception as exc:  # noqa: BLE001
                summary.errors.append(f"Fila {row_index}: {exc}")

        return summary

    def export_policies_to_xlsx_response(self, queryset: Iterable[Poliza]) -> HttpResponse:
        policies = list(queryset)
        headers = self.build_export_headers(MAX_DEPENDENT_BLOCKS)

        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = "Sheet1"
        sheet.append(headers)

        for policy in policies:
            dependents = list(
                policy.polizacliente_set.select_related("cliente")
                .filter(es_solicitante_principal=False)
            )
            row = self._build_base_export_row(policy)
            for block_idx in range(MAX_DEPENDENT_BLOCKS):
                if block_idx < len(dependents):
                    row.extend(self._build_dependent_export_row(dependents[block_idx]))
                else:
                    row.extend([""] * DEPENDENT_BLOCK_SIZE)
            sheet.append(row)

        buffer = io.BytesIO()
        workbook.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="polizas_export.xlsx"'
        return response

    def export_policies_to_csv_response(self, queryset: Iterable[Poliza]) -> HttpResponse:
        policies = list(queryset)
        headers = self.build_export_headers(MAX_DEPENDENT_BLOCKS)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="polizas_export.csv"'

        writer = csv.writer(response)
        writer.writerow(headers)

        for policy in policies:
            dependents = list(
                policy.polizacliente_set.select_related("cliente")
                .filter(es_solicitante_principal=False)
            )
            row = self._build_base_export_row(policy)
            for block_idx in range(MAX_DEPENDENT_BLOCKS):
                if block_idx < len(dependents):
                    row.extend(self._build_dependent_export_row(dependents[block_idx]))
                else:
                    row.extend([""] * DEPENDENT_BLOCK_SIZE)
            writer.writerow(row)

        return response

    def _read_file(self, file_obj) -> Tuple[List[str], List[List[object]]]:
        _, ext = os.path.splitext(file_obj.name.lower())

        if ext in (".xlsx", ".xlsm", ".xltx", ".xltm"):
            workbook = openpyxl.load_workbook(file_obj, data_only=True)
            sheet = workbook.active
            rows = list(sheet.iter_rows(values_only=True))
            if len(rows) < 2:
                raise ValueError("El archivo Excel no contiene filas de datos")
            headers = [_clean(value) for value in rows[0]]
            data = [list(row) for row in rows[1:]]
            return headers, data

        decoded = file_obj.read().decode("utf-8-sig")
        reader = csv.reader(io.StringIO(decoded))
        rows = list(reader)
        if len(rows) < 2:
            raise ValueError("El archivo CSV no contiene filas de datos")

        headers = [_clean(value) for value in rows[0]]
        data = [list(row) for row in rows[1:]]
        return headers, data

    def _value(self, headers: Sequence[str], values: Sequence[object], key: str) -> str:
        normalized = {_normalize_key(h): idx for idx, h in enumerate(headers) if h}
        for alias in BASE_ALIASES.get(key, ()):
            idx = normalized.get(_normalize_key(alias))
            if idx is not None and idx < len(values):
                value = _clean(values[idx])
                if value:
                    return value
        return ""

    def _import_row(
        self,
        headers: Sequence[str],
        row: Sequence[object],
        summary: ImportSummary,
        row_index: int = 0,
    ) -> None:
        base_headers = list(headers[:BASE_COLUMNS_COUNT])
        if len(base_headers) < BASE_COLUMNS_COUNT:
            base_headers.extend([""] * (BASE_COLUMNS_COUNT - len(base_headers)))
        base_values = list(row[:BASE_COLUMNS_COUNT])
        if len(base_values) < BASE_COLUMNS_COUNT:
            base_values.extend([""] * (BASE_COLUMNS_COUNT - len(base_values)))

        agent_name = self._value(base_headers, base_values, "agent") or "Agente importado"
        agent_npn = self._value(base_headers, base_values, "agent_npn") or f"NPN-{uuid.uuid4().hex[:10]}"
        agency_name = self._value(base_headers, base_values, "agency") or "Agencia importada"

        agency, _ = Agencia.objects.get_or_create(nombre=agency_name)
        agent, _ = Agente.objects.get_or_create(
            npn=agent_npn,
            defaults={"nombre_completo": agent_name, "agencia": agency},
        )
        if agent.nombre_completo != agent_name or agent.agencia_id != agency.id:
            agent.nombre_completo = agent_name
            agent.agencia = agency
            agent.save(update_fields=["nombre_completo", "agencia"])

        full_name = self._value(base_headers, base_values, "full_name")
        first_name = self._value(base_headers, base_values, "first_name")
        middle_name = self._value(base_headers, base_values, "middle_name")
        last_name = self._value(base_headers, base_values, "last_name")
        second_last_name = self._value(base_headers, base_values, "second_last_name")

        if full_name and not (first_name and last_name):
            parsed_first, parsed_middle, parsed_last, parsed_second = _split_full_name(full_name)
            first_name = first_name or parsed_first
            middle_name = middle_name or parsed_middle
            last_name = last_name or parsed_last
            second_last_name = second_last_name or parsed_second

        principal_data = {
            "primer_nombre": first_name or "SinNombre",
            "segundo_nombre": middle_name or "",
            "apellido_paterno": last_name or "SinApellido",
            "apellido_materno": second_last_name or "",
            "genero": self._value(base_headers, base_values, "gender") or "No especificado",
            "fecha_nacimiento": _parse_date(self._value(base_headers, base_values, "dob")) or datetime.date(1900, 1, 1),
            "telefono": self._value(base_headers, base_values, "phone"),
            "email": _safe_email(self._value(base_headers, base_values, "email")),
            "ingreso_anual": _parse_decimal(self._value(base_headers, base_values, "income")),
            "estado_civil": self._value(base_headers, base_values, "marital_status") or "No especificado",
            "pais_nacimiento": self._value(base_headers, base_values, "country_birth") or "No especificado",
            "estado_inmigracion": self._value(base_headers, base_values, "imm_status") or "No especificado",
            "categoria_inmigracion": self._value(base_headers, base_values, "imm_category"),
        }

        principal_ssn = _safe_ssn(self._value(base_headers, base_values, "ssn"))
        principal = self._upsert_client(principal_data, principal_ssn)

        physical_address = self._build_address(
            self._value(base_headers, base_values, "address_1"),
            self._value(base_headers, base_values, "address_2"),
            self._value(base_headers, base_values, "city"),
            self._value(base_headers, base_values, "state"),
            self._value(base_headers, base_values, "zip"),
            self._value(base_headers, base_values, "county"),
        )
        mailing_address = self._build_address(
            self._value(base_headers, base_values, "mail_address_1"),
            self._value(base_headers, base_values, "mail_address_2"),
            self._value(base_headers, base_values, "mail_city"),
            self._value(base_headers, base_values, "mail_state"),
            self._value(base_headers, base_values, "mail_zip"),
            self._value(base_headers, base_values, "mail_county"),
        )

        if physical_address:
            principal.direccion_fisica = physical_address
            principal.direccion_postal = mailing_address or physical_address
            principal.direccion_facturacion = physical_address
            principal.save(update_fields=["direccion_fisica", "direccion_postal", "direccion_facturacion"])

        policy, created_policy = self._upsert_policy(base_headers, base_values, agent, physical_address, mailing_address)
        if created_policy:
            summary.created_policies += 1
        else:
            summary.updated_policies += 1

        if summary.imported_policies is not None:
            brief = self._policy_import_brief(policy, "created" if created_policy else "updated")
            brief["row_index"] = row_index
            summary.imported_policies.append(brief)

        PolizaCliente.objects.update_or_create(
            poliza=policy,
            cliente=principal,
            defaults={
                "es_solicitante_principal": True,
                "es_aplicante": True,
                "relacion": "Self",
                "direccion_residencia": physical_address,
                "direccion_postal": mailing_address or physical_address,
            },
        )

        dependent_values = list(row[BASE_COLUMNS_COUNT:])
        for idx in range(0, len(dependent_values), DEPENDENT_BLOCK_SIZE):
            block = dependent_values[idx : idx + DEPENDENT_BLOCK_SIZE]
            if len(block) < DEPENDENT_BLOCK_SIZE:
                continue
            if not any(_clean(v) for v in block[2:]):
                continue

            dep_client, dep_created = self._upsert_dependent(block)
            relation = _clean(block[1]) or "Dependent"
            is_applicant = _clean(block[0]).upper() in {"TRUE", "YES", "SI", "SÍ", "1"}

            PolizaCliente.objects.update_or_create(
                poliza=policy,
                cliente=dep_client,
                defaults={
                    "es_solicitante_principal": False,
                    "es_aplicante": is_applicant,
                    "relacion": relation,
                    "direccion_residencia": physical_address,
                    "direccion_postal": mailing_address or physical_address,
                },
            )

            if dep_created:
                summary.created_dependents += 1
            else:
                summary.updated_dependents += 1

    def _build_address(
        self,
        line1: str,
        line2: str,
        city: str,
        state: str,
        zip_code: str,
        county: str,
    ) -> Optional[Direccion]:
        if not (line1 and city and state and zip_code):
            return None
        return Direccion.objects.get_or_create(
            linea1=line1,
            linea2=line2 or "",
            ciudad=city,
            estado=state,
            zip_code=zip_code,
            condado=county or "N/A",
        )[0]

    def _default_tipo_producto(self) -> TipoProducto:
        return TipoProducto.objects.get_or_create(nombre="Health Insurance (ACA)")[0]

    def _upsert_client(self, client_data: Dict[str, object], ssn: str) -> Cliente:
        email = str(client_data.get("email", "")).strip().lower()
        client = Cliente.objects.filter(ssn=ssn).first() if ssn else None
        if client is None and email:
            client = Cliente.objects.filter(email=email).first()

        if client is None:
            return Cliente.objects.create(ssn=ssn, **client_data)

        changed_fields: List[str] = []
        for field, value in client_data.items():
            if value not in (None, "") and getattr(client, field) != value:
                setattr(client, field, value)
                changed_fields.append(field)

        if client.ssn != ssn and ssn:
            client.ssn = ssn
            changed_fields.append("ssn")

        if changed_fields:
            client.save(update_fields=changed_fields)
        return client

    def _upsert_dependent(self, block: Sequence[object]) -> Tuple[Cliente, bool]:
        dep_data = {
            "primer_nombre": _clean(block[2]) or "SinNombre",
            "segundo_nombre": _clean(block[3]),
            "apellido_paterno": _clean(block[4]) or "SinApellido",
            "apellido_materno": _clean(block[5]),
            "genero": _clean(block[6]) or "No especificado",
            "fecha_nacimiento": _parse_date(block[7]) or datetime.date(1900, 1, 1),
            "telefono": _clean(block[8]),
            "email": _safe_email(_clean(block[9])),
            "ingreso_anual": _parse_decimal(block[10]),
            "estado_civil": _clean(block[11]) or "No especificado",
            "pais_nacimiento": _clean(block[13]) or "No especificado",
            "estado_inmigracion": _clean(block[14]) or "No especificado",
            "categoria_inmigracion": _clean(block[15]),
        }
        ssn = _safe_ssn(_clean(block[12]))
        existing = Cliente.objects.filter(ssn=ssn).first() or Cliente.objects.filter(email=dep_data["email"]).first()
        if existing is None:
            return Cliente.objects.create(ssn=ssn, **dep_data), True

        changed: List[str] = []
        for key, value in dep_data.items():
            if value not in (None, "") and getattr(existing, key) != value:
                setattr(existing, key, value)
                changed.append(key)
        if existing.ssn != ssn and ssn:
            existing.ssn = ssn
            changed.append("ssn")
        if changed:
            existing.save(update_fields=changed)
        return existing, False

    def _upsert_policy(
        self,
        base_headers: Sequence[str],
        base_values: Sequence[object],
        agent: Agente,
        physical_address: Optional[Direccion],
        mailing_address: Optional[Direccion],
    ) -> Tuple[Poliza, bool]:
        carrier_name = self._value(base_headers, base_values, "carrier") or "Sin aseguradora"
        plan_id = self._value(base_headers, base_values, "plan_id") or "UNKNOWN"
        plan_name = self._value(base_headers, base_values, "plan_name") or plan_id
        member_id = self._value(base_headers, base_values, "member_id")
        market_id = self._value(base_headers, base_values, "market_id")
        internal_code = self._value(base_headers, base_values, "internal_code")

        insurer, _ = Aseguradora.objects.get_or_create(nombre=carrier_name)
        default_tipo = self._default_tipo_producto()
        plan, _ = Plan.objects.get_or_create(
            id_plan_aseguradora=plan_id,
            aseguradora=insurer,
            defaults={"nombre": plan_name, "tipo_producto": default_tipo},
        )
        if plan.tipo_producto_id is None:
            plan.tipo_producto = default_tipo
            plan.save(update_fields=["tipo_producto"])
        if plan.nombre != plan_name and plan_name:
            plan.nombre = plan_name
            plan.save(update_fields=["nombre"])

        status_name = self._value(base_headers, base_values, "status") or "Pendiente"
        policy_status, _ = EstadoPoliza.objects.get_or_create(nombre=status_name)

        lookup = None
        if member_id:
            lookup = {"id_miembro": member_id}
        elif internal_code:
            lookup = {"id_interno": internal_code}
        elif market_id:
            lookup = {"id_mercado": market_id}
        else:
            lookup = {"id_interno": f"IMPORT-{uuid.uuid4().hex[:10]}"}

        policy = Poliza.objects.filter(**lookup).first()
        created = policy is None
        if policy is None:
            policy = Poliza(**lookup)

        if not policy.id_mercado:
            policy.id_mercado = market_id or f"MKT-{uuid.uuid4().hex[:10]}"

        policy.id_miembro = member_id or policy.id_miembro or f"MEM-{uuid.uuid4().hex[:10]}"
        policy.id_interno = internal_code or policy.id_interno
        policy.agente = agent
        policy.plan = plan
        policy.aseguradora = insurer
        policy.nombre_plan = plan_name
        policy.estado = policy_status
        policy.metal = _infer_metal(plan_name) or policy.metal
        if not policy.tipo_producto_id:
            policy.tipo_producto = self._default_tipo_producto()
        policy.costo_poliza = _parse_decimal(self._value(base_headers, base_values, "policy_cost"))
        policy.subsidio = _parse_decimal(self._value(base_headers, base_values, "subsidy"))
        policy.prima_mensual = _parse_decimal(self._value(base_headers, base_values, "monthly_premium"))
        policy.fecha_efectiva = _parse_date(self._value(base_headers, base_values, "effective_date"))
        policy.fecha_envio = _parse_date(self._value(base_headers, base_values, "submitted")) or datetime.date.today()
        policy.fecha_cancelacion = _parse_date(self._value(base_headers, base_values, "cancellation_date"))
        policy.ffm_mercado = self._value(base_headers, base_values, "ffm_market")
        policy.npn_mercado = self._value(base_headers, base_values, "npn_market")
        policy.es_duplicado = self._value(base_headers, base_values, "is_duplicate").upper() in {"TRUE", "YES", "1"}
        policy.ultimo_duplicado = self._value(base_headers, base_values, "last_duplicate") or policy.ultimo_duplicado

        applicants_raw = self._value(base_headers, base_values, "applicants")
        if applicants_raw.isdigit():
            policy.total_aplicantes = int(applicants_raw)

        if physical_address:
            policy.direccion_fisica = physical_address
        if mailing_address:
            policy.direccion_postal = mailing_address
        elif physical_address:
            policy.direccion_postal = physical_address

        policy.save()
        return policy, created

    def _policy_import_brief(self, policy: Poliza, action: str) -> Dict[str, object]:
        principal_name = ""
        principal_link = (
            policy.polizacliente_set.select_related("cliente")
            .filter(es_solicitante_principal=True)
            .first()
        )
        if principal_link and principal_link.cliente:
            client = principal_link.cliente
            principal_name = " ".join(
                part
                for part in [
                    client.primer_nombre,
                    client.segundo_nombre,
                    client.apellido_paterno,
                    client.apellido_materno,
                ]
                if part
            )

        return {
            "id": policy.id,
            "id_mercado": policy.id_mercado,
            "id_miembro": policy.id_miembro,
            "cliente_principal": principal_name,
            "agente_nombre": policy.agente.nombre_completo if policy.agente_id else "",
            "estado_nombre": policy.estado.nombre if policy.estado_id else "",
            "fecha_efectiva": _format_date(policy.fecha_efectiva),
            "total_aplicantes": policy.total_aplicantes or 0,
            "action": action,
        }

    def _build_base_export_row(self, policy: Poliza) -> List[object]:
        principal_link = (
            policy.polizacliente_set.select_related("cliente")
            .filter(es_solicitante_principal=True)
            .first()
        )
        principal = principal_link.cliente if principal_link else None
        agency_name = policy.agente.agencia.nombre if policy.agente and policy.agente.agencia_id else ""
        assigned = ", ".join(
            user.get_full_name() or user.username
            for user in policy.colaboradores.all()
        )

        row: List[object] = [""] * BASE_COLUMNS_COUNT
        row[0] = policy.agente.nombre_completo if policy.agente else ""
        row[1] = policy.agente.npn if policy.agente else ""
        row[2] = agency_name
        row[3] = "TRUE"

        if principal:
            row[4] = " ".join(
                part
                for part in [
                    principal.primer_nombre,
                    principal.segundo_nombre,
                    principal.apellido_paterno,
                    principal.apellido_materno,
                ]
                if part
            )
            row[5] = principal.primer_nombre
            row[6] = principal.segundo_nombre or ""
            row[7] = principal.apellido_paterno
            row[8] = principal.apellido_materno or ""
            row[9] = principal.genero
            row[10] = _format_date(principal.fecha_nacimiento)
            row[11] = principal.telefono
            row[12] = principal.email
            row[13] = float(principal.ingreso_anual or 0)
            row[14] = principal.estado_civil
            row[15] = principal.ssn
            row[16] = principal.pais_nacimiento
            row[17] = principal.estado_inmigracion
            row[18] = principal.categoria_inmigracion or ""

            physical = principal.direccion_fisica or policy.direccion_fisica
            if physical:
                row[19] = physical.linea1
                row[20] = physical.linea2 or ""
                row[21] = physical.ciudad
                row[22] = physical.estado
                row[23] = physical.zip_code
                row[24] = physical.condado

            postal = principal.direccion_postal or policy.direccion_postal
            if postal:
                row[25] = postal.linea1
                row[26] = postal.linea2 or ""
                row[27] = postal.ciudad
                row[28] = postal.estado
                row[29] = postal.zip_code
                row[30] = postal.condado

        carrier = policy.aseguradora.nombre if policy.aseguradora_id else (
            policy.plan.aseguradora.nombre if policy.plan and policy.plan.aseguradora_id else ""
        )
        row[31] = carrier
        row[32] = policy.nombre_plan or (policy.plan.nombre if policy.plan else "")
        row[33] = policy.plan.id_plan_aseguradora if policy.plan else policy.id_plan_cms or ""
        row[34] = policy.id_mercado
        row[35] = policy.id_miembro
        row[36] = policy.total_aplicantes or 1
        row[37] = float(policy.costo_poliza or 0)
        row[38] = float(policy.subsidio or 0)
        row[39] = float(policy.prima_mensual or 0)
        row[40] = _format_date(policy.fecha_efectiva)
        row[41] = policy.estado.nombre if policy.estado else ""
        row[42] = assigned
        row[43] = _format_datetime(
            timezone.make_aware(datetime.datetime.combine(policy.fecha_envio, datetime.time.min))
            if policy.fecha_envio else None
        )
        row[44] = _format_datetime(policy.ultima_actualizacion)
        row[45] = _format_date(policy.fecha_cancelacion)
        row[46] = _bool_label(bool(policy.es_duplicado))
        row[47] = policy.ultimo_duplicado or ""
        row[48] = policy.npn_mercado or ""
        row[49] = policy.ffm_mercado or ""
        row[50] = policy.id_interno or ""
        return row

    def _build_dependent_export_row(self, dependent_link: PolizaCliente) -> List[object]:
        dep = dependent_link.cliente
        return [
            _bool_label(bool(dependent_link.es_aplicante)),
            dependent_link.relacion or "Dependent",
            dep.primer_nombre,
            dep.segundo_nombre or "",
            dep.apellido_paterno,
            dep.apellido_materno or "",
            dep.genero,
            _format_date(dep.fecha_nacimiento),
            dep.telefono,
            dep.email,
            float(dep.ingreso_anual or 0),
            dep.estado_civil,
            dep.ssn,
            dep.pais_nacimiento,
            dep.estado_inmigracion,
            dep.categoria_inmigracion or "",
        ]
