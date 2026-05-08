import random
import uuid
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import (
    Agencia, Agente, Aseguradora, Plan, EstadoPoliza,
    Cliente, Poliza, PolizaCliente, Direccion
)
from faker import Faker

class Command(BaseCommand):
    help = 'Populate the database with 25 mock policies and clients, assigned to existing agents.'

    def handle(self, *args, **kwargs):
        # Evitar generar datos duplicados si ya existen
        if Poliza.objects.filter(id_mercado__startswith='MKT-').exists():
            self.stdout.write(self.style.SUCCESS("Mock data already exists. Skipping data generation."))
            return

        fake = Faker('es_MX')  # Or 'es_US', 'en_US' depends on preference
        
        self.stdout.write("Starting data generation...")

        # Ensure basic related data exists
        agencia, _ = Agencia.objects.get_or_create(nombre='Agencia Mock', defaults={'codigo_postal': '12345'})
        
        agentes = list(Agente.objects.all())
        if not agentes:
            self.stdout.write("No Agentes found. Creating 2 mock agents.")
            agentes.append(Agente.objects.create(npn=fake.unique.numerify('##########'), nombre_completo=fake.name(), agencia=agencia))
            agentes.append(Agente.objects.create(npn=fake.unique.numerify('##########'), nombre_completo=fake.name(), agencia=agencia))

        aseguradora, _ = Aseguradora.objects.get_or_create(nombre='Mock Seguro')
        plan, _ = Plan.objects.get_or_create(id_plan_aseguradora='P-100', nombre='Plan Mock Básico', aseguradora=aseguradora)
        estado_poliza, _ = EstadoPoliza.objects.get_or_create(nombre='Activa')

        relaciones = ['Cónyuge', 'Hijo/a']

        generados = 0
        for i in range(25):
            # Create Main Client
            cliente_principal = Cliente.objects.create(
                primer_nombre=fake.first_name(),
                apellido_paterno=fake.last_name(),
                genero=random.choice(['Masculino', 'Femenino']),
                fecha_nacimiento=fake.date_of_birth(minimum_age=18, maximum_age=65),
                ssn=fake.unique.numerify('###-##-####'),
                email=fake.unique.email(),
                telefono=fake.numerify('###-###-####'),
                ingreso_anual=Decimal(random.randint(20000, 100000)),
                estado_civil=random.choice(['Soltero', 'Casado', 'Divorciado']),
                pais_nacimiento='USA',
                estado_inmigracion='Ciudadano',
            )

            # Assign random Agent
            agente = random.choice(agentes)

            # Create Policy
            poliza = Poliza.objects.create(
                id_mercado=fake.unique.numerify('MKT-##########'),
                id_miembro=fake.unique.numerify('MEM-##########'),
                costo_poliza=Decimal(random.randint(500, 1000)),
                subsidio=Decimal(random.randint(0, 500)),
                prima_mensual=Decimal(random.randint(50, 300)),
                fecha_efectiva=fake.date_this_year(),
                estado=estado_poliza,
                fecha_envio=fake.date_this_year(),
                id_interno=fake.unique.uuid4()[:8],
                agente=agente,
                plan=plan,
                total_miembros=1, # Will update later
                total_aplicantes=1,
            )

            # Link Principal
            PolizaCliente.objects.create(
                poliza=poliza,
                cliente=cliente_principal,
                es_solicitante_principal=True,
                relacion='Solicitante Principal'
            )
            
            miembros = 1

            # Random Family Members
            # 50% chance of spouse if married
            if cliente_principal.estado_civil == 'Casado' and random.random() > 0.5:
                conyuge = Cliente.objects.create(
                    primer_nombre=fake.first_name(),
                    apellido_paterno=cliente_principal.apellido_paterno,
                    genero='Femenino' if cliente_principal.genero == 'Masculino' else 'Masculino',
                    fecha_nacimiento=fake.date_of_birth(minimum_age=18, maximum_age=65),
                    ssn=fake.unique.numerify('###-##-####'),
                    email=fake.unique.email(),
                    telefono=cliente_principal.telefono,
                    ingreso_anual=0,
                    estado_civil='Casado',
                    pais_nacimiento='USA',
                    estado_inmigracion='Ciudadano',
                )
                PolizaCliente.objects.create(
                    poliza=poliza,
                    cliente=conyuge,
                    es_solicitante_principal=False,
                    relacion='Cónyuge'
                )
                miembros += 1

            # 70% chance of 1-3 children
            if random.random() > 0.3:
                num_hijos = random.randint(1, 4)
                for _ in range(num_hijos):
                    hijo = Cliente.objects.create(
                        primer_nombre=fake.first_name(),
                        apellido_paterno=cliente_principal.apellido_paterno,
                        genero=random.choice(['Masculino', 'Femenino']),
                        fecha_nacimiento=fake.date_of_birth(minimum_age=0, maximum_age=25),
                        ssn=fake.unique.numerify('###-##-####'),
                        email=fake.unique.email(),
                        telefono=cliente_principal.telefono,
                        ingreso_anual=0,
                        estado_civil='Soltero',
                        pais_nacimiento='USA',
                        estado_inmigracion='Ciudadano',
                    )
                    PolizaCliente.objects.create(
                        poliza=poliza,
                        cliente=hijo,
                        es_solicitante_principal=False,
                        relacion='Hijo/a'
                    )
                    miembros += 1

            # Update totals
            poliza.total_miembros = miembros
            poliza.total_aplicantes = miembros
            poliza.save()
            
            generados += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {generados} mock policies and clients!'))
