from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Poliza
from .permissions import IsManagerRole
from .serializers import FlatFileUploadSerializer
from .services.flat_policy_file_service import FlatPolicyFileService


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


class FlatPolicyExportView(APIView):
    """
    Exporta pólizas al formato plano compatible con ejemplo polizas.xlsx.

    Query params opcionales:
    - ids=1,2,3 para exportar solo pólizas específicas.
    - export_format=xlsx (default) | csv
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

        export_format = (
            request.query_params.get("export_format")
            or request.query_params.get("file_type")
            or "xlsx"
        ).lower()
        service = FlatPolicyFileService()

        if export_format == "csv":
            return service.export_policies_to_csv_response(queryset)
        return service.export_policies_to_xlsx_response(queryset)
