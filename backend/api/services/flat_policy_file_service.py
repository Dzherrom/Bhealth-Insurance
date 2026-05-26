import csv
import datetime
import io
import os
import uuid
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import openpyxl
from django.db import transaction
from django.http import HttpResponse

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
)


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
    raw = _clean(value)
    if not raw:
        return None

    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%d/%m/%Y"):
        try:
            return datetime.datetime.strptime(raw, fmt).date()
        except ValueError:
            continue

    try:
        return datetime.date.fromisoformat(raw)
    except ValueError:
        return None


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


@dataclass
class ImportSummary:
    processed_rows: int = 0
    created_policies: int = 0
    updated_policies: int = 0
    created_dependents: int = 0
    updated_dependents: int = 0
    errors: Optional[List[str]] = None

    def to_dict(self) -> Dict[str, object]:
        return {
            "processed_rows": self.processed_rows,
            "created_policies": self.created_policies,
            "updated_policies": self.updated_policies,
            "created_dependents": self.created_dependents,
            "updated_dependents": self.updated_dependents,
            "errors": self.errors or [],
        }


class FlatPolicyFileService:
    BASE_COLUMNS_COUNT = 51
    DEPENDENT_BLOCK_SIZE = 16

    BASE_HEADERS: List[str] = [
        "AGENT",
        "AGENT NPN",
        "BROKER/AGENCY",
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
        "CARRIER/ISSUER",
        "PLAN ID",
        "PLAN NAME",
        "MEMBER ID",
        "MARKETPLACE ID",
        "INTERNAL CODE",
        "MONTHLY PREMIUM",
        "SUBSIDY",
        "POLICY COST",
        "TOTAL SAVINGS",
        "EFFECTIVE DATE",
        "SUBMISSION DATE",
        "CANCELLATION DATE",
        "STATUS",
        "TYPE",
        "SPECIAL ENROLLMENT REASON",
        "SPECIAL ENROLLMENT DATE",
        "FFM USED IN MARKET",
        "NPN MARKET",
        "CONSENT STATUS",
        "POLICY PHYSICAL ADDRESS",
        "POLICY POSTAL ADDRESS",
        "POLICY BILLING ADDRESS",
        "TOTAL MEMBERS",
        "TOTAL APPLICANTS",
        "TOTAL DEPENDENTS",
        "NOTES",
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
        "agent_npn": ("AGENT NPN", "NPN", "NPN MARKET"),
        "agency": ("BROKER/AGENCY", "AGENCY", "BROKER AGENCY"),
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
        "carrier": ("CARRIER/ISSUER", "CARRIER", "ISSUER"),
        "plan_id": ("PLAN ID",),
        "plan_name": ("PLAN NAME",),
        "member_id": ("MEMBER ID", "ID MIEMBRO"),
        "market_id": ("MARKETPLACE ID", "ID MERCADO"),
        "internal_code": ("INTERNAL CODE", "ID INTERNO"),
        "monthly_premium": ("MONTHLY PREMIUM", "PRIMA MENSUAL"),
        "subsidy": ("SUBSIDY", "SUBSIDIO"),
        "policy_cost": ("POLICY COST", "COSTO POLIZA"),
        "total_savings": ("TOTAL SAVINGS", "TOTAL AHORROS"),
        "effective_date": ("EFFECTIVE DATE", "FECHA EFECTIVA"),
        "submission_date": ("SUBMISSION DATE", "FECHA ENVIO"),
        "cancellation_date": ("CANCELLATION DATE", "FECHA CANCELACION"),
        "status": ("STATUS", "ESTADO"),
        "ffm_market": ("FFM USED IN MARKET",),
        "npn_market": ("NPN MARKET",),
        "consent_status": ("CONSENT STATUS",),
    }

    def import_file(self, file_obj) -> ImportSummary:
        headers, rows = self._read_file(file_obj)
        summary = ImportSummary(errors=[])

        with transaction.atomic():
            for row_index, row in enumerate(rows, start=2):
                if not any(_clean(value) for value in row):
                    continue

                summary.processed_rows += 1
                try:
                    with transaction.atomic():
                        self._import_row(headers=headers, row=row, summary=summary)
                except Exception as exc:  # noqa: BLE001 - aggregate row-level errors
                    summary.errors.append(f"Fila {row_index}: {exc}")

        return summary

    def export_policies_to_csv_response(self, queryset: Iterable[Poliza]) -> HttpResponse:
        policies = list(
            queryset
        )
        max_dependents = 0

        policy_dependents: Dict[int, List[PolizaCliente]] = {}
        for policy in policies:
            links = list(
                policy.polizacliente_set.select_related("cliente").all()
            )
            dependents = [link for link in links if not link.es_solicitante_principal]
            policy_dependents[policy.id] = dependents
            max_dependents = max(max_dependents, len(dependents))

        headers = list(self.BASE_HEADERS)
        for _ in range(max_dependents):
            headers.extend(self.DEPENDENT_HEADERS)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="polizas_flat_export.csv"'

        writer = csv.writer(response)
        writer.writerow(headers)

        for policy in policies:
            row = self._build_base_export_row(policy)
            for dependent_link in policy_dependents.get(policy.id, []):
                row.extend(self._build_dependent_export_row(dependent_link))

            expected_len = len(headers)
            if len(row) < expected_len:
                row.extend([""] * (expected_len - len(row)))

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

    def _base_value(self, base_headers: Sequence[str], base_values: Sequence[object], aliases: Sequence[str], index_fallback: Optional[int] = None) -> str:
        normalized = {_normalize_key(h): idx for idx, h in enumerate(base_headers)}

        for alias in aliases:
            idx = normalized.get(_normalize_key(alias))
            if idx is not None and idx < len(base_values):
                value = _clean(base_values[idx])
                if value:
                    return value

        if index_fallback is not None and index_fallback < len(base_values):
            return _clean(base_values[index_fallback])

        return ""

    def _import_row(self, headers: Sequence[str], row: Sequence[object], summary: ImportSummary) -> None:
        base_headers = list(headers[: self.BASE_COLUMNS_COUNT])
        base_values = list(row[: self.BASE_COLUMNS_COUNT])

        agent_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["agent"], index_fallback=0) or "Agente importado"
        agent_npn = self._base_value(base_headers, base_values, self.BASE_ALIASES["agent_npn"], index_fallback=1) or f"NPN-{uuid.uuid4().hex[:10]}"
        agency_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["agency"], index_fallback=2) or "Agencia importada"

        agency, _ = Agencia.objects.get_or_create(nombre=agency_name)
        agent, _ = Agente.objects.get_or_create(
            npn=agent_npn,
            defaults={
                "nombre_completo": agent_name,
                "agencia": agency,
            },
        )
        if agent.nombre_completo != agent_name or agent.agencia_id != agency.id:
            agent.nombre_completo = agent_name
            agent.agencia = agency
            agent.save(update_fields=["nombre_completo", "agencia"])

        full_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["full_name"], index_fallback=3)
        first_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["first_name"], index_fallback=4)
        middle_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["middle_name"], index_fallback=5)
        last_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["last_name"], index_fallback=6)
        second_last_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["second_last_name"], index_fallback=7)

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
            "genero": self._base_value(base_headers, base_values, self.BASE_ALIASES["gender"], index_fallback=8) or "No especificado",
            "fecha_nacimiento": _parse_date(self._base_value(base_headers, base_values, self.BASE_ALIASES["dob"], index_fallback=9)) or datetime.date(1900, 1, 1),
            "telefono": self._base_value(base_headers, base_values, self.BASE_ALIASES["phone"], index_fallback=10),
            "email": _safe_email(self._base_value(base_headers, base_values, self.BASE_ALIASES["email"], index_fallback=11)),
            "ingreso_anual": _parse_decimal(self._base_value(base_headers, base_values, self.BASE_ALIASES["income"], index_fallback=12)),
            "estado_civil": self._base_value(base_headers, base_values, self.BASE_ALIASES["marital_status"], index_fallback=13) or "No especificado",
            "pais_nacimiento": self._base_value(base_headers, base_values, self.BASE_ALIASES["country_birth"], index_fallback=15) or "No especificado",
            "estado_inmigracion": self._base_value(base_headers, base_values, self.BASE_ALIASES["imm_status"], index_fallback=16) or "No especificado",
            "categoria_inmigracion": self._base_value(base_headers, base_values, self.BASE_ALIASES["imm_category"], index_fallback=17),
        }

        principal_ssn = _safe_ssn(self._base_value(base_headers, base_values, self.BASE_ALIASES["ssn"], index_fallback=14))
        principal = self._upsert_client(principal_data, principal_ssn)

        address = self._build_address_from_base(base_headers, base_values)
        if address:
            if principal.direccion_fisica_id != address.id or principal.direccion_postal_id != address.id or principal.direccion_facturacion_id != address.id:
                principal.direccion_fisica = address
                principal.direccion_postal = address
                principal.direccion_facturacion = address
                principal.save(update_fields=["direccion_fisica", "direccion_postal", "direccion_facturacion"])

        policy, created_policy = self._upsert_policy(base_headers, base_values, agent, address)
        if created_policy:
            summary.created_policies += 1
        else:
            summary.updated_policies += 1

        PolizaCliente.objects.update_or_create(
            poliza=policy,
            cliente=principal,
            defaults={
                "es_solicitante_principal": True,
                "relacion": "Self",
                "direccion_residencia": address,
                "direccion_postal": address,
            },
        )

        dependent_values = list(row[self.BASE_COLUMNS_COUNT :])
        for idx in range(0, len(dependent_values), self.DEPENDENT_BLOCK_SIZE):
            block = dependent_values[idx : idx + self.DEPENDENT_BLOCK_SIZE]
            if len(block) < self.DEPENDENT_BLOCK_SIZE:
                continue
            if not any(_clean(v) for v in block):
                continue

            dep_client, dep_created = self._upsert_dependent(block)
            relation = _clean(block[1]) or "Dependent"

            PolizaCliente.objects.update_or_create(
                poliza=policy,
                cliente=dep_client,
                defaults={
                    "es_solicitante_principal": False,
                    "relacion": relation,
                    "direccion_residencia": address,
                    "direccion_postal": address,
                },
            )

            if dep_created:
                summary.created_dependents += 1
            else:
                summary.updated_dependents += 1

    def _build_address_from_base(self, base_headers: Sequence[str], base_values: Sequence[object]) -> Optional[Direccion]:
        line1 = self._base_value(base_headers, base_values, self.BASE_ALIASES["address_1"], index_fallback=18)
        city = self._base_value(base_headers, base_values, self.BASE_ALIASES["city"], index_fallback=20)
        state = self._base_value(base_headers, base_values, self.BASE_ALIASES["state"], index_fallback=21)
        zip_code = self._base_value(base_headers, base_values, self.BASE_ALIASES["zip"], index_fallback=22)

        if not (line1 and city and state and zip_code):
            return None

        return Direccion.objects.get_or_create(
            linea1=line1,
            linea2=self._base_value(base_headers, base_values, self.BASE_ALIASES["address_2"], index_fallback=19),
            ciudad=city,
            estado=state,
            zip_code=zip_code,
            condado=self._base_value(base_headers, base_values, self.BASE_ALIASES["county"], index_fallback=23) or "N/A",
        )[0]

    def _upsert_client(self, client_data: Dict[str, object], ssn: str) -> Cliente:
        email = str(client_data.get("email", "")).strip().lower()

        if ssn:
            client = Cliente.objects.filter(ssn=ssn).first()
        else:
            client = None

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
            created = Cliente.objects.create(ssn=ssn, **dep_data)
            return created, True

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

    def _upsert_policy(self, base_headers: Sequence[str], base_values: Sequence[object], agent: Agente, address: Optional[Direccion]) -> Tuple[Poliza, bool]:
        carrier_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["carrier"], index_fallback=24) or "Sin aseguradora"
        plan_id = self._base_value(base_headers, base_values, self.BASE_ALIASES["plan_id"], index_fallback=25) or "UNKNOWN"
        plan_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["plan_name"], index_fallback=26) or plan_id
        member_id = self._base_value(base_headers, base_values, self.BASE_ALIASES["member_id"], index_fallback=27)
        market_id = self._base_value(base_headers, base_values, self.BASE_ALIASES["market_id"], index_fallback=28)
        internal_code = self._base_value(base_headers, base_values, self.BASE_ALIASES["internal_code"], index_fallback=29)

        insurer, _ = Aseguradora.objects.get_or_create(nombre=carrier_name)
        plan, _ = Plan.objects.get_or_create(
            id_plan_aseguradora=plan_id,
            aseguradora=insurer,
            defaults={"nombre": plan_name},
        )
        if plan.nombre != plan_name and plan_name:
            plan.nombre = plan_name
            plan.save(update_fields=["nombre"])

        status_name = self._base_value(base_headers, base_values, self.BASE_ALIASES["status"], index_fallback=37) or "Pendiente"
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
        policy.estado = policy_status
        policy.costo_poliza = _parse_decimal(self._base_value(base_headers, base_values, self.BASE_ALIASES["policy_cost"], index_fallback=32))
        policy.subsidio = _parse_decimal(self._base_value(base_headers, base_values, self.BASE_ALIASES["subsidy"], index_fallback=31))
        policy.prima_mensual = _parse_decimal(self._base_value(base_headers, base_values, self.BASE_ALIASES["monthly_premium"], index_fallback=30))
        policy.total_ahorros = _parse_decimal(self._base_value(base_headers, base_values, self.BASE_ALIASES["total_savings"], index_fallback=33))
        policy.fecha_efectiva = _parse_date(self._base_value(base_headers, base_values, self.BASE_ALIASES["effective_date"], index_fallback=34))
        policy.fecha_envio = _parse_date(self._base_value(base_headers, base_values, self.BASE_ALIASES["submission_date"], index_fallback=35)) or datetime.date.today()
        policy.fecha_cancelacion = _parse_date(self._base_value(base_headers, base_values, self.BASE_ALIASES["cancellation_date"], index_fallback=36))
        policy.ffm_mercado = self._base_value(base_headers, base_values, self.BASE_ALIASES["ffm_market"], index_fallback=41)
        policy.npn_mercado = self._base_value(base_headers, base_values, self.BASE_ALIASES["npn_market"], index_fallback=42)
        policy.estado_consentimiento = self._base_value(base_headers, base_values, self.BASE_ALIASES["consent_status"], index_fallback=43) or policy.estado_consentimiento

        if address:
            policy.direccion_fisica = policy.direccion_fisica or address
            policy.direccion_postal = policy.direccion_postal or address
            policy.direccion_facturacion = policy.direccion_facturacion or address

        policy.save()
        return policy, created

    def _build_base_export_row(self, policy: Poliza) -> List[object]:
        principal_link = (
            policy.polizacliente_set.select_related("cliente")
            .filter(es_solicitante_principal=True)
            .first()
        )
        principal = principal_link.cliente if principal_link else None
        agency_name = policy.agente.agencia.nombre if policy.agente and policy.agente.agencia_id else ""

        row = [""] * len(self.BASE_HEADERS)
        row[0] = policy.agente.nombre_completo if policy.agente else ""
        row[1] = policy.agente.npn if policy.agente else ""
        row[2] = agency_name

        if principal:
            row[3] = " ".join(
                part
                for part in [
                    principal.primer_nombre,
                    principal.segundo_nombre,
                    principal.apellido_paterno,
                    principal.apellido_materno,
                ]
                if part
            )
            row[4] = principal.primer_nombre
            row[5] = principal.segundo_nombre or ""
            row[6] = principal.apellido_paterno
            row[7] = principal.apellido_materno or ""
            row[8] = principal.genero
            row[9] = principal.fecha_nacimiento.isoformat() if principal.fecha_nacimiento else ""
            row[10] = principal.telefono
            row[11] = principal.email
            row[12] = str(principal.ingreso_anual)
            row[13] = principal.estado_civil
            row[14] = principal.ssn
            row[15] = principal.pais_nacimiento
            row[16] = principal.estado_inmigracion
            row[17] = principal.categoria_inmigracion or ""

            address = principal.direccion_fisica
            if address:
                row[18] = address.linea1
                row[19] = address.linea2 or ""
                row[20] = address.ciudad
                row[21] = address.estado
                row[22] = address.zip_code
                row[23] = address.condado

        row[24] = policy.plan.aseguradora.nombre if policy.plan and policy.plan.aseguradora_id else ""
        row[25] = policy.plan.id_plan_aseguradora if policy.plan else ""
        row[26] = policy.plan.nombre if policy.plan else ""
        row[27] = policy.id_miembro
        row[28] = policy.id_mercado
        row[29] = policy.id_interno or ""
        row[30] = str(policy.prima_mensual)
        row[31] = str(policy.subsidio)
        row[32] = str(policy.costo_poliza)
        row[33] = str(policy.total_ahorros)
        row[34] = policy.fecha_efectiva.isoformat() if policy.fecha_efectiva else ""
        row[35] = policy.fecha_envio.isoformat() if policy.fecha_envio else ""
        row[36] = policy.fecha_cancelacion.isoformat() if policy.fecha_cancelacion else ""
        row[37] = policy.estado.nombre if policy.estado else ""
        row[41] = policy.ffm_mercado or ""
        row[42] = policy.npn_mercado or ""
        row[43] = policy.estado_consentimiento or ""
        row[44] = str(policy.direccion_fisica) if policy.direccion_fisica else ""
        row[45] = str(policy.direccion_postal) if policy.direccion_postal else ""
        row[46] = str(policy.direccion_facturacion) if policy.direccion_facturacion else ""
        row[47] = policy.total_miembros
        row[48] = policy.total_aplicantes
        row[49] = policy.total_dependientes

        return row

    def _build_dependent_export_row(self, dependent_link: PolizaCliente) -> List[object]:
        dep = dependent_link.cliente
        return [
            "NO",
            dependent_link.relacion or "Dependent",
            dep.primer_nombre,
            dep.segundo_nombre or "",
            dep.apellido_paterno,
            dep.apellido_materno or "",
            dep.genero,
            dep.fecha_nacimiento.isoformat() if dep.fecha_nacimiento else "",
            dep.telefono,
            dep.email,
            str(dep.ingreso_anual),
            dep.estado_civil,
            dep.ssn,
            dep.pais_nacimiento,
            dep.estado_inmigracion,
            dep.categoria_inmigracion or "",
        ]
