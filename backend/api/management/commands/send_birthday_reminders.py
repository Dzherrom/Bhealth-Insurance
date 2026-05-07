
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Poliza, Cliente
from django.db.models import Q

class Command(BaseCommand):
    help = 'Send birthday reminders to agents for their clients'

    def handle(self, *args, **options):
        today = timezone.now().date()
        self.stdout.write(f"Checking birthdays for {today}...")

        # 1. Find clients with birthday today
        birthday_clients = Cliente.objects.filter(
            fecha_nacimiento__month=today.month,
            fecha_nacimiento__day=today.day
        )

        if not birthday_clients.exists():
            self.stdout.write("No clients have a birthday today.")
            return

        count = 0
        for cliente in birthday_clients:
            # 2. Find active policies for this client
            # We assume 'Active' means not cancelled (fecha_cancelacion is None or in future)
            # Also checking if 'estado' implies active if possible, but relying on cancellation date is safer per prompt.
            polizas = cliente.polizas.filter(
                Q(fecha_cancelacion__isnull=True) | Q(fecha_cancelacion__gt=today)
            ).select_related('agente', 'agente__user_profile', 'agente__user_profile__user')

            for poliza in polizas:
                agente = poliza.agente
                if not agente:
                    continue

                # 3. Check Agent's Role
                # Access UserProfile via reverse relation 'user_profile'
                if hasattr(agente, 'user_profile'):
                    profile = agente.user_profile
                    role = profile.role
                    
                    # Roles authorized to receive alerts: Admin, Manager, Asistente
                    AUTHORIZED_ROLES = ['ADMIN', 'MANAGER', 'ASISTENTE']

                    if role in AUTHORIZED_ROLES:
                        self.send_notification(profile.user, cliente, poliza)
                        count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully sent {count} birthday reminders.'))

    def send_notification(self, user, cliente, poliza):
        # Simulated notification
        message = (
            f"Hola {user.first_name} {user.last_name} ({user.username}), "
            f"hoy es el cumpleaños de tu cliente {cliente.primer_nombre} {cliente.apellido_paterno} "
            f"de la póliza {poliza.id_mercado}."
        )
        self.stdout.write(self.style.SUCCESS(f"[EMAIL SENT] To: {user.email} | Body: {message}"))
