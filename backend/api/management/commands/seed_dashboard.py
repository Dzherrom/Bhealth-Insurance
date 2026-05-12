import random
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import (
    Agencia, Agente, Aseguradora, Plan, EstadoPoliza,
    Cliente, Poliza, PolizaCliente, Direccion
)
from django.contrib.auth.models import User
from faker import Faker

class Command(BaseCommand):
    help = 'Rellena la base de datos con información 100% enfocada en alimentar todas las estadísticas del Dashboard.'

    def handle(self, *args, **kwargs):
        # 0. ASEGURAR QUE SOLO SE EJECUTE UNA VEZ (Idempotencia)
        if Poliza.objects.filter(total_miembros=1, id_mercado__startswith='MKT-').count() > 50:
            self.stdout.write(self.style.WARNING("Los datos simulados del Dashboard ya están sembrados en la base de datos. Saltando inyección para no duplicar información."))
            return

        fake = Faker('en_US')  # Usamos el de USA para que las direcciones y nombres encajen en el CRM
        
        self.stdout.write("Iniciando inyección de datos para el Dashboard...")

        # 1. Asegurar Estados de PÃ³liza compatibles con Stats View (icontains)
        estados_nombres = [
            'Efectiva', 'Pagada', 'Activa', 'En Peligro (Bill/Payment)', 
            'Cancelado', 'Por Efectuar (Pending)', 'Robado', 'Document Pendiente (Document)',
            'Espera' 
        ]
        estados_db = []
        for nombre in estados_nombres:
            est, _ = EstadoPoliza.objects.get_or_create(nombre=nombre)
            estados_db.append(est)

        # 2. Asegurar que haya Agentes y Usuarios Colaboradores
        agentes = list(Agente.objects.all())
        if not agentes:
            agencia, _ = Agencia.objects.get_or_create(nombre='Agencia Central', defaults={'codigo_postal': '10001'})
            for _ in range(5):
                agentes.append(Agente.objects.create(
                    npn=fake.unique.numerify('##########'), 
                    nombre_completo=fake.name(), 
                    agencia=agencia
                ))
            self.stdout.write("Se crearon 5 agentes ficticios porque no existían.")

        # 3. Datos Plan/Aseguradora
        aseguradora, _ = Aseguradora.objects.get_or_create(nombre='Ambetter')
        plan, _ = Plan.objects.get_or_create(id_plan_aseguradora='AMB-100', nombre='Plan Gold', aseguradora=aseguradora)
        
        # 4. Estados reales de USA para el mapa del Dashboard (Choropleth/BarChart)
        usa_states = [
            'FL', 'TX', 'CA', 'NY', 'IL', 'OH', 'GA', 'NC', 'MI', 'PA', 
            'FL', 'FL', 'TX', 'TX' # Más peso a Florida y Texas intencionalmente
        ]
        # 5. Obtener Admin User principal para asignar como colaborador
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.first() # Fallback a cualquiera si no hay syperuser
        now = timezone.now()
        generados = 0

        # Crear 60 pólizas ficticias
        for i in range(60):
            # A) Crear Dirección Física
            estado_random = random.choice(usa_states)
            direccion = Direccion.objects.create(
                linea1=fake.street_address(),
                ciudad=fake.city(),
                estado=estado_random,
                zip_code=fake.postcode(),
                condado=fake.city() + " County"
            )

            # B) Crear el Cliente Principal
            cliente_principal = Cliente.objects.create(
                primer_nombre=fake.first_name(),
                apellido_paterno=fake.last_name(),
                genero=random.choice(['Masculino', 'Femenino']),
                fecha_nacimiento=fake.date_of_birth(minimum_age=18, maximum_age=65),
                ssn=fake.unique.numerify('###-##-####'),
                email=fake.unique.email(),
                telefono=fake.numerify('###-###-####'),
                ingreso_anual=Decimal(random.randint(20000, 100000)),
                estado_civil='Soltero',
                pais_nacimiento='USA',
                estado_inmigracion='Ciudadano',
            )

            # C) Elegir Agente Random para alimentar el "Top Agentes"
            agente = random.choice(agentes)

            # D) Establecer Fechas (50% de probabilidad de ser de "Este Mes" para mover la gráfica)
            es_reciente = random.random() > 0.5
            fecha_envio = now - timedelta(days=random.randint(0, 15)) if es_reciente else now - timedelta(days=random.randint(30, 200))

            # E) Montos para afectar el "Balance de Empresa (Pagados vs No Pagados)"
            prima_mensual = Decimal(random.randint(50, 450))

            # F) Crear la Póliza conectando todo
            estado_asignado = random.choice(estados_db)
            
            # Condicionales para hacer match con Stats Views (Desincronizado, Duplicado, Consentimiento)
            es_desincronizado = random.random() > 0.8
            es_duplicado = random.random() > 0.9
            consentimiento_val = random.choice(['NO_ENVIADO', 'ENVIADO', 'FIRMADO'])

            poliza = Poliza.objects.create(
                id_mercado=fake.unique.numerify('MKT-##########'),
                id_miembro=fake.unique.numerify('MEM-##########'),
                costo_poliza=Decimal(random.randint(500, 1500)),
                subsidio=Decimal(random.randint(0, 500)),
                prima_mensual=prima_mensual,
                fecha_efectiva=fecha_envio + timedelta(days=10),
                estado=estado_asignado,
                fecha_envio=fecha_envio,
                id_interno="" if es_desincronizado else fake.unique.uuid4()[:8],
                es_duplicado=es_duplicado,
                estado_consentimiento=consentimiento_val,
                agente=agente,
                plan=plan,
                direccion_fisica=direccion,
                total_miembros=1, 
                total_aplicantes=1,
            )
            
            if es_desincronizado:
                 Poliza.objects.filter(id=poliza.id).update(id_interno=None)

            if admin_user:
                poliza.colaboradores.add(admin_user)

            # G) Conectar el cliente a la póliza
            PolizaCliente.objects.create(
                poliza=poliza,
                cliente=cliente_principal,
                es_solicitante_principal=True,
                relacion='Solicitante Principal'
            )
            
            generados += 1

        self.stdout.write(self.style.SUCCESS(f'¡Éxito! Se crearon {generados} pólizas completas asignadas a diversos Agentes, con Direcciones en varios estados de USA y montos financieros esparcidos.'))