import datetime
from decimal import Decimal

from django.test import TestCase

from api.models import EstadoPoliza, Poliza, TipoProducto


class PolizaPrimaMensualTests(TestCase):
    def setUp(self):
        self.tipo, _ = TipoProducto.objects.get_or_create(nombre='Health Insurance (ACA)')
        self.estado, _ = EstadoPoliza.objects.get_or_create(nombre='Activo')

    def test_prima_mensual_is_overwritten_on_create(self):
        poliza = Poliza.objects.create(
            id_mercado='MKT-PRIMA-001',
            id_miembro='MEM-PRIMA-001',
            costo_poliza=Decimal('500.00'),
            subsidio=Decimal('450.00'),
            prima_mensual=Decimal('999.00'),
            fecha_envio=datetime.date(2026, 1, 1),
            estado=self.estado,
            tipo_producto=self.tipo,
        )

        poliza.refresh_from_db()
        self.assertEqual(poliza.prima_mensual, Decimal('50.00'))

    def test_prima_mensual_is_clamped_to_zero(self):
        poliza = Poliza.objects.create(
            id_mercado='MKT-PRIMA-002',
            id_miembro='MEM-PRIMA-002',
            costo_poliza=Decimal('100.00'),
            subsidio=Decimal('150.00'),
            prima_mensual=Decimal('10.00'),
            fecha_envio=datetime.date(2026, 1, 1),
            estado=self.estado,
            tipo_producto=self.tipo,
        )

        poliza.refresh_from_db()
        self.assertEqual(poliza.prima_mensual, Decimal('0.00'))

    def test_prima_mensual_is_overwritten_on_update(self):
        poliza = Poliza.objects.create(
            id_mercado='MKT-PRIMA-003',
            id_miembro='MEM-PRIMA-003',
            costo_poliza=Decimal('300.00'),
            subsidio=Decimal('100.00'),
            prima_mensual=Decimal('0.00'),
            fecha_envio=datetime.date(2026, 1, 1),
            estado=self.estado,
            tipo_producto=self.tipo,
        )

        poliza.subsidio = Decimal('200.00')
        poliza.prima_mensual = Decimal('999.00')
        poliza.save(update_fields=['subsidio', 'prima_mensual'])
        poliza.refresh_from_db()

        self.assertEqual(poliza.prima_mensual, Decimal('100.00'))
