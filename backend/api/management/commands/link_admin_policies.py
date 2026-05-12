from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Poliza

class Command(BaseCommand):
    help = 'Vincula todas las pÃ³lizas existentes al usuario bhealth-admin como colaborador.'

    def handle(self, *args, **kwargs):
        admin_user = User.objects.filter(username='bhealth-admin').first()
        
        if not admin_user:
            self.stdout.write(self.style.WARNING("No se encontrÃ³ al usuario 'bhealth-admin'. Buscando un superusuario alternativo..."))
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = User.objects.first()
        
        if not admin_user:
            self.stdout.write(self.style.ERROR("No hay usuarios en la base de datos."))
            return

        self.stdout.write(f"Vinculando pÃ³lizas al usuario: {admin_user.username} (ID: {admin_user.id})...")
        
        polizas = Poliza.objects.all()
        count = 0
        for poliza in polizas:
            poliza.colaboradores.add(admin_user)
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f"Â¡Ã‰xito! Se han vinculado {count} pÃ³lizas al usuario {admin_user.username}."))
