"""
Comando legacy. Redirige a populate_full_demo_data para compatibilidad
con builds de Render que aún invocan populate_mock_data.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Deprecated: usa populate_full_demo_data. Se mantiene por compatibilidad con deploys antiguos.'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                'populate_mock_data está obsoleto. Ejecutando populate_full_demo_data...'
            )
        )
        call_command(
            'populate_full_demo_data',
            polizas=100,
            quotes=12,
            skip_if_exists=True,
        )
