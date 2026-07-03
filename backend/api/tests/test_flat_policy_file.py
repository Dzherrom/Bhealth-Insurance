import io
import os
from decimal import Decimal

import openpyxl
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from api.models import Agencia, Agente, Cliente, EstadoPoliza, Poliza, PolizaCliente, TipoProducto
from api.services.flat_policy_file_service import (
    BASE_COLUMNS_COUNT,
    BASE_HEADERS,
    DEPENDENT_BLOCK_SIZE,
    DEPENDENT_HEADERS,
    MAX_DEPENDENT_BLOCKS,
    FlatPolicyFileService,
)


class FlatPolicyFileServiceTests(APITestCase):
    def setUp(self):
        self.service = FlatPolicyFileService()
        self.tipo, _ = TipoProducto.objects.get_or_create(nombre="Health Insurance (ACA)")
        self.estado, _ = EstadoPoliza.objects.get_or_create(nombre="Activo")

    def test_export_headers_match_example_format(self):
        headers = self.service.build_export_headers(MAX_DEPENDENT_BLOCKS)
        self.assertEqual(len(headers), BASE_COLUMNS_COUNT + MAX_DEPENDENT_BLOCKS * DEPENDENT_BLOCK_SIZE)
        self.assertEqual(headers[:BASE_COLUMNS_COUNT], BASE_HEADERS)
        self.assertEqual(headers[BASE_COLUMNS_COUNT : BASE_COLUMNS_COUNT + DEPENDENT_BLOCK_SIZE], DEPENDENT_HEADERS)

    def test_import_and_export_roundtrip(self):
        agency = Agencia.objects.create(nombre="Test Agency")
        agent = Agente.objects.create(npn="999888777", nombre_completo="Test Agent", agencia=agency)
        cliente = Cliente.objects.create(
            ssn="123456789",
            primer_nombre="Juan",
            apellido_paterno="Perez",
            email="juan@test.com",
            genero="M",
            fecha_nacimiento="1990-01-15",
            ingreso_anual=Decimal("40000"),
            estado_civil="Single",
            pais_nacimiento="MX",
            estado_inmigracion="other",
        )
        poliza = Poliza.objects.create(
            id_mercado="MKT-TEST-001",
            id_miembro="MEM-TEST-001",
            costo_poliza=Decimal("500"),
            subsidio=Decimal("400"),
            prima_mensual=Decimal("100"),
            fecha_efectiva="2026-01-01",
            fecha_envio="2026-01-01",
            id_interno="INT-TEST-001",
            agente=agent,
            estado=self.estado,
            tipo_producto=self.tipo,
            nombre_plan="Plan Test",
        )
        PolizaCliente.objects.create(
            poliza=poliza,
            cliente=cliente,
            es_solicitante_principal=True,
            es_aplicante=True,
            relacion="Self",
        )

        response = self.service.export_policies_to_xlsx_response(Poliza.objects.filter(id=poliza.id))
        workbook = openpyxl.load_workbook(io.BytesIO(response.content), read_only=True)
        sheet = workbook.active
        exported_headers = [cell.value for cell in next(sheet.iter_rows(max_row=1))]
        self.assertEqual(exported_headers[:BASE_COLUMNS_COUNT], BASE_HEADERS)

        data_row = [cell.value for cell in next(sheet.iter_rows(min_row=2, max_row=2))]
        self.assertEqual(data_row[35], "MEM-TEST-001")
        self.assertEqual(data_row[34], "MKT-TEST-001")
        self.assertEqual(data_row[5], "Juan")
        workbook.close()

    def test_import_from_example_workbook_structure(self):
        example_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "..",
            "ejemplo polizas.xlsx",
        )
        example_path = os.path.normpath(example_path)
        if not os.path.exists(example_path):
            self.skipTest("Archivo ejemplo polizas.xlsx no encontrado en la raíz del proyecto.")

        import openpyxl

        workbook = openpyxl.load_workbook(example_path, read_only=True)
        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))
        workbook.close()

        sample = openpyxl.Workbook()
        sample_sheet = sample.active
        for row in rows[:11]:
            sample_sheet.append(list(row))
        buffer = io.BytesIO()
        sample.save(buffer)
        buffer.seek(0)
        buffer.name = "ejemplo_sample.xlsx"

        summary = self.service.import_file(buffer)

        self.assertGreater(summary.processed_rows, 0)
        self.assertGreater(summary.created_policies + summary.updated_policies, 0)
        self.assertTrue(Poliza.objects.exists())


