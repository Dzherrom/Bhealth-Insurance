import datetime
from decimal import Decimal
from tempfile import TemporaryDirectory

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.models import Prefetch
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from api.models import (
    Agencia,
    Cita,
    Cliente,
    EstadoPoliza,
    Poliza,
    PolizaCliente,
    PolizaCliente,
    Siniestro,
    SiniestroHistorial,
    TipoProducto,
)
from api.serializers import CitaSerializer


class SiniestrosAPITests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.media_dir = TemporaryDirectory()
        self.addCleanup(self.media_dir.cleanup)
        media_override = override_settings(MEDIA_ROOT=self.media_dir.name)
        media_override.enable()
        self.addCleanup(media_override.disable)
        self.user = User.objects.create_user(username='siniestros-admin', password='testpass123')
        self.user.profile.role = 'SUPER_ADMIN'
        self.user.profile.save(update_fields=['role'])
        self.api.force_authenticate(self.user)

        self.agencia = Agencia.objects.create(nombre='Agencia de prueba')
        self.cliente = Cliente.objects.create(
            primer_nombre='Ana',
            apellido_paterno='Prueba',
            genero='F',
            fecha_nacimiento=datetime.date(1990, 1, 1),
            ssn='900000001',
            ingreso_anual=Decimal('50000'),
            estado_civil='Soltera',
            pais_nacimiento='Venezuela',
            estado_inmigracion='Residente',
        )
        self.otro_cliente = Cliente.objects.create(
            primer_nombre='Luis',
            apellido_paterno='Ajeno',
            genero='M',
            fecha_nacimiento=datetime.date(1988, 2, 2),
            ssn='900000002',
            ingreso_anual=Decimal('60000'),
            estado_civil='Soltero',
            pais_nacimiento='Venezuela',
            estado_inmigracion='Residente',
        )
        self.estado, _ = EstadoPoliza.objects.get_or_create(nombre='Activa')
        self.pc, _ = TipoProducto.objects.get_or_create(
            nombre='Property & Casualty (P&C)',
            defaults={'descripcion': 'Hogar y auto'},
        )
        self.health, _ = TipoProducto.objects.get_or_create(
            nombre='Health Insurance (ACA)',
            defaults={'descripcion': 'Seguro médico'},
        )
        self.pc_policy = self.create_policy('PYC-TEST-01', self.pc, self.cliente)
        self.health_policy = self.create_policy('HEALTH-TEST-01', self.health, self.cliente)

    def create_policy(self, code, product, client):
        policy = Poliza.objects.create(
            id_mercado=code,
            id_miembro=f'MEMBER-{code}',
            costo_poliza=Decimal('100.00'),
            subsidio=Decimal('0.00'),
            prima_mensual=Decimal('100.00'),
            fecha_envio=datetime.date(2026, 1, 1),
            estado=self.estado,
            tipo_producto=product,
        )
        PolizaCliente.objects.create(
            poliza=policy,
            cliente=client,
            es_solicitante_principal=True,
            relacion='Titular',
        )
        return policy

    def siniestro_payload(self, **overrides):
        payload = {
            'poliza': self.pc_policy.pk,
            'cliente': self.cliente.pk,
            'tipo': 'HOGAR',
            'causa': 'AGUA',
            'fecha_evento': '2026-11-18T10:30:00',
            'lugar_evento': 'Caracas',
            'descripcion': 'Daño por fuga de agua.',
            'monto_estimado': '1250.00',
            'estado': 'RECIBIDO',
        }
        payload.update(overrides)
        return payload

    def test_policy_search_only_returns_non_archived_p_and_c_policies_with_clients(self):
        response = self.api.get('/api/polizas/para-siniestro/', {'search': 'Ana'})

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 1)
        policy = response.data['results'][0]
        self.assertEqual(policy['id'], self.pc_policy.pk)
        self.assertEqual(policy['clientes'][0]['cliente_id'], self.cliente.pk)

    def test_create_siniestro_records_identifier_and_initial_history(self):
        response = self.api.post('/api/siniestros/', self.siniestro_payload(), format='json')

        self.assertEqual(response.status_code, 201, response.data)
        siniestro = Siniestro.objects.get(pk=response.data['id'])
        self.assertTrue(siniestro.numero_siniestro.startswith('SIN-'))
        self.assertEqual(siniestro.reportado_por, self.user)
        self.assertTrue(
            SiniestroHistorial.objects.filter(
                siniestro=siniestro,
                accion='SINIESTRO_REGISTRADO',
            ).exists()
        )
        summary = self.api.get('/api/siniestros/resumen/')
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.data['total'], 1)
        self.assertEqual(summary.data['por_estado']['RECIBIDO'], 1)

    def test_health_policy_and_unlinked_client_are_rejected(self):
        response = self.api.post(
            '/api/siniestros/',
            self.siniestro_payload(poliza=self.health_policy.pk),
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('poliza', response.data)

        response = self.api.post(
            '/api/siniestros/',
            self.siniestro_payload(cliente=self.otro_cliente.pk),
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('cliente', response.data)

    def test_update_creates_history_and_attached_evidence_is_downloadable(self):
        siniestro = Siniestro.objects.create(
            poliza=self.pc_policy,
            cliente=self.cliente,
            tipo='HOGAR',
            fecha_evento=datetime.datetime(2026, 11, 18, 10, 30, tzinfo=datetime.timezone.utc),
            lugar_evento='Caracas',
            descripcion='Daño por fuga de agua.',
            reportado_por=self.user,
        )
        response = self.api.patch(
            f'/api/siniestros/{siniestro.pk}/',
            {'estado': 'EN_REVISION'},
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(
            SiniestroHistorial.objects.filter(
                siniestro=siniestro,
                accion='ESTADO_ACTUALIZADO',
            ).exists()
        )

        upload = SimpleUploadedFile('evidencia.pdf', b'%PDF-1.4 evidencia', content_type='application/pdf')
        attachment = self.api.post(
            '/api/siniestros-adjuntos/',
            {'siniestro': siniestro.pk, 'archivo': upload, 'nombre': 'evidencia.pdf'},
            format='multipart',
        )
        self.assertEqual(attachment.status_code, 201, attachment.data)
        download = self.api.get(f"/api/siniestros-adjuntos/{attachment.data['id']}/descargar/")
        self.assertEqual(download.status_code, 200)
        b''.join(download.streaming_content)
        download.close()

    def test_cita_serialization_uses_prefetched_primary_client(self):
        Cita.objects.create(
            poliza=self.pc_policy,
            cliente=None,
            creado_por=self.user,
            fecha_hora=datetime.datetime(2026, 11, 20, 10, 0, tzinfo=datetime.timezone.utc),
            proveedor='Proveedor',
            lugar='Caracas',
        )
        queryset = Cita.objects.select_related(
            'poliza', 'cliente', 'creado_por', 'medico_asignado'
        ).prefetch_related(
            Prefetch(
                'poliza__polizacliente_set',
                queryset=PolizaCliente.objects.select_related('cliente').filter(
                    es_solicitante_principal=True,
                ),
            ),
        )
        with self.assertNumQueries(2):
            payload = CitaSerializer(list(queryset), many=True).data
        self.assertEqual(payload[0]['cliente_nombre'], 'Ana Prueba')

        page = self.api.get('/api/citas/?page_size=10')
        self.assertEqual(page.status_code, 200, page.data)
        self.assertEqual(page.data['count'], 1)
        self.assertEqual(len(page.data['results']), 1)
        summary = self.api.get('/api/citas/resumen/')
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.data['total'], 1)
        self.assertEqual(summary.data['programadas'], 1)

    def test_cita_accepts_a_policy_dependent_and_validates_cost(self):
        dependent = Cliente.objects.create(
            primer_nombre='Eva',
            apellido_paterno='Dependiente',
            genero='F',
            fecha_nacimiento=datetime.date(2015, 5, 5),
            ssn='900000003',
            ingreso_anual=Decimal('0'),
            estado_civil='Soltera',
            pais_nacimiento='Venezuela',
            estado_inmigracion='Residente',
        )
        PolizaCliente.objects.create(
            poliza=self.pc_policy,
            cliente=dependent,
            es_solicitante_principal=False,
            relacion='Hija',
        )

        response = self.api.post(
            '/api/citas/',
            {
                'poliza': self.pc_policy.pk,
                'cliente': dependent.pk,
                'fecha_hora': '2026-11-20T10:00:00',
                'proveedor': 'Clínica de prueba',
                'lugar': 'Caracas',
                'costo': '85.50',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.data)
        cita = Cita.objects.get(pk=response.data['id'])
        self.assertEqual(cita.cliente, dependent)
        self.assertEqual(cita.costo, Decimal('85.50'))
        self.assertEqual(response.data['cliente_nombre'], 'Eva Dependiente')

        invalid_response = self.api.post(
            '/api/citas/',
            {
                'poliza': self.pc_policy.pk,
                'cliente': dependent.pk,
                'fecha_hora': '2026-11-20T10:00:00',
                'proveedor': 'Clínica de prueba',
                'lugar': 'Caracas',
                'costo': '-1.00',
            },
            format='json',
        )
        self.assertEqual(invalid_response.status_code, 400)
        self.assertIn('costo', invalid_response.data)
