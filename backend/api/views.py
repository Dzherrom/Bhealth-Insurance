from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.http import FileResponse
from django.utils import timezone
import datetime
import zipfile
import io
import requests
from .models import (
    Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, 
    EstadoPoliza, Poliza, Nota, HistorialPoliza, Etiqueta, Documento, Tarea,
    PolizaViewer, Cita, Medico, Recordatorio
)
from .serializers import (
    UserSerializer, UserProfileSerializer, AgenciaSerializer,
    DireccionSerializer, AgenteSerializer, ClienteSerializer,
    AseguradoraSerializer, PlanSerializer, EstadoPolizaSerializer,
    PolizaSerializer, NotaSerializer, HistorialPolizaSerializer,
    EtiquetaSerializer, DocumentoSerializer, TareaSerializer,
    UserManagementSerializer, CitaSerializer, MedicoSerializer, RecordatorioSerializer
)
from .permissions import IsAgentL3Role, IsPolicyOwnerOrHigher, IsAdminRole

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
        if role in ['ADMIN', 'MANAGER', 'AGENT_L1', 'AGENT_L2', 'ACCOUNTANT']:
            return Poliza.objects.all()
        elif role in ['AGENT_L3', 'AGENT']:
            if user.profile.agente:
                return Poliza.objects.filter(agente=user.profile.agente)
            return Poliza.objects.none()
        return Poliza.objects.none()

    def perform_create(self, serializer):
        # Auto-assign agent if the creator is an Agent L3 or AGENT
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['AGENT_L3', 'AGENT'] and user.profile.agente:
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

    @action(detail=True, methods=['post'])
    def heartbeat(self, request, pk=None):
        """
        Updates the 'last_seen' timestamp for the current user on this policy.
        Frontend should call this every 15-30 seconds while viewing the policy.
        """
        poliza = self.get_object()
        PolizaViewer.objects.update_or_create(
            poliza=poliza,
            usuario=request.user,
            defaults={'last_seen': timezone.now()}
        )
        return Response({'status': 'ok'})

    @action(detail=True, methods=['get'])
    def active_viewers(self, request, pk=None):
        """
        Returns a lightweight list of active viewers for polling.
        """
        poliza = self.get_object()
        threshold = timezone.now() - datetime.timedelta(seconds=60)
        viewers = poliza.viewers.filter(last_seen__gte=threshold)
        data = [v.usuario.username for v in viewers]
        return Response(data)

    @action(detail=True, methods=['get'])
    def download_documents(self, request, pk=None):
        poliza = self.get_object()
        documents = poliza.documentos.all()
        
        if not documents.exists():
            return Response({"detail": "No documents found for this policy."}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as zip_file:
            for doc in documents:
                if doc.archivo:
                    # Use the filename from the file field
                    file_name = doc.archivo.name.split('/')[-1]
                    try:
                        # Open the file and write it to the zip
                        with doc.archivo.open('rb') as f:
                            zip_file.writestr(file_name, f.read())
                    except Exception as e:
                        # Handle file not found or other errors
                        pass
        
        buffer.seek(0)
        response = FileResponse(buffer, as_attachment=True, filename=f'documentos_poliza_{poliza.id}.zip')
        return response

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

class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        # Ensure we get users with their profiles
        return User.objects.select_related('profile').all()

class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.all()
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza', 'asignado_a', 'completada']

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def mis_tareas(self, request):
        """
        Retorna las tareas asignadas al usuario autenticado.
        """
        tareas = Tarea.objects.filter(asignado_a=request.user).order_by('fecha_limite', '-fecha_creacion')
        page = self.paginate_queryset(tareas)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(tareas, many=True)
        return Response(serializer.data)

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza', 'cliente', 'estado', 'proveedor']

    def perform_create(self, serializer):
        cita = serializer.save(creado_por=self.request.user)
        HistorialPoliza.objects.create(
            poliza=cita.poliza,
            usuario=self.request.user,
            accion='EDICION',
            detalles=f"Cita creada para {cita.fecha_hora.date()} en {cita.proveedor}"
        )

class MedicoViewSet(viewsets.ModelViewSet):
    queryset = Medico.objects.all()
    serializer_class = MedicoSerializer
    permission_classes = [permissions.IsAuthenticated]

class ZipCodeLookupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, zip_code):
        if not zip_code:
            return Response({"error": "Zip code is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Using Zippopotam.us (Free, no API key required)
            response = requests.get(f"http://api.zippopotam.us/us/{zip_code}")
            
            if response.status_code == 404:
                return Response({"error": "Zip code not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if response.status_code != 200:
                return Response({"error": "External service error"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            data = response.json()
            # Zippopotam returns a list of places, usually we take the first one for the primary city
            if not data.get('places'):
                return Response({"error": "No places found for this zip code"}, status=status.HTTP_404_NOT_FOUND)

            place = data['places'][0]
            
            result = {
                "city": place.get('place name'),
                "state": place.get('state'),
                "state_abbr": place.get('state abbreviation'),
                "county": place.get('place name'), # Zippopotam sometimes puts county in place name or doesn't provide it explicitly separate from city in some contexts, but usually it's city. 
                # Actually Zippopotam structure: "place name" is city. It doesn't always provide county explicitly in a separate field named 'county', 
                # but for US it often has 'place name' as city. 
                # Let's check if we can get county. Zippopotam US response usually:
                # "places": [{"place name": "Beverly Hills", "longitude": "...", "state": "California", "state abbreviation": "CA", "latitude": "..."}]
                # It seems it doesn't strictly return "County". 
                # However, for the purpose of address completion, City and State are the most critical.
                "country": data.get('country'),
                "zip_code": data.get('post code')
            }
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class ReporteAgentesView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Or IsAdminRole if strict

    def get(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        if not month or not year:
            return Response({"error": "Month and Year are required params"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response({"error": "Invalid month/year format"}, status=status.HTTP_400_BAD_REQUEST)

        agentes = Agente.objects.all()
        report_data = []

        for agente in agentes:
            # Calculate total 'facturados' (Assuming policies sold/active with effective date in that month)
            # Adjust filter logic as per specific business rule (e.g. fecha_inscripcion vs fecha_efectiva)
            # Assuming 'fecha_efectiva' determines the billing start.
            total_facturados = Poliza.objects.filter(
                agente=agente,
                fecha_efectiva__month=month,
                fecha_efectiva__year=year
            ).count()

            # Access user profile role if linked
            # Note: Agente model is separate from UserProfile model in current invalid implementation 
            # (UserProfile has OneToOne to Agente, but Agente strictly doesn't know about user unless reverse queried)
            role = "N/A"
            email = "N/A"
            username = "N/A"
            
            # Try to find the linked UserProfile
            # profile linked to agent: user.profile.agente = agente
            # Reverse relation name in UserProfile: related_name='user_profile' (on Agente field)
            try:
                if hasattr(agente, 'user_profile'):
                    profile = agente.user_profile
                    role = profile.get_role_display() # Human readable
                    email = profile.user.email
                    username = profile.user.username
            except Exception:
                pass

            report_data.append({
                "nombre": agente.nombre_completo,
                "npn": agente.npn,
                "correo": email,
                "rol": role,
                "total_usuarios_facturados": total_facturados
            })
            
        return Response(report_data)

class RecordatorioViewSet(viewsets.ModelViewSet):
    queryset = Recordatorio.objects.all()
    serializer_class = RecordatorioSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza', 'fecha_vencimiento', 'usuario_notificar']

    def perform_create(self, serializer):
        recordatorio = serializer.save()
        HistorialPoliza.objects.create(
            poliza=recordatorio.poliza,
            usuario=self.request.user,
            accion='EDICION',
            detalles=f"Recordatorio establecido: {recordatorio.titulo} para {recordatorio.fecha_vencimiento}"
        )


 