from django.contrib.auth.models import User
from django.db.models import Prefetch
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Poliza, PolizaCliente
from .permissions import IsManagerRole
from .serializers import FlatFileUploadSerializer, FlatPolicyBatchImportSerializer, PolizaListSerializer
from .services.flat_policy_export_filters import apply_flat_export_filters
from .services.flat_policy_file_service import FlatPolicyFileService


class FlatPolicyPreviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


def _flat_policy_base_queryset():
    return Poliza.objects.select_related(
        "agente",
        "agente_registro",
        "plan",
        "estado",
        "plan__aseguradora",
        "aseguradora",
        "info_pago",
        "tipo_producto",
    ).prefetch_related(
        Prefetch(
            "polizacliente_set",
            queryset=PolizaCliente.objects.select_related("cliente").filter(
                es_solicitante_principal=True
            ),
        ),
        Prefetch(
            "colaboradores",
            queryset=User.objects.select_related("profile__agente"),
        ),
    )

class FlatPolicyImportView(APIView):
    """
    Importa pólizas desde CSV/Excel con el formato plano (ejemplo polizas.xlsx).

    - 51 columnas base (agente, titular, póliza, direcciones).
    - Bloques repetidos de 16 columnas por dependiente.
    """

    permission_classes = [permissions.IsAuthenticated, IsManagerRole]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        upload_serializer = FlatFileUploadSerializer(data=request.FILES)
        upload_serializer.is_valid(raise_exception=True)
        file_obj = upload_serializer.validated_data.get("archivo") or upload_serializer.validated_data.get("file")

        service = FlatPolicyFileService()
        try:
            summary = service.import_file(file_obj)
        except Exception as exc:  # noqa: BLE001
            return Response(
                {"detail": f"Error al procesar archivo: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Importación completada",
                "summary": summary.to_dict(),
            },
            status=status.HTTP_200_OK,
        )


class FlatPolicyBatchImportView(APIView):
    """Importa un lote de filas ya parseadas (para progreso en el frontend)."""

    permission_classes = [permissions.IsAuthenticated, IsManagerRole]

    def post(self, request, *args, **kwargs):
        serializer = FlatPolicyBatchImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = FlatPolicyFileService()
        try:
            summary = service.import_rows(
                headers=serializer.validated_data["headers"],
                rows=serializer.validated_data["rows"],
                start_row_index=serializer.validated_data.get("start_row_index", 2),
            )
        except Exception as exc:  # noqa: BLE001
            return Response(
                {"detail": f"Error al procesar lote: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Lote importado",
                "summary": summary.to_dict(),
            },
            status=status.HTTP_200_OK,
        )


class FlatPolicyPreviewView(APIView):
    """
    Lista paginada de pólizas con los mismos filtros que la exportación plana.
    """

    permission_classes = [permissions.IsAuthenticated, IsManagerRole]
    pagination_class = FlatPolicyPreviewPagination

    def get(self, request, *args, **kwargs):
        queryset = apply_flat_export_filters(_flat_policy_base_queryset(), request.query_params)
        queryset = queryset.order_by("-ultima_actualizacion", "-id")

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PolizaListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class FlatPolicyExportView(APIView):
    """
    Exporta pólizas al formato plano compatible con ejemplo polizas.xlsx.

    Query params opcionales:
    - ids=1,2,3 para exportar solo pólizas específicas.
    - export_format=xlsx (default) | csv
    - Filtros: etiqueta, estado, zip_code, aseguradora, tipo_producto,
      fecha_efectiva_desde/hasta, fecha_creacion_desde/hasta,
      aplicantes_desde/hasta, agente
    """

    permission_classes = [permissions.IsAuthenticated, IsManagerRole]

    def get(self, request, *args, **kwargs):
        queryset = Poliza.objects.select_related(
            "agente__agencia",
            "plan__aseguradora",
            "aseguradora",
            "estado",
            "direccion_fisica",
            "direccion_postal",
            "direccion_facturacion",
            "tipo_producto",
        ).prefetch_related(
            "polizacliente_set__cliente",
            "colaboradores",
        )

        ids_param = request.query_params.get("ids", "").strip()
        if ids_param:
            try:
                ids = [int(value) for value in ids_param.split(",") if value.strip()]
            except ValueError:
                return Response(
                    {"detail": "El parámetro ids debe ser una lista de enteros separados por coma."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(id__in=ids)
        else:
            queryset = apply_flat_export_filters(queryset, request.query_params)

        export_format = (
            request.query_params.get("export_format")
            or request.query_params.get("file_type")
            or "xlsx"
        ).lower()
        service = FlatPolicyFileService()

        if export_format == "csv":
            return service.export_policies_to_csv_response(queryset)
        return service.export_policies_to_xlsx_response(queryset)