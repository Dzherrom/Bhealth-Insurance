from django.core.management.base import BaseCommand
from django.utils import timezone

from api.recordatorio_utils import process_due_recordatorio_notifications


class Command(BaseCommand):
    help = 'Envía notificaciones a agentes según la antelación configurada en cada recordatorio.'

    def handle(self, *args, **options):
        now = timezone.now()
        self.stdout.write(f'Procesando recordatorios pendientes ({now.isoformat()})...')
        sent = process_due_recordatorio_notifications(now=now)
        self.stdout.write(self.style.SUCCESS(f'Notificaciones enviadas: {sent}'))
