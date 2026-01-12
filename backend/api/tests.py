from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from .models import (
    Agencia, Agente, Aseguradora, Plan, EstadoPoliza, Poliza, 
    Contrato, ReporteComision, Direccion
)
from django.core.files.uploadedfile import SimpleUploadedFile
import datetime

class CRUDSanityTests(APITestCase):
    def setUp(self):
        # Create User and authenticate
        self.user = User.objects.create_user(username='testadmin', password='password123')
        self.client.force_authenticate(user=self.user)

        # Create Dependencies
        self.direccion = Direccion.objects.create(
            linea1="123 Test St", ciudad="Test City", estado="TS", zip_code="12345", condado="County"
        )
        self.agencia = Agencia.objects.create(nombre="Test Agency", direccion_negocio=self.direccion)
        self.agente = Agente.objects.create(
            nombre_completo="Juan Perez", npn="1234567890", agencia=self.agencia
        )
        self.aseguradora = Aseguradora.objects.create(nombre="Test Insurer")
        self.plan = Plan.objects.create(
            nombre="Test Plan", aseguradora=self.aseguradora, id_plan_aseguradora="PLAN-001"
        )
        self.estado_poliza = EstadoPoliza.objects.create(nombre="Activo")
        
        self.poliza = Poliza.objects.create(
            id_mercado="MKT-123",
            id_miembro="MEM-123",
            costo_poliza=100.00,
            subsidio=50.00,
            prima_mensual=50.00,
            fecha_efectiva=timezone.now().date(),
            fecha_envio=timezone.now().date(),
            id_interno="INT-123",
            estado=self.estado_poliza,
            agente=self.agente,
            plan=self.plan
        )

    def test_contrato_crud(self):
        """Test CREATE and LIST for Contrato"""
        file_content = b"dummy content"
        test_file = SimpleUploadedFile("contrato.pdf", file_content, content_type="application/pdf")
        
        data = {
            "titulo": "Contrato 2024",
            "agente": self.agente.id,
            "fecha_inicio": "2024-01-01",
            "activo": True,
            "descripcion": "Contrato de prueba",
            "archivo": test_file
        }
        
        # 1. Create
        response = self.client.post('/api/contratos/', data, format='multipart')
        if response.status_code != status.HTTP_201_CREATED:
           print(f"Contrato POST failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contrato.objects.count(), 1)
        self.assertEqual(Contrato.objects.get().titulo, "Contrato 2024")

        # 2. List
        response = self.client.get('/api/contratos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_reporte_comision_crud(self):
        """Test CREATE and LIST for ReporteComision"""
        data = {
            "poliza": self.poliza.id,
            "agente": self.agente.id,
            "monto": "25.00",
            "fecha_pago": "2024-02-01",
            "estado": "PENDIENTE",
            "comentarios": "Comisión de enero"
        }
        
        # 1. Create
        response = self.client.post('/api/reportes_comision/', data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"ReporteComision POST failed: {response.data}")
            
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReporteComision.objects.count(), 1)
        self.assertEqual(float(ReporteComision.objects.get().monto), 25.00)

        # 2. List
        response = self.client.get('/api/reportes_comision/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)