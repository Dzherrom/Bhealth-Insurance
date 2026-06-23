from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from api.client_portal import ensure_portal_user_for_cliente, get_primary_poliza_for_cliente
from api.models import CambioDeVida, Documento, PolizaCliente, UserProfile


class PortalClienteAPITests(APITestCase):
    def setUp(self):
        self.client_api = APIClient()
        link = (
            PolizaCliente.objects.filter(es_solicitante_principal=True)
            .select_related('cliente')
            .first()
        )
        if not link:
            self.skipTest('No hay pólizas con solicitante principal en la base de datos de prueba.')

        self.cliente = link.cliente
        profile = UserProfile.objects.filter(cliente=self.cliente, role='CLIENTE').select_related('user').first()
        if profile:
            self.user = profile.user
        else:
            self.user, _ = ensure_portal_user_for_cliente(self.cliente, 'portaltest123')

        self.poliza = get_primary_poliza_for_cliente(self.cliente)
        self.client_api.force_authenticate(user=self.user)

    def test_dashboard_ok(self):
        response = self.client_api.get('/api/portal-cliente/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('nombre_completo', response.data)
        self.assertIn('tarjetas_digitales', response.data)
        self.assertIn('cuentas_bancarias', response.data)
        self.assertIn('cambios_pendientes', response.data)

    def test_solicitar_documento_crea_cambio_de_vida(self):
        if not self.poliza:
            self.skipTest('Cliente sin póliza principal.')

        upload = SimpleUploadedFile('test.pdf', b'%PDF-1.4 test', content_type='application/pdf')
        response = self.client_api.post(
            '/api/portal-cliente/solicitar-documento/',
            {
                'poliza_id': self.poliza.id,
                'titulo': 'Documento de prueba portal',
                'categoria': 'IDENTIFICACION',
                'archivo': upload,
                'comentario': 'Prueba automatizada',
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        self.assertTrue(
            Documento.objects.filter(poliza=self.poliza, titulo='Documento de prueba portal').exists()
        )
        self.assertTrue(
            CambioDeVida.objects.filter(
                poliza=self.poliza,
                creado_por=self.user,
                estado='PENDIENTE',
            ).exists()
        )

        dashboard = self.client_api.get('/api/portal-cliente/dashboard/')
        self.assertEqual(dashboard.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(dashboard.data.get('cambios_pendientes', [])), 1)

    def test_dashboard_sin_poliza_incluye_arreglos_vacios(self):
        user = User.objects.create_user(username='cliente_sin_poliza', password='testpass123', email='sinpoliza@test.com')
        profile = user.profile
        profile.role = 'CLIENTE'
        profile.save(update_fields=['role'])

        self.client_api.force_authenticate(user=user)
        response = self.client_api.get('/api/portal-cliente/dashboard/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
        if response.status_code == status.HTTP_200_OK and response.data.get('poliza') is None:
            self.assertEqual(response.data.get('cambios_pendientes'), [])
            self.assertEqual(response.data.get('tarjetas_digitales'), [])
