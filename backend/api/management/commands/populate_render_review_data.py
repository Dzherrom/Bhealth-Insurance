from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from api.models import (
    Agencia,
    Agente,
    Aseguradora,
    Cita,
    Cliente,
    ConsentRequest,
    CuentaBancaria,
    Direccion,
    EstadoPoliza,
    InfoPago,
    Nota,
    Plan,
    Poliza,
    PolizaCliente,
    Recordatorio,
    TarjetaCredito,
)


DEMO_PREFIX = "RNDR-DEMO"


class Command(BaseCommand):
    help = (
        "Puebla datos demo para revision en Render: 100 polizas con clientes, familiares, "
        "direcciones, pagos, citas, notas y 20 formularios de firmas."
    )

    def add_arguments(self, parser):
        parser.add_argument("--polizas", type=int, default=100)
        parser.add_argument("--firmas", type=int, default=20)
        parser.add_argument(
            "--skip-if-exists",
            action="store_true",
            help="No hace nada si ya existen polizas demo de Render.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        total_polizas = max(1, int(options["polizas"]))
        total_firmas = max(1, int(options["firmas"]))
        skip_if_exists = bool(options["skip_if_exists"])

        if skip_if_exists and Poliza.objects.filter(id_mercado__startswith=f"{DEMO_PREFIX}-POL-").exists():
            self.stdout.write(self.style.SUCCESS("Datos demo Render ya existen. Se omite poblacion."))
            return

        self._reset_previous_demo_data()

        random.seed(20260515)
        fake = Faker("es_MX")
        now = timezone.now()

        agencia = self._ensure_agencia()
        estados = self._ensure_estados()
        planes = self._ensure_planes()

        creator_users = list(User.objects.filter(is_active=True))
        if not creator_users:
            creator_users.append(
                User.objects.create_superuser(
                    username="bhealth-admin",
                    email="admin@bhealth.demo",
                    password="Caracas26.*",
                )
            )

        agentes = list(Agente.objects.all())
        if len(agentes) < 12:
            agentes.extend(self._create_demo_agents(agencia=agencia, count=12 - len(agentes), fake=fake))

        polizas = []
        principal_client_by_poliza_id: dict[int, Cliente] = {}

        for i in range(1, total_polizas + 1):
            creador = random.choice(creator_users)
            agente = random.choice(agentes)
            plan = random.choice(planes)
            estado = random.choice(estados)

            fisica = self._random_address(fake, i, "FIS")
            postal = self._random_address(fake, i, "POS")
            facturacion = self._random_address(fake, i, "FAC")

            principal = self._create_cliente(fake, i, suffix="PRINC")

            poliza = Poliza.objects.create(
                id_mercado=f"{DEMO_PREFIX}-POL-{i:05d}",
                id_miembro=f"{DEMO_PREFIX}-MEM-{i:05d}",
                costo_poliza=Decimal(random.randint(250, 950)),
                subsidio=Decimal(random.randint(25, 300)),
                prima_mensual=Decimal(random.randint(90, 450)),
                total_ahorros=Decimal("0.00"),
                plan_era="Render Review",
                fecha_efectiva=(now - timedelta(days=random.randint(0, 420))).date(),
                estado=estado,
                fecha_envio=(now - timedelta(days=random.randint(0, 430))).date(),
                id_interno=f"{DEMO_PREFIX}-INT-{i:05d}",
                agente=agente,
                plan=plan,
                flujo_etapa="CAPTURA_ASISTENTE",
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

            self._create_payment_data(poliza=poliza, fake=fake)
            self._create_citas(poliza=poliza, cliente=principal, creador=creador, count=random.randint(1, 3), fake=fake)
            self._create_notas(poliza=poliza, autor=creador, count=random.randint(1, 3), fake=fake)
            self._create_recordatorio(poliza=poliza, user=creador, fake=fake, now=now)

            polizas.append(poliza)
            principal_client_by_poliza_id[poliza.id] = principal

        self._create_firmas(
            total_firmas=total_firmas,
            polizas=polizas,
            principal_client_by_poliza_id=principal_client_by_poliza_id,
            users=creator_users,
            now=now,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Datos demo Render creados: {total_polizas} polizas y {total_firmas} formularios de firmas."
            )
        )

    def _reset_previous_demo_data(self):
        ConsentRequest.objects.filter(provider_envelope_id__startswith=f"{DEMO_PREFIX}-ENV-").delete()
        Recordatorio.objects.filter(titulo__startswith=f"{DEMO_PREFIX} Recordatorio").delete()
        Nota.objects.filter(contenido__startswith=f"{DEMO_PREFIX} Nota").delete()
        Poliza.objects.filter(id_mercado__startswith=f"{DEMO_PREFIX}-POL-").delete()
        Cliente.objects.filter(email__startswith="render.demo.").delete()
        Direccion.objects.filter(linea1__startswith=f"{DEMO_PREFIX}-").delete()
        Agente.objects.filter(npn__startswith=f"{DEMO_PREFIX}-NPN-").delete()

    def _ensure_agencia(self):
        agencia, _ = Agencia.objects.get_or_create(
            nombre="Render Demo Agency",
            defaults={
                "codigo_postal": "33101",
                "telefono": "+1 305 555 1000",
                "email": "render.demo@bhealth.test",
            },
        )
        return agencia

    def _ensure_estados(self):
        catalog = [
            ("ACTIVA", "#10b981"),
            ("PENDIENTE", "#f59e0b"),
            ("EN REVISION", "#3b82f6"),
            ("CANCELADA", "#ef4444"),
        ]
        estados = []
        for nombre, color in catalog:
            estado, _ = EstadoPoliza.objects.get_or_create(
                nombre=nombre,
                defaults={"color": color, "disponible_para_agentes": True},
            )
            estados.append(estado)
        return estados

    def _ensure_planes(self):
        planes = []
        for idx in range(1, 6):
            aseguradora, _ = Aseguradora.objects.get_or_create(nombre=f"Render Aseguradora {idx}")
            for tier in ("Bronce", "Plata", "Oro"):
                plan, _ = Plan.objects.get_or_create(
                    id_plan_aseguradora=f"{DEMO_PREFIX}-PLAN-{idx}-{tier.upper()}",
                    defaults={
                        "nombre": f"{tier} {idx}",
                        "aseguradora": aseguradora,
                    },
                )
                if plan.aseguradora_id != aseguradora.id:
                    plan.aseguradora = aseguradora
                    plan.save(update_fields=["aseguradora"])
                planes.append(plan)
        return planes

    def _create_demo_agents(self, agencia, count, fake):
        agentes = []
        start = Agente.objects.filter(npn__startswith=f"{DEMO_PREFIX}-NPN-").count() + 1
        for i in range(start, start + count):
            agentes.append(
                Agente.objects.create(
                    npn=f"{DEMO_PREFIX}-NPN-{i:05d}",
                    nombre_completo=fake.name(),
                    agencia=agencia,
                )
            )
        return agentes

    def _random_address(self, fake, i, label):
        return Direccion.objects.create(
            linea1=f"{DEMO_PREFIX}-{label}-{100 + i} {fake.street_name()}",
            linea2="",
            ciudad=fake.city(),
            estado=fake.state(),
            zip_code=fake.postcode(),
            condado=f"County {random.randint(1, 99)}",
        )

    def _create_cliente(self, fake, i, suffix):
        return Cliente.objects.create(
            primer_nombre=fake.first_name(),
            segundo_nombre="",
            apellido_paterno=fake.last_name(),
            apellido_materno=fake.last_name(),
            genero=random.choice(["M", "F"]),
            fecha_nacimiento=fake.date_of_birth(minimum_age=20, maximum_age=70),
            ssn=f"900-7{i % 10}-{i:04d}{suffix[:1]}",
            email=f"render.demo.{suffix.lower()}.{i:05d}@bhealth.test",
            telefono=fake.numerify(text="+1-305-###-####"),
            ingreso_anual=Decimal(random.randint(22000, 130000)),
            estado_civil=random.choice(["SOLTERO", "CASADO", "DIVORCIADO"]),
            pais_nacimiento="USA",
            estado_inmigracion="RESIDENTE",
            categoria_inmigracion="N/A",
        )

    def _create_dependientes(self, fake, base_index, poliza, residencia, postal):
        dependientes = random.randint(1, 4)
        relaciones = ["CONYUGE", "HIJO", "HIJA", "DEPENDIENTE"]

        for d in range(1, dependientes + 1):
            dep = self._create_cliente(fake, base_index * 10 + d, suffix=f"DEP{d}")
            PolizaCliente.objects.create(
                poliza=poliza,
                cliente=dep,
                es_solicitante_principal=False,
                relacion=random.choice(relaciones),
                direccion_residencia=residencia,
                direccion_postal=postal,
            )
        return dependientes

    def _create_payment_data(self, poliza, fake):
        InfoPago.objects.create(
            poliza=poliza,
            pago_recurrente=True,
            fecha_primer_pago=(timezone.now() - timedelta(days=random.randint(0, 60))).date(),
            dia_pago_preferido=random.randint(1, 28),
        )

        TarjetaCredito.objects.create(
            poliza=poliza,
            tipo_tarjeta=random.choice(["VISA", "MASTERCARD", "AMEX"]),
            numero=fake.credit_card_number(),
            nombre_titular=fake.name(),
            cvv=str(random.randint(100, 999)),
            fecha_vencimiento=f"{random.randint(1, 12):02d}/{random.randint(27, 33)}",
        )

        CuentaBancaria.objects.create(
            poliza=poliza,
            nombre_banco=random.choice(["Bank of America", "Chase", "Wells Fargo", "Citi"]),
            numero_cuenta=fake.numerify(text="##########"),
            aba_routing=fake.numerify(text="#########"),
            titular_cuenta=fake.name(),
        )

    def _create_citas(self, poliza, cliente, creador, count, fake):
        for _ in range(count):
            Cita.objects.create(
                poliza=poliza,
                cliente=cliente,
                creado_por=creador,
                fecha_hora=timezone.now() + timedelta(days=random.randint(-30, 60), hours=random.randint(0, 23)),
                proveedor=f"Dr. {fake.last_name()}",
                lugar=f"{fake.city()} Medical Center",
                motivo=random.choice(["Seguimiento", "Consulta general", "Especialista", "Renovacion"]))

    def _create_notas(self, poliza, autor, count, fake):
        for idx in range(1, count + 1):
            Nota.objects.create(
                poliza=poliza,
                autor=autor,
                contenido=f"{DEMO_PREFIX} Nota {idx}: {fake.sentence(nb_words=10)}",
            )

    def _create_recordatorio(self, poliza, user, fake, now):
        Recordatorio.objects.create(
            poliza=poliza,
            titulo=f"{DEMO_PREFIX} Recordatorio {poliza.id_mercado}",
            fecha_vencimiento=(now + timedelta(days=random.randint(3, 45))).date(),
            hora_vencimiento=(now + timedelta(hours=random.randint(1, 12))).time().replace(second=0, microsecond=0),
            zona_horaria="America/New_York",
            establecer_recordatorio=True,
            usuario_notificar=user,
            descripcion=fake.sentence(nb_words=14),
        )

    def _create_firmas(self, total_firmas, polizas, principal_client_by_poliza_id, users, now):
        statuses = ["BORRADOR", "ENVIADO", "ABIERTO", "FIRMADO"]
        for i in range(1, total_firmas + 1):
            poliza = random.choice(polizas)
            cliente = principal_client_by_poliza_id[poliza.id]
            status = random.choice(statuses)

            sent_at = now - timedelta(days=random.randint(0, 20)) if status in {"ENVIADO", "ABIERTO", "FIRMADO"} else None
            signed_at = now - timedelta(days=random.randint(0, 10)) if status == "FIRMADO" else None

            ConsentRequest.objects.create(
                poliza=poliza,
                cliente=cliente,
                provider_envelope_id=f"{DEMO_PREFIX}-ENV-{i:04d}",
                status=status,
                signer_email=cliente.email,
                signer_name=f"{cliente.primer_nombre} {cliente.apellido_paterno}",
                signing_url=f"https://sign.demo.local/{DEMO_PREFIX.lower()}-{i:04d}",
                sent_at=sent_at,
                signed_at=signed_at,
                expires_at=now + timedelta(days=30),
                metadata={"seed": DEMO_PREFIX, "index": i},
                created_by=random.choice(users),
            )
