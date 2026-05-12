import random
from django.core.management.base import BaseCommand
from api.models import Poliza, Direccion
from faker import Faker

class Command(BaseCommand):
    help = 'Asigna direcciones fÃsicas, postales y de facturaciÃ³n en USA a las pÃ³lizas que no las tengan.'

    def handle(self, *args, **kwargs):
        usa_states = [
            'FL', 'TX', 'CA', 'NY', 'IL', 'OH', 'GA', 'NC', 'MI', 'PA', 
            'AZ', 'WA', 'MA', 'IN', 'TN', 'MO', 'MD', 'WI', 'CO'
        ]
        
        polizas_sin_direccion = Poliza.objects.filter(
            direccion_fisica__isnull=True
        ) | Poliza.objects.filter(
            direccion_postal__isnull=True
        ) | Poliza.objects.filter(
            direccion_facturacion__isnull=True
        )

        polizas_sin_direccion = polizas_sin_direccion.distinct()
        
        count = polizas_sin_direccion.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("Todas las pÃ³lizas ya tienen sus 3 direcciones correspondientes."))
            return

        fake = Faker('en_US')
        
        self.stdout.write(f"Iniciando asignaciÃ³n de direcciones para {count} pÃ³lizas...")
        
        generados = 0
        for poliza in polizas_sin_direccion:
            # FÃsica
            if not poliza.direccion_fisica:
                df = Direccion.objects.create(
                    linea1=fake.street_address(),
                    ciudad=fake.city(),
                    estado=random.choice(usa_states),
                    zip_code=fake.postcode(),
                    condado=fake.city() + " County"
                )
                poliza.direccion_fisica = df
                
            # Postal
            if not poliza.direccion_postal:
                if poliza.direccion_fisica and random.random() > 0.2:
                    dp = poliza.direccion_fisica
                else:
                    dp = Direccion.objects.create(
                        linea1=fake.street_address(),
                        ciudad=fake.city(),
                        estado=random.choice(usa_states),
                        zip_code=fake.postcode(),
                        condado=fake.city() + " County"
                    )
                poliza.direccion_postal = dp
                
            # FacturaciÃ³n
            if not poliza.direccion_facturacion:
                if poliza.direccion_fisica and random.random() > 0.2:
                    dfac = poliza.direccion_fisica
                else:
                    dfac = Direccion.objects.create(
                        linea1=fake.street_address(),
                        ciudad=fake.city(),
                        estado=random.choice(usa_states),
                        zip_code=fake.postcode(),
                        condado=fake.city() + " County"
                    )
                poliza.direccion_facturacion = dfac
                
            poliza.save()
            generados += 1
            
        self.stdout.write(self.style.SUCCESS(f'Â¡Ã‰xito! Se actualizaron {generados} pÃ³lizas con sus 3 direcciones respectivas en USA.'))
