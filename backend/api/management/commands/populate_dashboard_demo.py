from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import (
    Agencia,
    Agente,
    Aseguradora,
    Cliente,
    Direccion,
    EstadoPoliza,
    IntentoLoginFallido,
    Plan,
    Poliza,
    PolizaCliente,
    Recordatorio,
)


FIRST_NAMES = [
    "Juan", "Maria", "Carlos", "Ana", "Luis", "Fernanda", "Jose", "Sofia", "Miguel", "Paula",
    "Ricardo", "Valentina", "Andres", "Daniela", "Roberto", "Camila", "Jorge", "Lucia", "Diego", "Laura",
]

LAST_NAMES = [
    "Garcia", "Rodriguez", "Martinez", "Lopez", "Hernandez", "Perez", "Gonzalez", "Sanchez", "Ramirez", "Torres",
    "Flores", "Rivera", "Gomez", "Diaz", "Vasquez", "Castillo", "Morales", "Ortiz", "Mendoza", "Ramos",
]

US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
    "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming",
]


class Command(BaseCommand):
    help = (
        "Puebla datos demo para dashboard CRM (usuarios, agentes, clientes, polizas, "
        "recordatorios e intentos fallidos)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=150,
            help="Cantidad de polizas/clientes/items a crear (default: 150)",
        )
        parser.add_argument(
            "--no-reset",
            action="store_true",
            help="No borra datos demo previos antes de crear nuevos.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        count = int(options["count"])
        reset = not bool(options["no_reset"])

        if count < 1:
            self.stdout.write(self.style.ERROR("--count debe ser mayor que 0"))
            return

        if reset:
            self._reset_demo_data()

        random.seed(42)
        now = timezone.now()

        self.stdout.write("Creando catalogos base...")

        agencia, _ = Agencia.objects.get_or_create(
            nombre="Demo Agency Dashboard",
            defaults={
                "codigo_postal": "33101",
                "telefono": "+1 305 555 1000",
                "email": "demo.agency@bhealth.test",
            },
        )

        estados_poliza = self._ensure_policy_states()
        plans = self._create_plans()

        self.stdout.write("Creando usuarios y agentes demo...")
        users, agents = self._create_users_and_agents(agencia)

        self.stdout.write(f"Creando {count} clientes y {count} polizas demo...")
        created_clients, created_policies = self._create_clients_and_policies(
            count=count,
            users=users,
            agents=agents,
            plans=plans,
            estados_poliza=estados_poliza,
            now=now,
        )

        self.stdout.write(f"Creando {count} recordatorios demo...")
        self._create_recordatorios(count=count, users=users, policies=created_policies, now=now)

        self.stdout.write(f"Creando {count} intentos de inicio de sesion fallidos demo...")
        self._create_failed_logins(count=count, users=users, now=now)

        self.stdout.write(
            self.style.SUCCESS(
                (
                    "Poblacion demo completada: "
                    f"{len(users)} usuarios, "
                    f"{len(agents)} agentes, "
                    f"{len(created_clients)} clientes, "
                    f"{len(created_policies)} polizas, "
                    f"{count} recordatorios y {count} intentos fallidos."
                )
            )
        )

    def _reset_demo_data(self):
        self.stdout.write("Eliminando datos demo previos...")

        IntentoLoginFallido.objects.filter(user_agent__icontains="DEMO-SEED").delete()
        Recordatorio.objects.filter(titulo__startswith="DEMO Recordatorio").delete()
        Poliza.objects.filter(id_mercado__startswith="DEMO-POL-").delete()
        Cliente.objects.filter(email__startswith="demo.cliente").delete()
        Direccion.objects.filter(linea1__startswith="DEMO-").delete()

        Agente.objects.filter(npn__startswith="DEMO-NPN-").delete()
        User.objects.filter(username__startswith="demo_user_").delete()

        Plan.objects.filter(id_plan_aseguradora__startswith="DEMO-").delete()
        Aseguradora.objects.filter(nombre__startswith="Demo Aseguradora ").delete()
        Agencia.objects.filter(nombre="Demo Agency Dashboard").delete()

    def _ensure_policy_states(self):
        desired = [
            ("Activo", "#10b981"),
            ("Pendiente", "#f59e0b"),
            ("En Peligro", "#ef4444"),
            ("Cancelado", "#6b7280"),
            ("Robado", "#8b5cf6"),
        ]
        result = []
        for name, color in desired:
            obj, _ = EstadoPoliza.objects.get_or_create(
                nombre=name,
                defaults={"color": color, "disponible_para_agentes": True},
            )
            result.append(obj)
        return result

    def _create_plans(self):
        plans = []
        product_names = [
            "Bronce", "Plata", "Oro", "Platino", "Familiar", "Empresarial", "Senior", "Basic Plus",
        ]
        for idx in range(1, 9):
            aseguradora, _ = Aseguradora.objects.get_or_create(nombre=f"Demo Aseguradora {idx}")
            for product in product_names[:2]:
                plan, _ = Plan.objects.get_or_create(
                    id_plan_aseguradora=f"DEMO-{idx}-{product.upper().replace(' ', '-')}",
                    defaults={
                        "nombre": f"{product} {idx}",
                        "aseguradora": aseguradora,
                    },
                )
                # Si ya existia con defaults distintos, asegurar consistencia.
                if plan.aseguradora_id != aseguradora.id:
                    plan.aseguradora = aseguradora
                    plan.nombre = f"{product} {idx}"
                    plan.save(update_fields=["aseguradora", "nombre"])
                plans.append(plan)
        return plans

    def _create_users_and_agents(self, agencia):
        role_cycle = ["ADMIN", "MANAGER", "ASISTENTE", "SHERPA", "PAGOS", "CITAS"]
        users = []
        agents = []

        for i in range(1, 31):
            username = f"demo_user_{i:03d}"
            first_name = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
            last_name = LAST_NAMES[(i - 1) % len(LAST_NAMES)]

            user = User.objects.create_user(
                username=username,
                email=f"{username}@bhealth.test",
                password="Demo12345!",
                first_name=first_name,
                last_name=last_name,
            )

            if hasattr(user, "profile"):
                profile = user.profile
                profile.role = role_cycle[(i - 1) % len(role_cycle)]
                profile.status = "ACTIVE"
                profile.telefono = f"+1305555{i:04d}"
                profile.save()

            users.append(user)

            if i <= 20:
                agent = Agente.objects.create(
                    npn=f"DEMO-NPN-{i:05d}",
                    nombre_completo=f"{first_name} {last_name}",
                    agencia=agencia,
                )
                agents.append(agent)

                if hasattr(user, "profile"):
                    profile = user.profile
                    profile.agente = agent
                    profile.save(update_fields=["agente"])

        return users, agents

    def _create_clients_and_policies(self, count, users, agents, plans, estados_poliza, now):
        clients = []
        policies = []

        today = now.date()

        for i in range(1, count + 1):
            first_name = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
            last_name = LAST_NAMES[(i * 3 - 1) % len(LAST_NAMES)]

            # Forzar varios cumpleanos dentro de la semana para enriquecer esa card.
            if i <= 25:
                birthday_ref = today + timedelta(days=(i % 7))
                birth_date = birthday_ref.replace(year=1980 + (i % 20))
            else:
                birth_date = today - timedelta(days=365 * (20 + (i % 40)) + (i % 300))

            client = Cliente.objects.create(
                primer_nombre=first_name,
                segundo_nombre="",
                apellido_paterno=last_name,
                apellido_materno="",
                genero="M" if i % 2 == 0 else "F",
                fecha_nacimiento=birth_date,
                ssn=f"999-88-{i:04d}",
                email=f"demo.cliente{i:04d}@bhealth.test",
                telefono=f"+1-305-700-{i:04d}",
                ingreso_anual=Decimal("35000") + Decimal(i * 150),
                estado_civil="SOLTERO" if i % 2 == 0 else "CASADO",
                pais_nacimiento="USA",
                estado_inmigracion="RESIDENTE",
                categoria_inmigracion="N/A",
                fecha_creacion=now - timedelta(days=random.randint(0, 365)),
            )
            clients.append(client)

            policy_state = random.choice(estados_poliza)
            plan = random.choice(plans)
            agent = random.choice(agents)
            creator_user = random.choice(users)

            us_state = US_STATES[(i - 1) % len(US_STATES)]
            address = Direccion.objects.create(
                linea1=f"DEMO-{100 + i} Main St",
                linea2="",
                ciudad=f"City {i % 40}",
                estado=us_state,
                zip_code=f"{10000 + i}",
                condado=f"County {i % 30}",
            )

            total_aplicantes = random.randint(1, 6)
            total_dependientes = max(total_aplicantes - 1, 0)

            fecha_efectiva = today - timedelta(days=random.randint(0, 365))

            policy = Poliza.objects.create(
                id_mercado=f"DEMO-POL-{i:05d}",
                id_miembro=f"DEMO-MEM-{i:05d}",
                costo_poliza=Decimal("220.00") + Decimal(i % 50),
                subsidio=Decimal("40.00") + Decimal(i % 20),
                prima_mensual=Decimal("180.00") + Decimal(i % 35),
                total_ahorros=Decimal("0.00"),
                plan_era="Demo",
                fecha_efectiva=fecha_efectiva,
                estado=policy_state,
                fecha_envio=fecha_efectiva - timedelta(days=random.randint(1, 15)),
                agente=agent,
                plan=plan,
                flujo_etapa="CAPTURA_ASISTENTE",
                total_miembros=total_aplicantes,
                total_aplicantes=total_aplicantes,
                total_dependientes=total_dependientes,
                direccion_fisica=address,
                direccion_postal=address,
                direccion_facturacion=address,
            )
            policies.append(policy)

            PolizaCliente.objects.create(
                poliza=policy,
                cliente=client,
                es_solicitante_principal=True,
                relacion="SOLICITANTE",
                direccion_residencia=address,
                direccion_postal=address,
            )

            # Garantiza que algunas entidades tengan colaborador para enriquecer data de usuarios.
            if i % 3 == 0:
                policy.colaboradores.add(creator_user)

        return clients, policies

    def _create_recordatorios(self, count, users, policies, now):
        for i in range(1, count + 1):
            policy = random.choice(policies)
            notify_user = random.choice(users)
            due_date = (now + timedelta(days=random.randint(-15, 45))).date()
            due_time = (now + timedelta(minutes=random.randint(0, 1440))).time().replace(second=0, microsecond=0)

            Recordatorio.objects.create(
                poliza=policy,
                titulo=f"DEMO Recordatorio {i:04d}",
                fecha_vencimiento=due_date,
                hora_vencimiento=due_time,
                zona_horaria="America/New_York",
                establecer_recordatorio=True,
                usuario_notificar=notify_user,
                descripcion="Generado automaticamente para dashboard demo.",
            )

    def _create_failed_logins(self, count, users, now):
        for i in range(1, count + 1):
            user = random.choice(users)
            attempted_at = now - timedelta(days=random.randint(0, 120), minutes=random.randint(0, 1440))
            login = IntentoLoginFallido.objects.create(
                usuario_intentado=user.username if i % 2 == 0 else user.email,
                password_intentado="incorrect-password",
                ip_address=f"192.168.{(i % 100) + 1}.{(i % 200) + 1}",
                user_agent="DEMO-SEED Dashboard/1.0",
            )
            IntentoLoginFallido.objects.filter(pk=login.pk).update(fecha_intento=attempted_at)