class FlatPolicyFileAPITests(APITestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.manager = User.objects.filter(is_superuser=True).first()
        if not self.manager:
            self.manager = User.objects.create_superuser("manager_flat", "manager@test.com", "testpass123")
        self.client_api.force_authenticate(user=self.manager)
        self.tipo, _ = TipoProducto.objects.get_or_create(nombre="Health Insurance (ACA)")
        self.estado, _ = EstadoPoliza.objects.get_or_create(nombre="Activo")

    def test_flat_export_view_direct(self):
        from rest_framework.test import APIRequestFactory, force_authenticate
        from api.views_flat_files import FlatPolicyExportView

        Poliza.objects.create(
            id_mercado="MKT-DIRECT-EXP",
            id_miembro="MEM-DIRECT-EXP",
            costo_poliza=Decimal("100"),
            subsidio=Decimal("80"),
            prima_mensual=Decimal("20"),
            fecha_envio="2026-01-01",
            estado=self.estado,
            tipo_producto=self.tipo,
        )
        factory = APIRequestFactory()
        request = factory.get("/api/polizas/flat/export/")
        force_authenticate(request, user=self.manager)
        response = FlatPolicyExportView.as_view()(request)
        if response.status_code != status.HTTP_200_OK:
            detail = getattr(response, "data", None)
            self.fail(f"Expected 200, got {response.status_code}: {detail}")

    def _build_minimal_workbook(self) -> io.BytesIO:
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        service = FlatPolicyFileService()
        sheet.append(service.build_export_headers(1))
        row = [""] * BASE_COLUMNS_COUNT
        row[0] = "API Agent"
        row[1] = "API123456"
        row[2] = "API Agency"
        row[3] = "TRUE"
        row[5] = "Maria"
        row[7] = "Lopez"
        row[12] = "maria.api@test.com"
        row[15] = "987654321"
        row[31] = "Test Carrier"
        row[32] = "Test Plan"
        row[33] = "PLAN-API-001"
        row[34] = "MKT-API-001"
        row[35] = "MEM-API-001"
        row[37] = 500
        row[38] = 450
        row[39] = 50
        row[40] = "2026-02-01"
        row[41] = "Activo"
        row[50] = "INT-API-001"
        sheet.append(row + [""] * DEPENDENT_BLOCK_SIZE)
        buffer = io.BytesIO()
        workbook.save(buffer)
        buffer.seek(0)
        buffer.name = "test_import.xlsx"
        return buffer

    def test_export_endpoint_returns_xlsx(self):
        Poliza.objects.create(
            id_mercado="MKT-API-EXP",
            id_miembro="MEM-API-EXP",
            costo_poliza=Decimal("100"),
            subsidio=Decimal("80"),
            prima_mensual=Decimal("20"),
            fecha_envio="2026-01-01",
            estado=self.estado,
            tipo_producto=self.tipo,
        )
        response = self.client_api.get("/api/polizas/flat/export/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, getattr(response, "data", response.content[:500]))
        self.assertIn(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            response["Content-Type"],
        )

    def test_import_endpoint_accepts_xlsx(self):
        upload = self._build_minimal_workbook()
        response = self.client_api.post(
            "/api/polizas/flat/import/",
            {"archivo": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(Poliza.objects.filter(id_mercado="MKT-API-001").exists())
