from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import (
    Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, 
    EstadoPoliza, Poliza, Nota, HistorialPoliza, Etiqueta, Documento
)
from .serializers import (
    UserSerializer, UserProfileSerializer, AgenciaSerializer,
    DireccionSerializer, AgenteSerializer, ClienteSerializer,
    AseguradoraSerializer, PlanSerializer, EstadoPolizaSerializer,
    PolizaSerializer, NotaSerializer, HistorialPolizaSerializer,
    EtiquetaSerializer, DocumentoSerializer
)
from .permissions import IsAgentL3Role, IsPolicyOwnerOrHigher

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class AgenciaViewSet(viewsets.ModelViewSet):
    queryset = Agencia.objects.all()
    serializer_class = AgenciaSerializer
    permission_classes = [permissions.IsAuthenticated]

class DireccionViewSet(viewsets.ModelViewSet):
    queryset = Direccion.objects.all()
    serializer_class = DireccionSerializer
    permission_classes = [permissions.IsAuthenticated]

class AgenteViewSet(viewsets.ModelViewSet):
    queryset = Agente.objects.all()
    serializer_class = AgenteSerializer
    permission_classes = [permissions.IsAuthenticated]

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

class AseguradoraViewSet(viewsets.ModelViewSet):
    queryset = Aseguradora.objects.all()
    serializer_class = AseguradoraSerializer
    permission_classes = [permissions.IsAuthenticated]

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated]

class EstadoPolizaViewSet(viewsets.ModelViewSet):
    queryset = EstadoPoliza.objects.all()
    serializer_class = EstadoPolizaSerializer
    permission_classes = [permissions.IsAuthenticated]

class PolizaViewSet(viewsets.ModelViewSet):
    serializer_class = PolizaSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentL3Role, IsPolicyOwnerOrHigher]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'profile'):
            return Poliza.objects.none()
        
        role = user.profile.role
        if role in ['ADMIN', 'MANAGER', 'AGENT_L1', 'AGENT_L2']:
            return Poliza.objects.all()
        elif role == 'AGENT_L3':
            if user.profile.agente:
                return Poliza.objects.filter(agente=user.profile.agente)
            return Poliza.objects.none()
        return Poliza.objects.none()

    def perform_create(self, serializer):
        # Auto-assign agent if the creator is an Agent L3
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role == 'AGENT_L3' and user.profile.agente:
            poliza = serializer.save(agente=user.profile.agente)
        else:
            poliza = serializer.save()
            
        HistorialPoliza.objects.create(
            poliza=poliza,
            usuario=self.request.user,
            accion='CREACION',
            detalles=f"Póliza creada con ID Mercado: {poliza.id_mercado}"
        )

    def perform_update(self, serializer):
        poliza = serializer.save()
        HistorialPoliza.objects.create(
            poliza=poliza,
            usuario=self.request.user,
            accion='EDICION',
            detalles=f"Póliza actualizada"
        )

class NotaViewSet(viewsets.ModelViewSet):
    queryset = Nota.objects.all()
    serializer_class = NotaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza']

    def perform_create(self, serializer):
        nota = serializer.save(autor=self.request.user)
        HistorialPoliza.objects.create(
            poliza=nota.poliza,
            usuario=self.request.user,
            accion='NOTA_AGREGADA',
            detalles=f"Nota agregada: {nota.contenido[:50]}..."
        )

    def perform_destroy(self, instance):
        poliza = instance.poliza
        HistorialPoliza.objects.create(
            poliza=poliza,
            usuario=self.request.user,
            accion='NOTA_ELIMINADA',
            detalles=f"Nota eliminada"
        )
        instance.delete()

class HistorialPolizaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialPoliza.objects.all()
    serializer_class = HistorialPolizaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza']

class EtiquetaViewSet(viewsets.ModelViewSet):
    queryset = Etiqueta.objects.all()
    serializer_class = EtiquetaSerializer
    permission_classes = [permissions.IsAuthenticated]

class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza']

    def perform_create(self, serializer):
        documento = serializer.save(subido_por=self.request.user)
        HistorialPoliza.objects.create(
            poliza=documento.poliza,
            usuario=self.request.user,
            accion='DOCUMENTO_SUBIDO',
            detalles=f"Documento subido: {documento.titulo}"
        )

    def perform_destroy(self, instance):
        poliza = instance.poliza
        HistorialPoliza.objects.create(
            poliza=poliza,
            usuario=self.request.user,
            accion='DOCUMENTO_ELIMINADO',
            detalles=f"Documento eliminado: {instance.titulo}"
        )
        instance.delete()


 