from rest_framework import viewsets, permissions
from .models import TipoProducto
from .serializers import TipoProductoSerializer

class TipoProductoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoProducto.objects.all()
    serializer_class = TipoProductoSerializer
    permission_classes = [permissions.IsAuthenticated]
