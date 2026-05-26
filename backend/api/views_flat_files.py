from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Poliza
from .serializers import FlatFileUploadSerializer
from .services.flat_policy_file_service import FlatPolicyFileService


class FlatPolicyImportView(APIView):
    """
    Importa pólizas denormalizadas desde CSV/Excel.

    Estructura esperada:
    - Primeras 51 columnas para agente/titular/póliza.
    - Luego bloques repetidos de 16 columnas por dependiente.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        upload_serializer = FlatFileUploadSerializer(data=request.FILES)
        upload_serializer.is_valid(raise_exception=True)
        file_obj = upload_serializer.validated_data.get("archivo") or upload_serializer.validated_data.get("file")

        service = FlatPolicyFileService()
        try:
            summary = service.import_file(file_obj)
        except Exception as exc:  # noqa: BLE001 - report import errors in API response
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
    Exporta pólizas al formato plano denormalizado de CSV.

    Query params opcionales:
    - ids=1,2,3 para exportar solo pólizas específicas.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        queryset = Poliza.objects.select_related(
            "agente__agencia",
            "plan__aseguradora",
            "estado",
            "direccion_fisica",
            "direccion_postal",
            "direccion_facturacion",
        ).prefetch_related(
            "polizacliente_set__cliente",
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

        service = FlatPolicyFileService()
        return service.export_policies_to_csv_response(queryset)
