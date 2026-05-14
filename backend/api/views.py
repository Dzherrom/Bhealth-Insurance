from rest_framework import generics, permissions, status, viewsets, filters
from .permissions import IsManagerRole, IsAdminRole, IsPolicyOwnerOrHigher, IsCRMNonBasicRole
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.http import FileResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
import datetime
import zipfile
import io
import requests
import csv
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth, TruncYear
from .models import (
    Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, 
    EstadoPoliza, Poliza, Nota, HistorialPoliza, Etiqueta, Documento, Tarea,
    PolizaViewer, Cita, Medico, Recordatorio, IntentoLoginFallido,
    Contrato, ReporteComision, Notificacion, TarjetaCredito,
    PolizaTransferencia, MatrizPermisoRol, AuditoriaGlobal, registrar_auditoria_global
)
from .serializers import *

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCRMNonBasicRole]

    def get(self, request):
        stats = {}
        from django.db.models import Sum, Count, Q
        from django.db.models.functions import TruncMonth
        from datetime import timedelta
        from django.utils import timezone
        
        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')
        period = request.query_params.get('period')

        today = timezone.now().date()
        start_date = None
        end_date = None

        if start_date_param:
            try:
                start_date = datetime.date.fromisoformat(start_date_param)
            except ValueError:
                return Response({"detail": "start_date inválida. Usa YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        if end_date_param:
            try:
                end_date = datetime.date.fromisoformat(end_date_param)
            except ValueError:
                return Response({"detail": "end_date inválida. Usa YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Si no mandan fechas explícitas, derivar ventana por periodo predefinido.
        if not start_date and not end_date:
            period_days = {
                'last_year': 365,
                'last_6_months': 183,
                'last_3_months': 92,
                'last_month': 31,
            }
            selected_days = period_days.get(period or 'last_month', 31)
            end_date = today
            start_date = today - timedelta(days=selected_days)

        polizas_qs = Poliza.objects.all()
        clientes_qs = Cliente.objects.all()
        recordatorios_qs = Recordatorio.objects.all()
        failed_logins_qs = IntentoLoginFallido.objects.all()

        if start_date:
            polizas_qs = polizas_qs.filter(fecha_efectiva__gte=start_date)
            clientes_qs = clientes_qs.filter(fecha_creacion__gte=start_date)
            recordatorios_qs = recordatorios_qs.filter(fecha_vencimiento__gte=start_date)
            failed_logins_qs = failed_logins_qs.filter(fecha_intento__date__gte=start_date)
        if end_date:
            polizas_qs = polizas_qs.filter(fecha_efectiva__lte=end_date)
            clientes_qs = clientes_qs.filter(fecha_creacion__lte=end_date)
            recordatorios_qs = recordatorios_qs.filter(fecha_vencimiento__lte=end_date)
            failed_logins_qs = failed_logins_qs.filter(fecha_intento__date__lte=end_date)

        now = timezone.now()
        
        # 1. Recordatorios pendientes
        stats['recordatorios_pendientes'] = recordatorios_qs.count()

        # 2. Cumpleaños esta semana 
        next_week = today + timedelta(days=7)

        def _next_birthday(fecha_nacimiento, reference_date):
            try:
                candidate = fecha_nacimiento.replace(year=reference_date.year)
            except ValueError:
                # Ajuste para cumpleaños 29/02 en años no bisiestos.
                candidate = datetime.date(reference_date.year, 2, 28)

            if candidate < reference_date:
                try:
                    candidate = fecha_nacimiento.replace(year=reference_date.year + 1)
                except ValueError:
                    candidate = datetime.date(reference_date.year + 1, 2, 28)
            return candidate

        cumpleanos_qs = clientes_qs
        cumpleanos_count = sum(
            1 for c in cumpleanos_qs 
            if c.fecha_nacimiento and (_next_birthday(c.fecha_nacimiento, today) >= today and _next_birthday(c.fecha_nacimiento, today) <= next_week)
        )
        stats['cumpleanos_semana'] = cumpleanos_count

        # 3. Nuevos prospectos (dentro del periodo)
        stats['nuevos_prospectos'] = clientes_qs.count()

        # 4. Total Polizas y Aplicantes
        real_total_aplicantes = polizas_qs.aggregate(t=Sum('total_aplicantes'))['t'] or 0
        total_polizas_count = polizas_qs.count()
        stats['total_aplicantes'] = real_total_aplicantes
        stats['total_polizas'] = total_polizas_count

        # 5. Pólizas efectivas por mes (columnas: pólizas y aplicantes)
        polizas_efectivas_mensual = polizas_qs.annotate(
            month=TruncMonth('fecha_efectiva')
        ).values('month').annotate(
            total_polizas=Count('id'),
            total_aplicantes=Sum('total_aplicantes')
        ).order_by('month')

        polizas_efectivas_mensual_chart = [
            {
                "date": a['month'],
                "polizas": a['total_polizas'],
                "aplicantes": a['total_aplicantes'] or 0
            } for a in polizas_efectivas_mensual if a['month']
        ]
        stats['polizas_efectivas_mensual_chart'] = polizas_efectivas_mensual_chart

        # Compatibilidad con frontend existente
        activas_mensual = polizas_qs.filter(estado__nombre__icontains='activ').annotate(
            month=TruncMonth('fecha_efectiva')
        ).values('month').annotate(
            total_polizas=Count('id'),
            total_aplicantes=Sum('total_aplicantes')
        ).order_by('month')
        stats['activas_mensual_chart'] = [
            {
                "date": a['month'],
                "polizas": a['total_polizas'],
                "aplicantes": a['total_aplicantes'] or 0
            } for a in activas_mensual if a['month']
        ]

        # 6. Clasificación de agentes
        agentes = Agente.objects.annotate(
            num_polizas=Count('polizas', filter=Q(polizas__in=polizas_qs)),
            num_aplicantes=Sum('polizas__total_aplicantes', filter=Q(polizas__in=polizas_qs))
        ).order_by('-num_polizas')[:10]

        stats['clasificacion_agentes'] = [
            {
                "nombre": ag.nombre_completo,
                "num_polizas": ag.num_polizas,
                "num_aplicantes": ag.num_aplicantes or 0,
                "porcentaje_polizas": round((ag.num_polizas / total_polizas_count) * 100, 2) if total_polizas_count else 0,
            } for ag in agentes
        ]

        # Compatibilidad con frontend existente
        stats['top_agentes'] = [
            {
                "nombre": ag.nombre_completo,
                "num_polizas": ag.num_polizas,
                "num_aplicantes": ag.num_aplicantes or 0
            } for ag in agentes[:5]
        ]

        # 7. Pólizas por tipo de producto (pie) y tendencia mensual por tipo (línea)
        tipo_producto = polizas_qs.values('plan__nombre').annotate(
            count=Count('id')
        ).order_by('-count')

        stats['polizas_tipo_producto'] = [
            {"tipo": t['plan__nombre'] or 'Sin plan', "count": t['count']}
            for t in tipo_producto
        ]

        tipo_producto_mensual_qs = polizas_qs.annotate(
            month=TruncMonth('fecha_efectiva')
        ).values('month', 'plan__nombre').annotate(
            count=Count('id')
        ).order_by('month', 'plan__nombre')

        grouped_by_month = {}
        product_types = set()
        for row in tipo_producto_mensual_qs:
            month = row['month']
            if not month:
                continue
            month_key = month.isoformat()
            product_type = row['plan__nombre'] or 'Sin plan'
            product_types.add(product_type)
            if month_key not in grouped_by_month:
                grouped_by_month[month_key] = {'date': month}
            grouped_by_month[month_key][product_type] = row['count']

        sorted_product_types = sorted(list(product_types))
        trend_rows = []
        for month_key in sorted(grouped_by_month.keys()):
            item = grouped_by_month[month_key]
            for product_type in sorted_product_types:
                if product_type not in item:
                    item[product_type] = 0
            trend_rows.append(item)

        stats['polizas_efectivas_tipo_producto_mensual_chart'] = trend_rows
        stats['tipos_producto_disponibles'] = sorted_product_types

        # 8 & 9. Aseguradoras (top 10 por pólizas y top 10 por aplicantes, con porcentajes)
        aseguradoras_base_qs = polizas_qs.values('plan__aseguradora__nombre').annotate(
            count=Count('id'),
            aplicantes=Sum('total_aplicantes')
        )

        total_aplicantes_for_percentage = real_total_aplicantes or 0

        top_aseguradoras_por_polizas = aseguradoras_base_qs.order_by('-count')[:10]
        top_aseguradoras_por_aplicantes = aseguradoras_base_qs.order_by('-aplicantes')[:10]

        stats['polizas_por_aseguradora_top10'] = [
            {
                "aseguradora": a['plan__aseguradora__nombre'] or 'Sin aseguradora',
                "count": a['count'],
                "porcentaje": round((a['count'] / total_polizas_count) * 100, 2) if total_polizas_count else 0,
            }
            for a in top_aseguradoras_por_polizas
        ]

        stats['aplicantes_por_aseguradora_top10'] = [
            {
                "aseguradora": a['plan__aseguradora__nombre'] or 'Sin aseguradora',
                "aplicantes": a['aplicantes'] or 0,
                "porcentaje": round(((a['aplicantes'] or 0) / total_aplicantes_for_percentage) * 100, 2) if total_aplicantes_for_percentage else 0,
            }
            for a in top_aseguradoras_por_aplicantes
        ]

        # Compatibilidad con frontend existente
        stats['top_aseguradoras'] = [
            {
                "aseguradora": a['plan__aseguradora__nombre'] or 'Sin aseguradora',
                "count": a['count'],
                "aplicantes": a['aplicantes'] or 0
            }
            for a in top_aseguradoras_por_polizas
        ]

        # 10. Pólizas por Estado (datos para mapa EEUU) y estado de póliza (pie)
        estados = polizas_qs.values('direccion_fisica__estado').annotate(count=Count('id')).order_by('-count')
        stats['polizas_por_estado'] = [{"estado": e['direccion_fisica__estado'] or 'N/A', "count": e['count']} for e in estados]

        polizas_por_estado_poliza = polizas_qs.values('estado__nombre').annotate(count=Count('id')).order_by('-count')
        stats['polizas_por_estado_poliza_chart'] = [
            {"estado": e['estado__nombre'] or 'Sin estado', "count": e['count']}
            for e in polizas_por_estado_poliza
        ]

        etiquetas = polizas_qs.filter(documentos__etiquetas__isnull=False).values('documentos__etiquetas__nombre').annotate(count=Count('id', distinct=True)).order_by('-count')[:10]
        stats['polizas_por_etiqueta_chart'] = [{"etiqueta": e['documentos__etiquetas__nombre'] or 'No asignado', "count": e['count']} for e in etiquetas]

        # Inicios sesión fallidos (dentro del periodo)
        stats['failed_logins_count'] = failed_logins_qs.count()
        
        # General stats
        total_all = polizas_qs.count()
        def calc_perc(part, whole):
            if whole == 0: return "0%"
            return f"{round((part / whole) * 100, 1)}%"
            
        cancelados_count = polizas_qs.filter(estado__nombre__icontains='cancelado').count()
        robados_count = polizas_qs.filter(estado__nombre__icontains='robado').count()
        por_efectuar_count = polizas_qs.filter(Q(estado__nombre__icontains='pending') | Q(estado__nombre__icontains='espera')).count()
        en_peligro_count = polizas_qs.filter(Q(estado__nombre__icontains='bill') | Q(estado__nombre__icontains='payment')).count()
        activos_count = total_all - (cancelados_count + robados_count + por_efectuar_count + en_peligro_count)
        if activos_count < 0: activos_count = 0
            
        stats['general_stats'] = {
            "resumen": {
                "total_polizas": {"count": total_all, "percentage": "100%"},
            },
            "estatus_de_las_polizas": {
                "activos": {"count": activos_count, "percentage": calc_perc(activos_count, total_all)},
                "por_efectuar": {"count": por_efectuar_count, "percentage": calc_perc(por_efectuar_count, total_all)},
                "en_peligro": {"count": en_peligro_count, "percentage": calc_perc(en_peligro_count, total_all)},
                "cancelados": {"count": cancelados_count, "percentage": calc_perc(cancelados_count, total_all)},
                "robados": {"count": robados_count, "percentage": calc_perc(robados_count, total_all)},
            }
        }

        stats['periodo_aplicado'] = {
            "period": period or 'last_month',
            "start_date": start_date,
            "end_date": end_date,
        }

        return Response(stats)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre']
    ordering_fields = ['nombre']

class PolizaViewSet(viewsets.ModelViewSet):
    serializer_class = PolizaSerializer
    permission_classes = [permissions.IsAuthenticated, IsPolicyOwnerOrHigher]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'agente', 'plan', 'id_mercado', 'fecha_efectiva']
    search_fields = ['id_mercado', 'clientes__primer_nombre', 'clientes__apellido_paterno', 'agente__nombre_completo', 'id_miembro']
    ordering_fields = ['fecha_efectiva', 'ultima_actualizacion', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'profile'):
            return Poliza.objects.none()
        
        role = user.profile.role
        if role in ['ADMIN', 'MANAGER', 'PAGOS', 'SHERPA', 'CITAS']:
            return Poliza.objects.all()
        elif role in ['ASISTENTE']:
            if user.profile.agente:
                return Poliza.objects.filter(agente=user.profile.agente)
            return Poliza.objects.none()
        return Poliza.objects.none()

    def perform_create(self, serializer):
        # Auto-assign agent if the creator is an ASISTENTE
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['ASISTENTE'] and user.profile.agente:
            poliza = serializer.save(agente=user.profile.agente)
        else:
            poliza = serializer.save()
        registrar_auditoria_global(
            usuario=user,
            accion='CREACION_POLIZA',
            modelo='Poliza',
            objeto_id=poliza.id,
            detalles=f"Póliza {poliza.id_mercado} creada"
        )
            

    def perform_update(self, serializer):
        poliza = serializer.save()
        registrar_auditoria_global(
            usuario=self.request.user,
            accion='EDICION_POLIZA',
            modelo='Poliza',
            objeto_id=poliza.id,
            detalles=f"Póliza {poliza.id_mercado} actualizada"
        )

    def _require_role(self, request, allowed_roles):
        if not hasattr(request.user, 'profile'):
            return Response({"detail": "Usuario sin perfil."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.profile.role not in allowed_roles:
            return Response({"detail": "No tienes permisos para esta acción."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def _require_matrix_permission(self, request, accion):
        if not hasattr(request.user, 'profile'):
            return Response({"detail": "Usuario sin perfil."}, status=status.HTTP_403_FORBIDDEN)
        role = request.user.profile.role
        if role == 'ADMIN':
            return None
        if not has_matrix_permission(request.user, 'POLIZA_FLUJO', accion):
            return Response({"detail": "Permiso denegado por matriz de permisos."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def _registrar_transferencia(self, poliza, de_rol, a_rol, accion, nota="", a_usuario=None):
        transferencia = PolizaTransferencia.objects.create(
            poliza=poliza,
            de_usuario=self.request.user,
            a_usuario=a_usuario,
            de_rol=de_rol,
            a_rol=a_rol,
            accion=accion,
            nota=nota,
        )
        HistorialPoliza.objects.create(
            poliza=poliza,
            usuario=self.request.user,
            accion='TRANSFERENCIA',
            detalles=f"{accion}: {de_rol} -> {a_rol}. Nota: {nota or 'Sin nota'}"
        )
        registrar_auditoria_global(
            usuario=self.request.user,
            accion='TRANSFERENCIA_POLIZA',
            modelo='PolizaTransferencia',
            objeto_id=transferencia.id,
            detalles=f"Póliza {poliza.id_mercado}: {de_rol} -> {a_rol}. Acción: {accion}"
        )
        return transferencia

    @action(detail=True, methods=['post'])
    def pase_a_manager(self, request, pk=None):
        permiso_error = self._require_role(request, ['ASISTENTE', 'ADMIN', 'MANAGER'])
        if permiso_error:
            return permiso_error
        matrix_error = self._require_matrix_permission(request, 'PASE_A_MANAGER')
        if matrix_error:
            return matrix_error

        poliza = self.get_object()
        if poliza.flujo_etapa not in ['CAPTURA_ASISTENTE', 'DEVUELTA_ASISTENTE']:
            return Response({"detail": "La póliza no está en etapa válida para pase a manager."}, status=status.HTTP_400_BAD_REQUEST)

        nota = request.data.get('nota', '')
        poliza.flujo_etapa = 'REVISION_MANAGER'
        poliza.save(update_fields=['flujo_etapa', 'ultima_actualizacion'])

        transferencia = self._registrar_transferencia(
            poliza=poliza,
            de_rol='ASISTENTE',
            a_rol='MANAGER',
            accion='ENTREGA_ASISTENTE_MANAGER',
            nota=nota,
        )
        return Response(PolizaTransferenciaSerializer(transferencia).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def pase_a_sherpa(self, request, pk=None):
        permiso_error = self._require_role(request, ['MANAGER', 'ADMIN'])
        if permiso_error:
            return permiso_error
        matrix_error = self._require_matrix_permission(request, 'PASE_A_SHERPA')
        if matrix_error:
            return matrix_error

        poliza = self.get_object()
        if poliza.flujo_etapa != 'REVISION_MANAGER':
            return Response({"detail": "La póliza no está en revisión de manager."}, status=status.HTTP_400_BAD_REQUEST)

        nota = request.data.get('nota', '')
        poliza.flujo_etapa = 'EN_PROCESO_SHERPA'
        poliza.save(update_fields=['flujo_etapa', 'ultima_actualizacion'])

        transferencia = self._registrar_transferencia(
            poliza=poliza,
            de_rol='MANAGER',
            a_rol='SHERPA',
            accion='APROBACION_MANAGER_SHERPA',
            nota=nota,
        )
        return Response(PolizaTransferenciaSerializer(transferencia).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def devolver_a_asistente(self, request, pk=None):
        permiso_error = self._require_role(request, ['SHERPA', 'ADMIN', 'MANAGER'])
        if permiso_error:
            return permiso_error
        matrix_error = self._require_matrix_permission(request, 'DEVOLVER_A_ASISTENTE')
        if matrix_error:
            return matrix_error

        poliza = self.get_object()
        if poliza.flujo_etapa != 'EN_PROCESO_SHERPA':
            return Response({"detail": "Solo se puede devolver una póliza en proceso de sherpa."}, status=status.HTTP_400_BAD_REQUEST)

        nota = request.data.get('nota', '')
        if not nota:
            return Response({"detail": "La nota es obligatoria para devolución."}, status=status.HTTP_400_BAD_REQUEST)

        poliza.flujo_etapa = 'DEVUELTA_ASISTENTE'
        poliza.save(update_fields=['flujo_etapa', 'ultima_actualizacion'])

        transferencia = self._registrar_transferencia(
            poliza=poliza,
            de_rol='SHERPA',
            a_rol='ASISTENTE',
            accion='DEVOLUCION_SHERPA_ASISTENTE',
            nota=nota,
        )
        return Response(PolizaTransferenciaSerializer(transferencia).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cerrar_en_sherpa(self, request, pk=None):
        permiso_error = self._require_role(request, ['SHERPA', 'ADMIN'])
        if permiso_error:
            return permiso_error
        matrix_error = self._require_matrix_permission(request, 'CERRAR_EN_SHERPA')
        if matrix_error:
            return matrix_error

        poliza = self.get_object()
        if poliza.flujo_etapa != 'EN_PROCESO_SHERPA':
            return Response({"detail": "Solo se puede cerrar una póliza en proceso de sherpa."}, status=status.HTTP_400_BAD_REQUEST)

        nota = request.data.get('nota', '')
        poliza.flujo_etapa = 'COMPLETADA_SHERPA'
        poliza.save(update_fields=['flujo_etapa', 'ultima_actualizacion'])

        transferencia = self._registrar_transferencia(
            poliza=poliza,
            de_rol='SHERPA',
            a_rol='SHERPA',
            accion='CIERRE_SHERPA',
            nota=nota,
        )
        return Response(PolizaTransferenciaSerializer(transferencia).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def heartbeat(self, request, pk=None):
        """
        Sends a heartbeat to the configured webhook to indicate user presence.
        Replaces internal DB tracking to save resources.
        """
        poliza = self.get_object()
        user = request.user

        # Webhook payload
        payload = {
            'event': 'heartbeat',
            'policy_id': poliza.id,
            'policy_market_id': poliza.id_mercado,
            'user_id': user.id,
            'username': user.username,
            'timestamp': timezone.now().isoformat()
        }
        
        # Async send
        send_activity_webhook(payload)
        
        current_role = request.user.profile.role if hasattr(request.user, 'profile') else None
        return Response({'status': 'ok', 'mode': 'webhook', 'request_user_role': current_role})

    @action(detail=True, methods=['get'])
    def active_viewers(self, request, pk=None):
        """
        Deprecated: Active viewers are now managed via external webhook system.
        """
        current_role = request.user.profile.role if hasattr(request.user, 'profile') else None
        return Response({"detail": "Active viewers system has been moved to webhooks. Please consult the external activity service.", "request_user_role": current_role}, status=status.HTTP_410_GONE)

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

    @action(detail=False, methods=['get'])
    def search_effective_date(self, request):
        """
        Endpoint personalizado para buscar perfiles por rango de fecha efectiva.
        Uso: /api/polizas/search_effective_date/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = self.get_queryset()

        if start_date:
            queryset = queryset.filter(fecha_efectiva__gte=start_date)
        if end_date:
            queryset = queryset.filter(fecha_efectiva__lte=end_date)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class NotaViewSet(viewsets.ModelViewSet):
    queryset = Nota.objects.all()
    serializer_class = NotaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza']

    def perform_create(self, serializer):
        nota = serializer.save(autor=self.request.user)

    def perform_destroy(self, instance):
        poliza = instance.poliza
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'color']
    ordering_fields = ['nombre']

class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['poliza']

    def perform_create(self, serializer):
        documento = serializer.save(subido_por=self.request.user)

    def perform_destroy(self, instance):
        poliza = instance.poliza
        instance.delete()

class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'profile__status', 'profile__role']
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_queryset(self):
        # Ensure we get users with their profiles
        return User.objects.select_related('profile').all()

    ROLE_RANK = {
        'ADMIN': 100,
        'MANAGER': 90,
        'ASISTENTE': 70,
        'SHERPA': 70,
        'PAGOS': 70,
        'CITAS': 70,
        'USER': 10,
    }

    def _validate_assignable_role(self, request, serializer):
        if request.user.is_superuser:
            return

        requester_profile = getattr(request.user, 'profile', None)
        requester_role = getattr(requester_profile, 'role', None)
        if not requester_role:
            return

        profile_data = serializer.validated_data.get('profile')
        if not profile_data:
            return

        requested_role = profile_data.get('role')
        if not requested_role:
            return

        requester_rank = self.ROLE_RANK.get(requester_role, -1)
        requested_rank = self.ROLE_RANK.get(requested_role, -1)

        if requested_rank > requester_rank:
            raise ValidationError({
                'profile': {
                    'role': 'No puedes asignar un rol superior al tuyo.'
                }
            })

    def perform_update(self, serializer):
        self._validate_assignable_role(self.request, serializer)
        serializer.save()

    @action(detail=True, methods=['get'], url_path='status')
    def check_status(self, request, pk=None):
        """
        Retorna específicamente el estado de actividad de un usuario.
        """
        user = self.get_object()
        return Response({
            "id": user.id,
            "username": user.username,
            "is_active": user.is_active,
            "profile_status": user.profile.status,
            "role": user.profile.role
        })

    @action(detail=True, methods=['post'], url_path='avatar', parser_classes=[MultiPartParser, FormParser])
    def upload_avatar(self, request, pk=None):
        user = self.get_object()
        avatar = request.FILES.get('avatar')

        if not avatar:
            return Response({'error': 'Debes adjuntar un archivo de avatar.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = user.profile
        profile.avatar = avatar
        profile.save(update_fields=['avatar'])

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

class ReporteIntentosFallidosView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Or IsAdminRole

    def get(self, request):
        """
        Returns a list of all failed login attempts, showing email, password (masked/raw), date, and time.
        """
        failed_logins = IntentoLoginFallido.objects.order_by('-fecha_intento')
        data = [
            {
                "correo": fl.usuario_intentado,
                "contrasena_intentada": fl.password_intentado or "N/A",
                "fecha": fl.fecha_intento.date(),
                "hora": fl.fecha_intento.time(),
                "ip": fl.ip_address
            } for fl in failed_logins
        ]
        return Response(data)

class ContratoViewSet(viewsets.ModelViewSet):
    queryset = Contrato.objects.all()
    serializer_class = ContratoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agente', 'activo']
    search_fields = ['titulo', 'agente__nombre_completo']
    ordering_fields = ['fecha_inicio', 'fecha_fin']

    @action(detail=True, methods=['post'], url_path='send-to-zohosign')
    def send_to_zohosign(self, request, pk=None):
        """
        Envia el contrato a Zoho Sign para su firma electronica por parte del Agente.
        """
        contrato = self.get_object()

        if not contrato.archivo:
            return Response({"error": "El contrato no tiene un archivo adjunto."}, status=status.HTTP_400_BAD_REQUEST)

        agente = contrato.agente
        
        # Intentar obtener el email del Agente desde su UserProfile, si no, pedir que se asigne.
        email = None
        if hasattr(agente, 'user_profile') and agente.user_profile and agente.user_profile.user:
            email = agente.user_profile.user.email
        
        if not email:
            # Fallback en caso de que lo mandemos por request
            email = request.data.get('email')
            if not email:
                return Response({"error": "El Agente no tiene un email de usuario asociado. Por favor provee 'email' en el body."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from services.zohosign_client import ZohoSignClient
            zohosign_client = ZohoSignClient()
            
            # Nombre de la peticion
            request_name = f"Firma de Contrato - {contrato.titulo}"
            
            # Llamamos al servicio para subir el documento
            response_data = zohosign_client.create_request_from_file(
                request_name=request_name,
                file_path=contrato.archivo.path,
                recipient_name=agente.nombre_completo,
                recipient_email=email
            )
            
            # Guardamos el 'requests_id' de Zoho en el modelo Contrato.
            zoho_request = response_data.get("requests", {})
            if zoho_request and "request_id" in zoho_request:
                contrato.zoho_request_id = zoho_request.get("request_id")
                contrato.zoho_status = zoho_request.get("request_status", "IN-PROGRESS")
                contrato.save()

            return Response({
                "message": "Contrato enviado a Zoho Sign exitosamente.",
                "zoho_response": response_data
            }, status=status.HTTP_200_OK)
            
        except FileNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error al comunicar con Zoho Sign: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReporteComisionViewSet(viewsets.ModelViewSet):
    queryset = ReporteComision.objects.all()
    serializer_class = ReporteComisionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agente', 'poliza', 'estado']
    search_fields = ['agente__nombre_completo', 'poliza__id_mercado']
    ordering_fields = ['fecha_pago', 'monto']

class NotificacionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificacionSerializer

    def get_queryset(self):
        return Notificacion.objects.filter(usuario=self.request.user)

    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        return Response({'status': 'notificacion marcada como leida'})

    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        self.get_queryset().update(leida=True)
        return Response({'status': 'todas marcadas como leidas'})

class TarjetaCreditoViewSet(viewsets.ModelViewSet):
    queryset = TarjetaCredito.objects.all()
    serializer_class = TarjetaCreditoSerializer
    permission_classes = [permissions.IsAuthenticated]

class LocationLookupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ZipCodeSerializer(data=request.data)
        if serializer.is_valid():
            zip_code = serializer.validated_data['zip_code']
            country_code = serializer.validated_data.get('country_code', 'us')
            
            try:
                data = fetch_location_from_zip(zip_code, country_code)
                if data:
                    return Response(data, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Zip code not found"}, status=status.HTTP_404_NOT_FOUND)
            except requests.RequestException:
                return Response({"error": "External service unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MatrizPermisoRolViewSet(viewsets.ModelViewSet):
    queryset = MatrizPermisoRol.objects.all()
    serializer_class = MatrizPermisoRolSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'modulo', 'accion', 'permitido']
    search_fields = ['role', 'modulo', 'accion', 'descripcion']
    ordering_fields = ['role', 'modulo', 'accion', 'fecha_actualizacion']

    def perform_create(self, serializer):
        permiso = serializer.save(actualizado_por=self.request.user)
        registrar_auditoria_global(
            usuario=self.request.user,
            accion='CREACION_MATRIZ_PERMISO',
            modelo='MatrizPermisoRol',
            objeto_id=permiso.id,
            detalles=f"{permiso.role} {permiso.modulo}.{permiso.accion}={permiso.permitido}"
        )

    def perform_update(self, serializer):
        permiso = serializer.save(actualizado_por=self.request.user)
        registrar_auditoria_global(
            usuario=self.request.user,
            accion='EDICION_MATRIZ_PERMISO',
            modelo='MatrizPermisoRol',
            objeto_id=permiso.id,
            detalles=f"{permiso.role} {permiso.modulo}.{permiso.accion}={permiso.permitido}"
        )

    @action(detail=False, methods=['post'])
    def validar(self, request):
        role = request.data.get('role')
        modulo = request.data.get('modulo')
        accion = request.data.get('accion')

        if not role or not modulo or not accion:
            return Response({"detail": "role, modulo y accion son obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        permitido = MatrizPermisoRol.objects.filter(
            role=role,
            modulo=modulo,
            accion=accion,
            permitido=True,
        ).exists()
        return Response({"role": role, "modulo": modulo, "accion": accion, "permitido": permitido})

class PolizaTransferenciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PolizaTransferencia.objects.select_related('poliza', 'de_usuario', 'a_usuario').all()
    serializer_class = PolizaTransferenciaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['poliza', 'accion', 'de_rol', 'a_rol']
    ordering_fields = ['fecha']

class AuditoriaGlobalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditoriaGlobal.objects.select_related('usuario').all()
    serializer_class = AuditoriaGlobalSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['accion', 'modelo', 'usuario']
    search_fields = ['accion', 'modelo', 'detalles', 'usuario__username']
    ordering_fields = ['fecha']

class AuditoriaConsolidadaView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        limit = int(request.query_params.get('limit', 200))
        if limit > 1000:
            limit = 1000

        auditoria = AuditoriaGlobal.objects.select_related('usuario').all()[:limit]
        historial = HistorialPoliza.objects.select_related('usuario', 'poliza').all()[:limit]
        intentos = IntentoLoginFallido.objects.all()[:limit]

        eventos = []

        for item in auditoria:
            eventos.append({
                'fuente': 'auditoria_global',
                'fecha': item.fecha,
                'accion': item.accion,
                'modelo': item.modelo,
                'usuario': item.usuario.username if item.usuario else None,
                'detalles': item.detalles,
            })

        for item in historial:
            eventos.append({
                'fuente': 'historial_poliza',
                'fecha': item.fecha,
                'accion': item.accion,
                'modelo': 'Poliza',
                'usuario': item.usuario.username if item.usuario else None,
                'detalles': item.detalles,
                'poliza_id_mercado': item.poliza.id_mercado,
            })

        for item in intentos:
            eventos.append({
                'fuente': 'intento_login_fallido',
                'fecha': item.fecha_intento,
                'accion': 'LOGIN_FALLIDO',
                'modelo': 'Auth',
                'usuario': item.usuario_intentado,
                'detalles': f"IP: {item.ip_address or 'N/A'}",
            })

        eventos = sorted(eventos, key=lambda x: x['fecha'], reverse=True)[:limit]
        return Response(eventos)

class ZohoSignWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Webhook para recibir notificaciones desde Zoho Sign.
        Se configura en Zoho Sign para recibir 'requests_completed', etc.
        """
        # Zoho Sign puede enviar la data en body raw (JSON) o en una variable de form multipart.
        # Generalmente, cuando usas webhooks en Zoho Sign, mandan un payload JSON.
        
        try:
            data = request.data
            
            # Zoho Sign a veces anida los datos del webhook bajo una key 'requests' o lo manda directo.
            requests_data = data.get('requests', data)
            
            request_id = requests_data.get('request_id')
            request_status = requests_data.get('request_status')
            
            if not request_id:
                return Response({"message": "No request_id found"}, status=status.HTTP_400_BAD_REQUEST)

            # Buscar el contrato en base de datos
            try:
                contrato = Contrato.objects.get(zoho_request_id=request_id)
            except Contrato.DoesNotExist:
                return Response({"message": f"Contrato con zoho_request_id {request_id} no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            # Actualizar el status en nuestra base local
            if request_status:
                contrato.zoho_status = request_status
            
            # Si fue completado (firmado por todos), lo actualizamos y descargamos el PDF
            if request_status == "COMPLETED" or request_status == "completed":
                from services.zohosign_client import ZohoSignClient
                from django.core.files.base import ContentFile
                
                zohosign_client = ZohoSignClient()
                pdf_bytes = zohosign_client.download_signed_document(request_id)
                
                if pdf_bytes:
                    print(f"Descargando contrato firmado para request {request_id}")
                    # Guardamos el archivo sobrescribiendo o guardando uno nuevo
                    new_file_name = f"firmado_{contrato.archivo.name.split('/')[-1]}"
                    contrato.archivo.save(new_file_name, ContentFile(pdf_bytes), save=False)
            
            contrato.save()
            return Response({"status": "success"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImportarClientesCSVView(APIView):
    """
    Importa masivamente Clientes desde un archivo CSV.
    Previene duplicados en base al parametro 'ssn' o 'email'.
    """
    parser_classes = [MultiPartParser]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('archivo')
        
        if not file_obj:
            return Response({"error": "No se adjunto ningun archivo"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            decoded_file = file_obj.read().decode('utf-8-sig').splitlines()
            reader = csv.DictReader(decoded_file)
        except UnicodeDecodeError:
            return Response({"error": "El archivo debe tener codificacion UTF-8"}, status=status.HTTP_400_BAD_REQUEST)
        
        creados = 0
        actualizados = 0
        errores = []

        with transaction.atomic():
            for index, row in enumerate(reader):
                try:
                    ssn_val = row.get('ssn', '').strip()
                    email_val = row.get('email', '').strip()
                    
                    if not ssn_val and not email_val:
                        errores.append(f"Fila {index+1}: SSN y Email en blanco, no se puede identificar el cliente.")
                        continue
                    
                    # Si tiene SSN lo buscamos por SSN, si no por correo
                    filtro = {'ssn': ssn_val} if ssn_val else {'email': email_val}
                    
                    cliente, creado = Cliente.objects.get_or_create(
                        **filtro,
                        defaults={
                            'primer_nombre': row.get('primer_nombre', '').strip(),
                            'apellido_paterno': row.get('apellido_paterno', '').strip(),
                            'genero': row.get('genero', 'Masculino').strip(),
                            'fecha_nacimiento': row.get('fecha_nacimiento', '1900-01-01').strip() or '1900-01-01',
                            'telefono': row.get('telefono', '').strip(),
                            'email': email_val,
                            'ingreso_anual': row.get('ingreso_anual', 0) or 0,
                            'estado_civil': row.get('estado_civil', '').strip(),
                            'pais_nacimiento': row.get('pais_nacimiento', '').strip(),
                            'estado_inmigracion': row.get('estado_inmigracion', '').strip(),
                        }
                    )
                    
                    if creado:
                        creados += 1
                    else:
                        actualizados += 1
                        
                except Exception as e:
                    errores.append(f"Fila {index+1}: Error inesperado: {str(e)}")

        return Response({
            "mensaje": "Proceso completado",
            "resultados": {
                "nuevos_clientes_creados": creados,
                "clientes_ya_existentes_saltados": actualizados,
                "errores": errores
            }
        }, status=status.HTTP_200_OK)


class ImportarPolizasCSVView(APIView):
    """
    Importa masivamente Polizas en bulk.
    Evita la duplicidad asegurandose validando el id_mercado.
    """
    parser_classes = [MultiPartParser]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('archivo')
        if not file_obj:
            return Response({"error": "No se adjunto archivo"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            decoded_file = file_obj.read().decode('utf-8-sig').splitlines()
            reader = csv.DictReader(decoded_file)
        except UnicodeDecodeError:
            return Response({"error": "El archivo debe tener codificacion UTF-8"}, status=status.HTTP_400_BAD_REQUEST)
        
        creados = 0
        duplicados = 0
        errores = []

        with transaction.atomic():
            for idx, row in enumerate(reader):
                id_mk = row.get('id_mercado', '').strip()
                
                if not id_mk:
                    errores.append(f"Fila {idx+1}: id_mercado faltante.")
                    continue
                
                if Poliza.objects.filter(id_mercado=id_mk).exists():
                    duplicados += 1
                    continue
                
                try:
                    agente_id = request.data.get('agente_id') or 1
                    plan_id = request.data.get('plan_id') or 1
                    
                    Poliza.objects.create(
                        id_mercado=id_mk,
                        id_miembro=row.get('id_miembro', '').strip(),
                        costo_poliza=row.get('costo_poliza', 0) or 0,
                        subsidio=row.get('subsidio', 0) or 0,
                        prima_mensual=row.get('prima_mensual', 0) or 0,
                        fecha_efectiva=row.get('fecha_efectiva', datetime.date.today().strftime('%Y-%m-%d')).strip() or datetime.date.today().strftime('%Y-%m-%d'),
                        fecha_envio=datetime.date.today().strftime('%Y-%m-%d'),
                        id_interno=f"INT-IMPORT-{datetime.datetime.now().timestamp()}-{idx}",
                        agente_id=agente_id,
                        plan_id=plan_id
                    )
                    creados += 1
                except Exception as e:
                    errores.append(f"Fila {idx+1}: {str(e)}")

        return Response({
            "mensaje": "Proceso completado",
            "resultados": {
                "polizas_creadas": creados,
                "fallos_por_duplicidad_omitidos": duplicados,
                "errores": errores
            }
        }, status=status.HTTP_200_OK)


class UserPolicyStatsView(APIView):
    """
    Endpoint para obtener estadisticas detalladas sobre polizas, 
    estados y consentimientos manejados por un empleado.
    """
    permission_classes = [permissions.IsAuthenticated, IsManagerRole]

    def get(self, request, user_id, *args, **kwargs):
        from .models import Poliza
        from django.db.models import Count, Q
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Traer todas las polizas ligadas a este usuario 
        query = Q(colaboradores=target_user)
        if hasattr(target_user, 'profile') and target_user.profile.agente:
            query = query | Q(agente=target_user.profile.agente)
            
        polizas = Poliza.objects.filter(query).distinct()
        
        total = polizas.count()
        def calc_perc(part, whole):
            if whole == 0: return "0%"
            return f"{round((part / whole) * 100, 1)}%"

        # Estatus
        # Definiciones aproximadas sugeridas por los nombres de estado generales. 
        # Modificar si se requiere una logica de texto distinta.
        cancelados_count = polizas.filter(estado__nombre__icontains='cancelado').count()
        robados_count = polizas.filter(estado__nombre__icontains='robado').count()
        por_efectuar_count = polizas.filter(Q(estado__nombre__icontains='pending') | Q(estado__nombre__icontains='espera') | Q(estado__nombre__icontains='waiting')).count()
        en_peligro_count = polizas.filter(Q(estado__nombre__icontains='bill') | Q(estado__nombre__icontains='payment')).count()
        
        # Activos: Todos los que no sean ni cancelados, ni robados, ni por efectuar, ni en peligro (o bien definirlos como los 'completed' / 'renovada' etc.)
        # Asumiremos todos menos los identificados como errores/peligro.
        activos_count = total - (cancelados_count + robados_count + por_efectuar_count + en_peligro_count)
        if activos_count < 0: activos_count = 0

        # Alertas
        docs_pendientes_count = polizas.filter(estado__nombre__icontains='document').count()
        pagos_pendientes_count = en_peligro_count # se suele usar sinonimo
        consentimiento_count = polizas.filter(estado_consentimiento__in=['NO_ENVIADO', 'ENVIADO']).count()
        duplicados_count = polizas.filter(es_duplicado=True).count()
        
        # Resumen
        desincronizados_count = polizas.filter(id_interno__isnull=True).count() # o alguna logica definida

        stats = {
            "resumen": {
                "total_polizas": {"count": total, "percentage": "100%"},
                "desincronizados": {"count": desincronizados_count, "percentage": calc_perc(desincronizados_count, total)},
            },
            "estatus_de_las_polizas": {
                "activos": {"count": activos_count, "percentage": calc_perc(activos_count, total)},
                "por_efectuar": {"count": por_efectuar_count, "percentage": calc_perc(por_efectuar_count, total)},
                "en_peligro": {"count": en_peligro_count, "percentage": calc_perc(en_peligro_count, total)},
                "cancelados": {"count": cancelados_count, "percentage": calc_perc(cancelados_count, total)},
                "robados": {"count": robados_count, "percentage": calc_perc(robados_count, total)},
            },
            "alertas": {
                "docs_pendientes": {"count": docs_pendientes_count, "percentage": calc_perc(docs_pendientes_count, total)},
                "pagos_pendientes": {"count": pagos_pendientes_count, "percentage": calc_perc(pagos_pendientes_count, total)},
                "consentimiento": {"count": consentimiento_count, "percentage": calc_perc(consentimiento_count, total)},
                "duplicados": {"count": duplicados_count, "percentage": calc_perc(duplicados_count, total)},
            }
        }
        
        return Response({
            "usuario": {
                "id": target_user.id,
                "nombre": target_user.get_full_name() or target_user.username,
            },
            "estadisticas": stats
        })

class UserPolicyStatsDetailView(APIView):
    """
    Endpoint para obtener el listado de las pólizas de una subcategoría de estadísticas específica.
    """
    permission_classes = [permissions.IsAuthenticated, IsManagerRole]

    def get(self, request, user_id, category, *args, **kwargs):
        from .models import Poliza
        from django.db.models import Q
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        query = Q(colaboradores=target_user)
        if hasattr(target_user, 'profile') and target_user.profile.agente:
            query = query | Q(agente=target_user.profile.agente)
            
        polizas = Poliza.objects.filter(query).distinct()
        
        category = category.lower()
        
        if category == 'total_polizas':
            pass
        elif category == 'desincronizados':
            polizas = polizas.filter(id_interno__isnull=True)
        elif category == 'activos':
            polizas = polizas.exclude(estado__nombre__icontains='cancelado')\
                             .exclude(estado__nombre__icontains='robado')\
                             .exclude(Q(estado__nombre__icontains='pending') | Q(estado__nombre__icontains='espera') | Q(estado__nombre__icontains='waiting'))\
                             .exclude(Q(estado__nombre__icontains='bill') | Q(estado__nombre__icontains='payment'))
        elif category == 'por_efectuar':
            polizas = polizas.filter(Q(estado__nombre__icontains='pending') | Q(estado__nombre__icontains='espera') | Q(estado__nombre__icontains='waiting'))
        elif category == 'en_peligro':
            polizas = polizas.filter(Q(estado__nombre__icontains='bill') | Q(estado__nombre__icontains='payment'))
        elif category == 'cancelados':
            polizas = polizas.filter(estado__nombre__icontains='cancelado')
        elif category == 'robados':
            polizas = polizas.filter(estado__nombre__icontains='robado')
        elif category == 'docs_pendientes':
            polizas = polizas.filter(estado__nombre__icontains='document')
        elif category == 'pagos_pendientes':
            polizas = polizas.filter(Q(estado__nombre__icontains='bill') | Q(estado__nombre__icontains='payment'))
        elif category == 'consentimiento':
            polizas = polizas.filter(estado_consentimiento__in=['NO_ENVIADO', 'ENVIADO'])
        elif category == 'duplicados':
            polizas = polizas.filter(es_duplicado=True)
        else:
            return Response({"error": "Categoría no válida."}, status=status.HTTP_400_BAD_REQUEST)

        # Preparar data
        data = []
        for p in polizas.select_related('estado', 'plan__aseguradora', 'agente').prefetch_related('clientes'):
            cliente_principal = p.clientes.first()
            cliente_nombre = f"{cliente_principal.primer_nombre} {cliente_principal.apellido_paterno}" if cliente_principal else "Sin Cliente"
            
            estado_nombre = p.estado.nombre if p.estado else "N/A"
            aseguradora_nombre = p.plan.aseguradora.nombre if p.plan and hasattr(p.plan, 'aseguradora') else "N/A"
            
            estado_pago = "Pendiente" if any(palabra in (estado_nombre or "").lower() for palabra in ['bill', 'payment']) else "Al Día"
            
            # Fecha expiración simulada (sumar un año a la fecha efectiva si no hay fecha cancelación)
            fecha_expiracion = p.fecha_cancelacion
            if not fecha_expiracion and p.fecha_efectiva:
                import datetime
                try:
                    fecha_expiracion = p.fecha_efectiva.replace(year=p.fecha_efectiva.year + 1)
                except ValueError: # leap year 29 feb
                    fecha_expiracion = p.fecha_efectiva + datetime.timedelta(days=365)

            data.append({
                "id": p.id,
                "id_mercado": p.id_mercado,
                "cliente": cliente_nombre,
                "estado_y_compania": f"{estado_nombre} - {aseguradora_nombre}",
                "agente": p.agente.nombre_completo if p.agente else "No Asignado",
                "estatus": p.flujo_etapa,
                "documentos": dict(p.ESTADO_CONSENTIMIENTO_CHOICES).get(p.estado_consentimiento, "Desconocido"),
                "pagos": estado_pago,
                "fecha_inicio": p.fecha_efectiva,
                "fecha_expiracion": fecha_expiracion
            })

        return Response({
            "usuario": {
                "id": target_user.id,
                "nombre": target_user.get_full_name() or target_user.username,
            },
            "categoria": category,
            "total_items": len(data),
            "polizas": data
        })

import openpyxl

class ImportarPolizasExcelView(APIView):
    """
    Importa pólizas desde un archivo Excel (xls/xlsx) y las asocia a un empleado.
    Crea un lote (ImportBatch) para permitir deshacer la operación (Undo).
    Solo accesible para ADMIN o MANAGER.
    """
    permission_classes = [permissions.IsAuthenticated, IsManagerRole]
    parser_classes = [MultiPartParser]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        empleado_id = request.data.get('empleado_id')

        if not file_obj or not empleado_id:
            return Response({"error": "Debe proporcionar archivo Excel ('file') y 'empleado_id'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            empleado = User.objects.get(id=empleado_id)
        except User.DoesNotExist:
            return Response({"error": "Empleado no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        try:
            wb = openpyxl.load_workbook(file_obj, data_only=True)
            sheet = wb.active
        except Exception as e:
            return Response({"error": f"Error leyendo el archivo Excel: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        from .models import ImportBatch
        # Crear Lote de importacion 
        batch = ImportBatch.objects.create(
            usuario=empleado,
            nombre_archivo=file_obj.name
        )

        rows = list(sheet.iter_rows(values_only=True))
        if not rows or len(rows) < 2:
            return Response({"error": "El archivo está vacío o no tiene datos."}, status=status.HTTP_400_BAD_REQUEST)

        headers = [str(h).lower().strip() for h in rows[0]]
        
        created_count = 0
        from .models import Poliza, EstadoPoliza, Aseguradora, Plan
        
        for idx, row in enumerate(rows[1:], start=1):
            row_data = dict(zip(headers, row))
            
            # Buscar columna id_mercado (puede venir como ID Mercado, id mercado, etc)
            id_mercado = row_data.get('id_mercado') or row_data.get('id mercado')
            if not id_mercado: 
                continue # Saltar filas sin ID Mercado valido

            # Evitar duplicados por id_mercado
            if Poliza.objects.filter(id_mercado=id_mercado).exists():
                continue
                
            estado_obj, _ = EstadoPoliza.objects.get_or_create(nombre='new')
            aseguradora, _ = Aseguradora.objects.get_or_create(nombre="Aseguradora Automatica")
            plan, _ = Plan.objects.get_or_create(id_plan_aseguradora="000", aseguradora=aseguradora, defaults={"nombre": "Plan Importado"})
            
            poliza = Poliza.objects.create(
                id_mercado=id_mercado,
                id_miembro=row_data.get('id_miembro', 'N/A'),
                costo_poliza=0, subsidio=0, prima_mensual=0,
                fecha_efectiva=timezone.now().date(),
                fecha_envio=timezone.now().date(),
                id_interno=f"IMP-{batch.id.hex[:8]}-{idx}",
                estado=estado_obj,
                plan=plan,
                import_batch=batch, # LIGADO AL BATCH
            )
            created_count += 1
            
            # Asignar la poliza al empleado especificamente
            if hasattr(empleado, 'profile') and empleado.profile.agente:
                poliza.agente = empleado.profile.agente
            else:
                poliza.colaboradores.add(empleado)
                
            poliza.save()

        return Response({
            "mensaje": "Importación completada.",
            "batch_id": batch.id,
            "polizas_creadas": created_count,
            "empleado_id": empleado.id
        }, status=status.HTTP_201_CREATED)


class UndoImportExcelView(APIView):
    """
    Revierte una importación (elimina las pólizas) basada en un batch_id.
    Solo accesible para ADMIN o MANAGER.
    """
    permission_classes = [permissions.IsAuthenticated, IsManagerRole]

    def post(self, request, *args, **kwargs):
        batch_id = request.data.get('batch_id')
        if not batch_id:
            return Response({"error": "Proporcione 'batch_id' para deshacer."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import ImportBatch
            batch = ImportBatch.objects.get(id=batch_id)
        except ImportBatch.DoesNotExist:
            return Response({"error": "Lote no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        count = batch.polizas.count()
        batch.polizas.all().delete()
        batch.delete()

        return Response({
            "mensaje": "Importacion revertida exitosamente.", 
            "polizas_borradas": count
        }, status=status.HTTP_200_OK)






class ConfiguracionNotificacionViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionNotificacion.objects.all()
    serializer_class = ConfiguracionNotificacionSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerRole]
