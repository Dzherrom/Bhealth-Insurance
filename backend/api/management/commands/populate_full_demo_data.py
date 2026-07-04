"""
Puebla el entorno con 100 pólizas demo completas (direcciones, documentos, etiquetas,
pagos, médicos, medicamentos, notas, cambios de vida y usuarios portal CLIENTE).

Pensado para ejecutarse en el start de Render (start.sh) con --skip-if-exists.
"""

from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from api.client_portal import ensure_portal_user_for_cliente
from api.models import (
    Agencia,
    Agente,
    Aseguradora,
    CambioDeVida,
    Cliente,
    CuentaBancaria,
    Direccion,
    Documento,
    EstadoPoliza,
    Etiqueta,
    InfoPago,
    MedicoPoliza,
    Medicamento,
    Nota,
    Plan,
    Poliza,
    PolizaCliente,
    TarjetaCredito,
    TipoProducto,
    UserProfile,
)

DEMO_PREFIX = "BHDEMO"
DEFAULT_CLIENT_PASSWORD = "Caracas2026.*"

ESTADOS_POLIZA = [
    ("QUOTE", "#6366f1"),
    ("ACTIVA", "#10b981"),
    ("PENDIENTE", "#f59e0b"),
    ("EN REVISION", "#3b82f6"),
    ("CANCELADA", "#ef4444"),
    ("EFECTIVA", "#059669"),
]

ESTADOS_DOCUMENTO_POLIZA = [c[0] for c in Poliza.ESTADO_DOCUMENTO_POLIZA_CHOICES]
ESTADOS_DOCUMENTO = [c[0] for c in Documento.ESTADO_DOCUMENTO_CHOICES]
ESTADOS_PAGO = [c[0] for c in InfoPago.ESTADO_CHOICES]
CAMBIOS_VIDA_TIPOS = [c[0] for c in CambioDeVida.TIPO_CHOICES]
CAMBIOS_VIDA_ESTADOS = [c[0] for c in CambioDeVida.ESTADO_CHOICES]
DOC_CATEGORIAS = [c[0] for c in Documento.CATEGORIA_CHOICES]

AGENCIAS_DEMO = [
    ("Sunshine Health Partners", "33101", "Miami"),
    ("Gulf Coast Insurance Group", "77001", "Houston"),
    ("Capital Care Advisors", "20001", "Washington"),
    ("Pacific Wellness Brokers", "90001", "Los Angeles"),
    ("Mountain States Coverage", "80201", "Denver"),
]

ETIQUETAS_POLIZA = [
    ("Prioridad alta", "#ef4444"),
    ("Renovación 2026", "#f59e0b"),
    ("Familia numerosa", "#8b5cf6"),
    ("Documentación pendiente", "#6366f1"),
    ("Cliente VIP", "#10b981"),
]

ETIQUETAS_DOCUMENTO = [
    ("Revisión legal", "#3b82f6"),
    ("Urgente", "#ef4444"),
    ("Archivado", "#6b7280"),
]

MEDICAMENTOS_DEMO = [
    ("Metformina", "500mg", "2 veces al día"),
    ("Lisinopril", "10mg", "1 vez al día"),
    ("Atorvastatina", "20mg", "Noche"),
    ("Levothyroxine", "50mcg", "Mañana"),
    ("Omeprazole", "20mg", "Antes del desayuno"),
]


