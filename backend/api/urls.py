from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views_export import ExportPolizasView
from .views import (
    RegisterView, ProfileView, LogoutView,
    AgenciaViewSet, DireccionViewSet, AgenteViewSet,
    ClienteViewSet, AseguradoraViewSet, PlanViewSet,
    EstadoPolizaViewSet, PolizaViewSet, NotaViewSet, HistorialPolizaViewSet,
    EtiquetaViewSet, DocumentoViewSet, TareaViewSet, UserManagementViewSet,
    ZipCodeLookupView, CitaViewSet, MedicoViewSet, RecordatorioViewSet,
    ReporteAgentesView, DashboardStatsView, ReporteIntentosFallidosView,
    ContratoViewSet, ReporteComisionViewSet, NotificacionViewSet,
    LocationLookupView, TarjetaCreditoViewSet, CustomTokenObtainPairView,
    CuentaBancariaViewSet, InfoPagoViewSet,
    MatrizPermisoRolViewSet, AuditoriaGlobalViewSet, AuditoriaConsolidadaView,
    ConfiguracionComisionViewSet,
    PolizaTransferenciaViewSet, ZohoSignWebhookView,
    ImportarClientesCSVView, ImportarPolizasCSVView, UserPolicyStatsView,
    ImportarPolizasExcelView, UndoImportExcelView, UserPolicyStatsDetailView,
    ConfiguracionNotificacionViewSet, CalendarioPrimasPolizaView,
)
from .views_consent import ConsentRequestViewSet

router = DefaultRouter()
router.register(r'users', UserManagementViewSet)
router.register(r'agencias', AgenciaViewSet)
router.register(r'direcciones', DireccionViewSet)
router.register(r'agentes', AgenteViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'aseguradoras', AseguradoraViewSet)
router.register(r'planes', PlanViewSet)
router.register(r'estados-poliza', EstadoPolizaViewSet)
router.register(r'polizas', PolizaViewSet, basename='poliza')
router.register(r'notas', NotaViewSet)
router.register(r'historial', HistorialPolizaViewSet)
router.register(r'etiquetas', EtiquetaViewSet)
router.register(r'documentos', DocumentoViewSet)
router.register(r'tareas', TareaViewSet)
router.register(r'recordatorios', RecordatorioViewSet)
router.register(r'citas', CitaViewSet)
router.register(r'medicos', MedicoViewSet)
router.register(r'contratos', ContratoViewSet)
router.register(r'reportes_comision', ReporteComisionViewSet)
router.register(r'configuracion-comisiones', ConfiguracionComisionViewSet)
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')
router.register(r'tarjetas_credito', TarjetaCreditoViewSet)
router.register(r'cuentas_bancarias', CuentaBancariaViewSet)
router.register(r'info_pago', InfoPagoViewSet)
router.register(r'matriz-permisos', MatrizPermisoRolViewSet, basename='matriz-permisos')
router.register(r'auditoria-global', AuditoriaGlobalViewSet, basename='auditoria-global')
router.register(r'transferencias-poliza', PolizaTransferenciaViewSet, basename='transferencias-poliza')
router.register(r'consent-requests', ConsentRequestViewSet, basename='consent-requests')

urlpatterns = [
    path('polizas/export/', ExportPolizasView.as_view(), name='export_polizas'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('utils/zipcode/<str:zip_code>/', ZipCodeLookupView.as_view(), name='zipcode-lookup'),
    path('locations/lookup/', LocationLookupView.as_view(), name='location-lookup'),
    path('reportes/agentes-facturacion/', ReporteAgentesView.as_view(), name='reporte-agentes'),
    path('reportes/intentos-fallidos/', ReporteIntentosFallidosView.as_view(), name='reporte-intentos-fallidos'),
    path('reportes/auditoria-consolidada/', AuditoriaConsolidadaView.as_view(), name='auditoria-consolidada'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('polizas/<int:poliza_id>/calendario-primas/', CalendarioPrimasPolizaView.as_view(), name='poliza-calendario-primas'),
    path('webhooks/zohosign/', ZohoSignWebhookView.as_view(), name='webhook-zohosign'),
    path('clientes/import-csv/', ImportarClientesCSVView.as_view(), name='import-clientes-csv'),
    path('polizas/import-csv/', ImportarPolizasCSVView.as_view(), name='import-polizas-csv'),
    path('polizas/import-excel/', ImportarPolizasExcelView.as_view(), name='import-polizas-excel'),
    path('polizas/import-excel/undo/', UndoImportExcelView.as_view(), name='undo-import-excel'),
    path('users/<int:user_id>/stats/', UserPolicyStatsView.as_view(), name='user-policy-stats'),
    path('users/<int:user_id>/stats/<str:category>/', UserPolicyStatsDetailView.as_view(), name='user-policy-stats-detail'),
    path('', include(router.urls)),
]