class Command(BaseCommand):
    help = (
        "Crea 100 pólizas demo asignadas a empleados existentes, con clientes portal, "
        "direcciones, documentos, etiquetas, pagos, médicos, medicamentos, notas y cambios de vida."
    )

    def add_arguments(self, parser):
        parser.add_argument("--polizas", type=int, default=100)
        parser.add_argument("--quotes", type=int, default=12)
        parser.add_argument(
            "--skip-if-exists",
            action="store_true",
            help=(
                "Omite si ya hay el total de pólizas BHDEMO; si hay un seed parcial, "
                "lo elimina y vuelve a poblar."
            ),
        )
        parser.add_argument(
            "--password",
            type=str,
            default=DEFAULT_CLIENT_PASSWORD,
            help="Contraseña por defecto para usuarios CLIENTE del portal.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        total = max(1, int(options["polizas"]))
        quote_count = min(total, max(0, int(options["quotes"])))
        skip_if_exists = bool(options["skip_if_exists"])
        client_password = options["password"]

        marker = f"{DEMO_PREFIX}-POL-"
        existing_count = Poliza.objects.filter(id_mercado__startswith=marker).count()
        if skip_if_exists:
            if existing_count >= total:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Dataset {DEMO_PREFIX} completo ({existing_count} pólizas). Se omite la población."
                    )
                )
                return
            if existing_count > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f"Seed {DEMO_PREFIX} incompleto ({existing_count}/{total} pólizas). "
                        "Eliminando datos parciales y repoblando..."
                    )
                )
                self._cleanup_partial_demo_data()

        random.seed(20260624)
        fake = Faker("es_MX")
        now = timezone.now()

        agencias = self._ensure_agencias()
        estados = self._ensure_estados()
        quote_estado = next(e for e in estados if e.nombre == "QUOTE")
        non_quote_estados = [e for e in estados if e.nombre != "QUOTE"]
        tipo_producto = self._ensure_tipo_producto()
        planes = self._ensure_planes(tipo_producto)
        etiquetas_poliza = self._ensure_etiquetas_poliza()
        etiquetas_documento = self._ensure_etiquetas_documento()

        staff_users, agentes = self._resolve_staff_and_agentes(agencias, fake)
        if not agentes:
            raise RuntimeError(
                "No hay agentes disponibles. Cree empleados con perfil Agente antes de poblar datos demo."
            )

        quote_indices = set(random.sample(range(1, total + 1), k=quote_count)) if quote_count else set()

        portal_users_created = 0
        for i in range(1, total + 1):
            agente = random.choice(agentes)
            agencia = agente.agencia or random.choice(agencias)
            plan = random.choice(planes)
            estado = quote_estado if i in quote_indices else random.choice(non_quote_estados)

            fisica = self._random_address(fake, i, "FIS")
            postal = self._random_address(fake, i, "POS")
            facturacion = self._random_address(fake, i, "FAC")

            principal = self._create_cliente(fake, i, suffix="PRINC", fisica=fisica, postal=postal)
            creador = random.choice(staff_users)

            poliza = Poliza.objects.create(
                id_mercado=f"{DEMO_PREFIX}-POL-{i:05d}",
                id_miembro=f"{DEMO_PREFIX}-MEM-{i:05d}",
                costo_poliza=Decimal(str(random.randint(280, 1200))),
                subsidio=Decimal(str(random.randint(0, 450))),
                prima_mensual=Decimal(str(random.randint(75, 520))),
                total_ahorros=Decimal("0.00"),
                plan_era="Demo 2026",
                fecha_efectiva=(now - timedelta(days=random.randint(0, 540))).date(),
                estado=estado,
                fecha_envio=(now - timedelta(days=random.randint(0, 600))).date(),
                id_interno=f"{DEMO_PREFIX}-INT-{i:05d}",
                agente=agente,
                agente_registro=agente,
                plan=plan,
                tipo_producto=tipo_producto,
                aseguradora=plan.aseguradora,
                nombre_plan=plan.nombre,
                metal=random.choice(["BRONCE", "PLATA", "ORO", "PLATINO"]),
                flujo_etapa=random.choice([c[0] for c in Poliza.FLUJO_ETAPA_CHOICES]),
                estado_documento=random.choice(ESTADOS_DOCUMENTO_POLIZA),
                total_miembros=1,
                total_aplicantes=1,
                total_dependientes=0,
                direccion_fisica=fisica,
                direccion_postal=postal,
                direccion_facturacion=facturacion,
            )

            PolizaCliente.objects.create(
                poliza=poliza,
                cliente=principal,
                es_solicitante_principal=True,
                relacion="SOLICITANTE",
                direccion_residencia=fisica,
                direccion_postal=postal,
            )

            dependientes = self._create_dependientes(
                fake=fake,
                base_index=i,
                poliza=poliza,
                residencia=fisica,
                postal=postal,
            )
            total_miembros = 1 + dependientes
            poliza.total_miembros = total_miembros
            poliza.total_aplicantes = total_miembros
            poliza.total_dependientes = dependientes
            poliza.save(update_fields=["total_miembros", "total_aplicantes", "total_dependientes"])

            if etiquetas_poliza and hasattr(poliza, 'etiquetas'):
                poliza.etiquetas.set(random.sample(etiquetas_poliza, k=random.randint(1, min(3, len(etiquetas_poliza)))))

            colaboradores = random.sample(staff_users, k=random.randint(1, min(3, len(staff_users))))
            poliza.colaboradores.set(colaboradores)

            self._create_payment_bundle(poliza, fake)
            self._create_medicos(poliza, fake)
            self._create_medicamentos(poliza, fake, now)
            self._create_documentos(poliza, principal, creador, etiquetas_documento, fake, i)
            self._create_notas(poliza, creador, staff_users, fake)
            self._create_cambios_de_vida(poliza, agente, creador, staff_users, fake, now)

            _, created = ensure_portal_user_for_cliente(principal, client_password)
            if created:
                portal_users_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Dataset {DEMO_PREFIX} creado: {total} pólizas "
                f"({quote_count} cotizaciones QUOTE), {portal_users_created} usuarios portal nuevos. "
                f"Contraseña portal: {client_password}"
            )
        )

    def _cleanup_partial_demo_data(self):
        marker = f"{DEMO_PREFIX}-POL-"
        polizas = Poliza.objects.filter(id_mercado__startswith=marker)
        removed_polizas = polizas.count()
        if removed_polizas:
            polizas.delete()

        demo_clientes = Cliente.objects.filter(ssn__startswith=f"{DEMO_PREFIX}-")
        demo_cliente_ids = list(demo_clientes.values_list("id", flat=True))
        if demo_cliente_ids:
            portal_users = User.objects.filter(profile__cliente_id__in=demo_cliente_ids)
            removed_users = portal_users.count()
            portal_users.delete()
            removed_clientes = demo_clientes.count()
            demo_clientes.delete()
        else:
            removed_users = 0
            removed_clientes = 0

        Direccion.objects.filter(linea1__startswith=f"{DEMO_PREFIX}-").delete()

        self.stdout.write(
            self.style.WARNING(
                f"Limpieza demo: {removed_polizas} pólizas, "
                f"{removed_clientes} clientes, {removed_users} usuarios portal."
            )
        )

    def _ensure_agencias(self):
        agencias = []
        for nombre, zip_code, ciudad in AGENCIAS_DEMO:
            agencia, _ = Agencia.objects.get_or_create(
                nombre=nombre,
                defaults={
                    "codigo_postal": zip_code,
                    "telefono": f"+1 305 {random.randint(100, 999)} {random.randint(1000, 9999)}",
                    "email": f"contacto.{nombre.split()[0].lower()}@bhealth.demo",
                    "titulo_portal": f"Portal {nombre}",
                },
            )
            agencias.append(agencia)
        return agencias

    def _ensure_estados(self):
        estados = []
        for nombre, color in ESTADOS_POLIZA:
            estado, _ = EstadoPoliza.objects.get_or_create(
                nombre=nombre,
                defaults={"color": color, "disponible_para_agentes": True},
            )
            estados.append(estado)
        return estados

    def _ensure_tipo_producto(self):
        tipo, _ = TipoProducto.objects.get_or_create(
            nombre="Health Insurance (ACA)",
            defaults={"descripcion": "Seguro médico ACA"},
        )
        return tipo

    def _ensure_planes(self, tipo_producto):
        planes = []
        for idx, tier in enumerate(("Bronce", "Plata", "Oro", "Platino"), start=1):
            aseguradora, _ = Aseguradora.objects.get_or_create(nombre=f"{DEMO_PREFIX} Aseguradora {idx}")
            plan, created = Plan.objects.get_or_create(
                id_plan_aseguradora=f"{DEMO_PREFIX}-PLAN-{idx}-{tier.upper()}",
                defaults={
                    "nombre": f"Plan {tier} Demo",
                    "aseguradora": aseguradora,
                    "tipo_producto": tipo_producto,
                },
            )
            updates = {}
            if plan.aseguradora_id != aseguradora.id:
                updates["aseguradora"] = aseguradora
            if not plan.tipo_producto_id:
                updates["tipo_producto"] = tipo_producto
            if updates:
                for field, value in updates.items():
                    setattr(plan, field, value)
                plan.save(update_fields=list(updates.keys()))
            planes.append(plan)
        return planes

    def _ensure_etiquetas_poliza(self):
        etiquetas = []
        for nombre, color in ETIQUETAS_POLIZA:
            etq, _ = Etiqueta.objects.get_or_create(
                nombre=f"{DEMO_PREFIX} {nombre}",
                defaults={"tipo": "POLIZA", "color": color},
            )
            etiquetas.append(etq)
        return etiquetas

    def _ensure_etiquetas_documento(self):
        etiquetas = []
        for nombre, color in ETIQUETAS_DOCUMENTO:
            etq, _ = Etiqueta.objects.get_or_create(
                nombre=f"{DEMO_PREFIX} DOC {nombre}",
                defaults={"tipo": "DOCUMENTO", "color": color},
            )
            etiquetas.append(etq)
        return etiquetas

    def _resolve_staff_and_agentes(self, agencias, fake):
        staff_profiles = list(
            UserProfile.objects.filter(
                role__in=["ADMIN", "MANAGER", "ASISTENTE", "SHERPA", "PAGOS", "CITAS"],
                user__is_active=True,
            ).select_related("user", "agente")
        )
        staff_users = [p.user for p in staff_profiles] or list(User.objects.filter(is_active=True, is_superuser=True))
        if not staff_users:
            admin = User.objects.create_superuser(
                username=f"{DEMO_PREFIX.lower()}-admin",
                email=f"admin.{DEMO_PREFIX.lower()}@bhealth.demo",
                password=DEFAULT_CLIENT_PASSWORD,
            )
            staff_users = [admin]

        agentes = [p.agente for p in staff_profiles if p.agente_id]
        agentes = list({a.id: a for a in agentes}.values())

        if not agentes:
            agencia = random.choice(agencias)
            for idx, user in enumerate(staff_users[:8], start=1):
                npn = f"{DEMO_PREFIX}-NPN-{idx:05d}"
                agente, created = Agente.objects.get_or_create(
                    npn=npn,
                    defaults={
                        "nombre_completo": user.get_full_name() or user.username,
                        "agencia": agencia,
                        "ffm": f"FFM-{idx:04d}",
                    },
                )
                if created:
                    profile, _ = UserProfile.objects.get_or_create(user=user)
                    profile.agente = agente
                    profile.save(update_fields=["agente"])
                agentes.append(agente)

        for agente in agentes:
            if not agente.agencia_id:
                agente.agencia = random.choice(agencias)
                agente.save(update_fields=["agencia"])

        return staff_users, agentes

    def _state_name(self, fake):
        try:
            return fake.state_abbr()[:100]
        except AttributeError:
            return fake.state()[:100]

    def _random_address(self, fake, i, label):
        return Direccion.objects.create(
            linea1=f"{DEMO_PREFIX}-{label}-{100 + i} {fake.street_name()}",
            linea2=f"Apt {random.randint(1, 120)}",
            ciudad=fake.city(),
            estado=self._state_name(fake),
            zip_code=fake.postcode(),
            condado=f"County {random.randint(1, 99)}",
        )

    def _create_cliente(self, fake, i, suffix, fisica=None, postal=None):
        return Cliente.objects.create(
            primer_nombre=fake.first_name(),
            segundo_nombre="",
            apellido_paterno=fake.last_name(),
            apellido_materno=fake.last_name(),
            genero=random.choice(["Masculino", "Femenino", "M", "F"]),
            fecha_nacimiento=fake.date_of_birth(minimum_age=21, maximum_age=72),
            ssn=f"{DEMO_PREFIX}-{i:05d}-{suffix[:3]}",
            email=f"cliente.{DEMO_PREFIX.lower()}.{suffix.lower()}.{i:05d}@bhealth.demo",
            telefono=fake.numerify(text="+1-###-###-####"),
            ingreso_anual=Decimal(str(random.randint(22000, 145000))),
            estado_civil=random.choice(["Soltero", "Casado", "Divorciado", "SOLTERO", "CASADO"]),
            pais_nacimiento="USA",
            estado_inmigracion=random.choice(["Ciudadano", "RESIDENTE", "Permanente"]),
            categoria_inmigracion="N/A",
            usa_tabaco=random.choice([True, False]),
            direccion_fisica=fisica,
            direccion_postal=postal or fisica,
        )

    def _create_dependientes(self, fake, base_index, poliza, residencia, postal):
        count = random.randint(0, 3)
        relaciones = ["CONYUGE", "HIJO", "HIJA", "DEPENDIENTE"]
        for d in range(1, count + 1):
            dep = self._create_cliente(
                fake,
                base_index * 10 + d,
                suffix=f"DEP{d}",
                fisica=residencia,
                postal=postal,
            )
            PolizaCliente.objects.create(
                poliza=poliza,
                cliente=dep,
                es_solicitante_principal=False,
                relacion=random.choice(relaciones),
                direccion_residencia=residencia,
                direccion_postal=postal,
            )
        return count

    def _create_payment_bundle(self, poliza, fake):
        InfoPago.objects.create(
            poliza=poliza,
            pago_recurrente=random.choice([True, False]),
            fecha_primer_pago=(timezone.now() - timedelta(days=random.randint(0, 90))).date(),
            dia_pago_preferido=random.randint(1, 28),
            estado_pago=random.choice(ESTADOS_PAGO),
        )
        TarjetaCredito.objects.create(
            poliza=poliza,
            tipo_tarjeta=random.choice(["VISA", "MASTERCARD", "AMEX"]),
            numero=f"**** **** **** {random.randint(1000, 9999)}",
            nombre_titular=fake.name(),
            cvv=str(random.randint(100, 999)),
            fecha_vencimiento=f"{random.randint(1, 12):02d}/{random.randint(27, 33)}",
        )
        CuentaBancaria.objects.create(
            poliza=poliza,
            nombre_banco=random.choice(["Chase", "Bank of America", "Wells Fargo", "TD Bank"]),
            numero_cuenta=fake.numerify(text="##########"),
            aba_routing=fake.numerify(text="#########"),
            titular_cuenta=fake.name(),
        )

    def _create_medicos(self, poliza, fake):
        for _ in range(random.randint(1, 2)):
            MedicoPoliza.objects.create(
                poliza=poliza,
                nombre=f"Dr. {fake.last_name()}, {fake.first_name()}",
                especializacion=random.choice(
                    ["Medicina General", "Cardiología", "Pediatría", "Medicina Interna"]
                ),
                hospital=f"{fake.city()} Medical Center",
            )

    def _create_medicamentos(self, poliza, fake, now):
        picks = random.sample(MEDICAMENTOS_DEMO, k=random.randint(1, min(3, len(MEDICAMENTOS_DEMO))))
        for nombre, dosis, frecuencia in picks:
            Medicamento.objects.create(
                poliza=poliza,
                nombre=nombre,
                dosis=dosis,
                frecuencia=frecuencia,
                fecha_inicio=(now - timedelta(days=random.randint(30, 400))).date(),
                activo=random.choice([True, True, False]),
            )

    def _create_documentos(self, poliza, cliente, subidor, etiquetas_doc, fake, index):
        for doc_idx in range(random.randint(2, 4)):
            categoria = random.choice(DOC_CATEGORIAS)
            doc = Documento.objects.create(
                poliza=poliza,
                cliente=cliente,
                titulo=f"{DEMO_PREFIX} {categoria.replace('_', ' ').title()} #{index}-{doc_idx}",
                categoria=categoria,
                estado_documento=random.choice(ESTADOS_DOCUMENTO),
                subido_por=subidor,
                archivo=ContentFile(
                    b"%PDF-1.4\n% Demo document\n",
                    name=f"{DEMO_PREFIX.lower()}-pol-{index}-doc-{doc_idx}.pdf",
                ),
            )
            if etiquetas_doc:
                doc.etiquetas.set(random.sample(etiquetas_doc, k=random.randint(0, min(2, len(etiquetas_doc)))))

    def _create_notas(self, poliza, autor, staff_users, fake):
        for note_idx in range(random.randint(1, 3)):
            mention = random.choice(staff_users).username if staff_users else autor.username
            Nota.objects.create(
                poliza=poliza,
                autor=autor,
                contenido=(
                    f"{DEMO_PREFIX} Nota #{note_idx + 1}: {fake.sentence(nb_words=12)} "
                    f"Seguimiento con @{mention}."
                ),
            )

    def _create_cambios_de_vida(self, poliza, agente, creador, staff_users, fake, now):
        for _ in range(random.randint(0, 2)):
            CambioDeVida.objects.create(
                poliza=poliza,
                agente=agente,
                agente_creador=agente,
                tipo=random.choice(CAMBIOS_VIDA_TIPOS),
                descripcion=fake.paragraph(nb_sentences=2),
                datos={"origen": DEMO_PREFIX, "detalle": fake.sentence()},
                estado=random.choice(CAMBIOS_VIDA_ESTADOS),
                asignado_a=random.choice(staff_users),
                creado_por=creador,
                fecha_limite=now + timedelta(days=random.randint(5, 45)),
            )
